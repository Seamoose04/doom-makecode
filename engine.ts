interface wallInfo {
    texture: MapTexture
    width: number
    startX: number
    height: number
}

type player = {
    x: number
    y: number
    z: number
    a: number //angle left/right
    l: number //angle up/down
}

type span = {
    yt: number //top y
    yb: number //bottom y
}

type visplane = {
    height: number
    textureId: number
    lightLevel: number
    minX: number
    maxX: number
}

class Engine {
    miniMapScale: number
    pFrameTime: number
    ctx: Image
    map: Minimap
    levelData: WAD
    currentLevel: number
    player: player
    sinLookup: number[]
    cosLookup: number[]
    clipping: span[]
    constructor(levelData?: WAD, currentLevel?: number) {
        this.ctx = image.create(160, 120)
        this.map = new Minimap(60, 40)

        if (levelData) {
            this.levelData = levelData
        }
        if (currentLevel != null) {
            this.currentLevel = currentLevel
        } else {
            this.currentLevel = 0
        }
        this.sinLookup = []
        this.cosLookup = []

        let playerStart: Thing
        for (let thing of this.levelData.things[this.currentLevel]) {
            if (thing.thingType == 1) {
                playerStart = thing
                break
            }
        }

        this.player = {
            x: playerStart.xPos,
            y: playerStart.yPos,
            z: 40,
            a: 0,
            l: 0
        }

        this.clipping = []
        this.clearClipping()

        for (let i = 0; i < 360; i++) {
            this.sinLookup.push(Math.sin(i / 180.0 * Math.PI))
            this.cosLookup.push(Math.cos(i / 180.0 * Math.PI))
        }
        this.pFrameTime = game.runtime()

        this.miniMapScale = 80
    }

    private clearClipping() {
        for (let i = 0; i < 160; i++) {
            this.clipping[i] = {
                yt: 120,
                yb: 0
            }
        }
    }

    private traverseAndRender(nodeIdBinary: string) {
        if (nodeIdBinary[0] == "1") {
            this.renderSubsector(parseInt(nodeIdBinary.substr(1), 2))
            return
        }

        const node = this.levelData.nodes[this.currentLevel][parseInt(nodeIdBinary, 2)]
        const orderedChildren = node.getOrderedChildren(this.player)
        this.traverseAndRender(orderedChildren.front)
        this.traverseAndRender(orderedChildren.back)
    }

    private renderSubsector(subsectorId: number) {
        const subsector = this.levelData.subsectors[this.currentLevel][subsectorId]
        const segStart = subsector.firstSegId
        const segEnd = segStart + subsector.segCount

        for (let segIndex = segStart; segIndex < segEnd; segIndex++) {
            const seg = this.levelData.segs[this.currentLevel][segIndex]
            this.renderSeg(seg)
        }
    }

    private renderSeg(seg: Seg) {
        const front = ()
        const start = this.levelData.vertexes[this.currentLevel][seg.startVertexId]
        const end = this.levelData.vertexes[this.currentLevel][seg.endVertexId]

        const linedef = this.levelData.linedefs[this.currentLevel][seg.linedefId]
        this.map.img.drawLine((start.x - this.player.x) / this.miniMapScale + 20, (start.y - this.player.y) / -this.miniMapScale + 30, (end.x - this.player.x) / this.miniMapScale + 20, (end.y - this.player.y) / -this.miniMapScale + 30, display.Color.WHITE)
        // if ((linedef.flags & LinedefFlag.TWO_SIDED) != 0) {
        //     return
        // }
        if (linedef.frontSidedefId >= 0 && linedef.backSidedefId >= 0) {
            const frontSidedef = this.levelData.sidedefs[this.currentLevel][linedef.frontSidedefId]
            const frontSector = this.levelData.sectors[this.currentLevel][frontSidedef.sectorNumber]
            const backSidedef = this.levelData.sidedefs[this.currentLevel][linedef.backSidedefId]
            const backSector = this.levelData.sectors[this.currentLevel][backSidedef.sectorNumber]
            if (frontSector.ceilingHeight != backSector.ceilingHeight) {
                this.drawWall(frontSidedef.upperTexName,
                frontSector.floorTexName, Math.min(frontSector.ceilingHeight, backSector.ceilingHeight),
                frontSector.ceilingTexName, Math.max(frontSector.ceilingHeight, backSector.ceilingHeight),
                start, end)
            }
            // this.drawWall(this.levelData.sidedefs[this.currentLevel][linedef.frontSidedefId], start, end)
        }
        // if (linedef.backSidedefId >= 0) {
        //     this.drawWall(this.levelData.sidedefs[this.currentLevel][linedef.backSidedefId], start, end)
        // }
    }

    private drawWall(texName: string, floorTexName: string, floorHeight: number, ceilingTexName: string, ceilingHeight: number, start: Vertex, end: Vertex) {
        // 2) Look up the sector and texture
        const texture = engine.levelData.texture1.textures.find((t) => {
            return t.name === texName;
        });

        // 3) Calculate horizontal and vertical map distances
        //    a) Wall width in map units
        const wallWidth = dist(start.x, start.y, end.x, end.y);
        //    b) Wall height in map units
        const wallHeight = ceilingHeight - floorHeight;

        // 4) Transform the wall's start and end points into camera space
        //    (player.x, player.y is camera location; player.a is angle)
        const SN = this.sinLookup[this.player.a];
        const CS = this.cosLookup[this.player.a];

        // Start point (floor + ceiling)
        let x1 = (start.x - this.player.x) * CS - (start.y - this.player.y) * SN;
        let y1 = (start.y - this.player.y) * CS + (start.x - this.player.x) * SN;
        let z1 = (floorHeight - this.player.z);  // floor
        let z3 = z1 + wallHeight;                       // ceiling

        // End point (floor + ceiling)
        let x2 = (end.x - this.player.x) * CS - (end.y - this.player.y) * SN;
        let y2 = (end.y - this.player.y) * CS + (end.x - this.player.x) * SN;
        let z2 = (floorHeight - this.player.z);
        let z4 = z2 + wallHeight;

        // 5) Clip if behind the player
        //    If both behind, skip
        if (y1 < 1 && y2 < 1) {
            return;
        }
        if (y1 < 1) {
            // Clip floor
            const clippedB = this.clipBehindPlayer(x1, y1, z1, x2, y2, z2);
            // Clip ceiling
            const clippedT = this.clipBehindPlayer(x1, y1, z3, x2, y2, z4);
            x1 = clippedB.x1; y1 = clippedB.y1; z1 = clippedB.z1;
            z3 = clippedT.z1;
        }
        if (y2 < 1) {
            const clippedB = this.clipBehindPlayer(x2, y2, z2, x1, y1, z1);
            const clippedT = this.clipBehindPlayer(x2, y2, z4, x1, y1, z3);
            x2 = clippedB.x1; y2 = clippedB.y1; z2 = clippedB.z1;
            z4 = clippedT.z1;
        }

        // 6) Project to screen space (simple perspective)
        //    screenX = (x / y) * someScale + screenCenter
        //    screenY = (z / y) * someScale + screenCenter
        const scale = 200;  // Example scale factor
        const screenCenterX = 80;
        const screenCenterY = 60;

        const sX1 = (x1 / y1) * scale + screenCenterX;
        const sY1 = (z1 / y1) * scale + screenCenterY;
        const sX3 = (x1 / y1) * scale + screenCenterX;
        const sY3 = (z3 / y1) * scale + screenCenterY;

        const sX2 = (x2 / y2) * scale + screenCenterX;
        const sY2 = (z2 / y2) * scale + screenCenterY;
        const sX4 = (x2 / y2) * scale + screenCenterX;
        const sY4 = (z4 / y2) * scale + screenCenterY;

        // 7) Calculate pseudo-colors for ceiling/floor fill
        const cColor = ceilingTexName.charCodeAt(0) % 4 + 1;
        const fColor = floorTexName.charCodeAt(0) % 4 + 1;

        // 8) Now call the function that draws columns from left to right
        //    We'll define:
        //      - the bottom edges (b1, b2) = floor
        //      - the top edges (t1, t2)   = ceiling
        //      - the full map-space width/height for texture
        this.drawWallColumns(
            sX1, sX2,           // screen x for left & right side
            sY1, sY2,           // floor line
            sY3, sY4,           // ceiling line
            texture,
            wallWidth,          // the map units wide
            wallHeight,         // the map units tall
            cColor,
            fColor
        );
    }


    private drawWallColumns(
        sx1: number, sx2: number,  // screen-space x of left & right
        syFloorLeft: number, syFloorRight: number,   // bottom edges
        syCeilLeft: number, syCeilRight: number,    // top edges
        texture: MapTexture,
        wallWidth: number,    // in map units
        wallHeight: number,   // in map units
        ceilingColor: number,
        floorColor: number
    ) {
        // 1) Basic info
        const texWidth = texture.width;
        const texHeight = texture.height;

        // 2) Figure out which one is "left" vs. "right" on screen
        let leftX = Math.floor(Math.min(sx1, sx2));
        let rightX = Math.floor(Math.max(sx1, sx2));
        if (leftX === rightX) return;

        // 3) Clip horizontally to [0..160), or your screen's actual width
        leftX = Math.max(leftX, 0);
        rightX = Math.min(rightX, 159);

        // 4) Precompute U-range for horizontal texture mapping
        //    If you want left side to be u=0 and right side to be u=wallWidth:
        //    But we must ensure we handle if sx1 > sx2, etc.
        //    We'll define a linear interpolation between (leftX -> uLeft) and (rightX -> uRight).
        //    a) If sx1 < sx2 => normal, else we swap
        let uLeft = 0;
        let uRight = wallWidth;  // 1 unit = 1 pixel horizontally

        // If sx1 > sx2, flip them so that as x goes from leftX to rightX, u goes from 0..wallWidth
        if (sx1 > sx2) {
            [uLeft, uRight] = [uRight, uLeft];
        }

        // 5) For each column in [leftX..rightX], do vertical draw
        for (let screenX = leftX; screenX <= rightX; screenX++) {

            // Fraction along the horizontal from leftX..rightX
            const alphaX = (screenX - leftX) / (rightX - leftX);

            // Interpolate U in map units: 0..wallWidth
            // If sx1 < sx2, alphaX=0 => u=0, alphaX=1 => u=wallWidth
            // If sx1 > sx2, alphaX=0 => u=wallWidth, alphaX=1 => u=0
            let u = uLeft + alphaX * (uRight - uLeft);
            // Wrap horizontally
            let texCol = Math.floor(u) % texWidth;
            if (texCol < 0) texCol += texWidth;

            // Interpolate the floor & ceiling for this column
            // We'll do a separate alpha for bottom edges:
            // screenX is between sx1..sx2; alphaX is how far along that is
            // bottom
            const colFloor = syFloorLeft + alphaX * (syFloorRight - syFloorLeft);
            // top
            const colCeil = syCeilLeft + alphaX * (syCeilRight - syCeilLeft);

            // figure out which is actually smaller or bigger
            const screenBottom = Math.max(0, Math.min(colFloor, colCeil));
            const screenTop = Math.min(119, Math.max(colFloor, colCeil));

            // If this column is off-screen vertically, skip
            if (screenBottom >= screenTop) continue;

            // For each row from screenBottom..screenTop
            // We want 1 map unit vertically = 1 texture pixel. 
            // So if the total "wallHeight" in map units is spanned by (colTop-colBottom) in screen space:
            const colHeight = (colCeil - colFloor);
            // We treat 0..wallHeight as the full texture range in V.
            // for y in [colFloor..colCeil], fractionY = (y - colFloor)/colHeight => v in [0..wallHeight]

            for (let screenY = Math.floor(screenBottom); screenY <= Math.floor(screenTop); screenY++) {
                const alphaY = (screenY - colFloor) / (colHeight || 1);
                // map units up the wall:
                const v = alphaY * wallHeight;
                let texRow = Math.floor(v) % texHeight;
                if (texRow < 0) texRow += texHeight;

                // fetch the pixel from the texture
                const texPixel = texture.pixels[texCol][texRow];

                // Use your palette/colormap if needed
                const color = this.levelData.playpal[0].grays[
                    this.levelData.colormaps[0].map[texPixel]
                ];

                // Draw at (screenX, 120 - screenY), or whatever your coordinate system is
                this.ctx.setPixel(screenX, 120 - screenY, color);
            }

            const clippedC = this.clipSegment(screenX, { yb: screenTop, yt: 120 });
            if (clippedC) {
                for (let y = clippedC.yb; y < clippedC.yt; y++) {
                    this.ctx.setPixel(screenX, 120 - y, ceilingColor);
                }
            }

            const clippedF = this.clipSegment(screenX, { yb: 0, yt: screenBottom });
            if (clippedF) {
                for (let y = clippedF.yb; y < clippedF.yt; y++) {
                    this.ctx.setPixel(screenX, 120 - y, floorColor);
                }
            }
        }
    }

    private clipSegment(x: number, segment: span): span | null {
        let clear = this.clipping[x];
        let newTop = segment.yt;
        let newBottom = segment.yb;

        if (segment.yt < clear.yb || segment.yb > clear.yt) {
            return null
        }

        if (segment.yb < clear.yb) {
            newBottom = clear.yb + 1
        }
        if (segment.yt > clear.yt) {
            newTop = clear.yt - 1
        }

        return { yt: newTop, yb: newBottom }
    }

    private addClipRange(x: number, segment: span) {
        let clear = this.clipping[x];
        let newTop = segment.yt;
        let newBottom = segment.yb;

        if (segment.yt < clear.yb || segment.yb > clear.yt) {
            return
        }

        if (segment.yb < clear.yb) {
            newBottom = clear.yb + 1
        }
        if (segment.yt > clear.yt) {
            newTop = clear.yt - 1
        }

        clear.yt = Math.min(clear.yt, newBottom)
        clear.yb = Math.max(clear.yb, newTop)
    }

    private clipBehindPlayer(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): { x1: number, y1: number, z1: number } {
        let s = (0.1 - y1) / (y2 - y1);
        x1 = x1 + s * (x2 - x1)
        y1 = y1 + s * (y2 - y1)
        z1 = z1 + s * (z2 - z1)
        return { x1: x1, y1: y1, z1: z1 }
    }

    draw() {
        this.clearClipping()
        this.traverseAndRender("0" + intToBinary(this.levelData.nodes[this.currentLevel].length - 1))
        this.map.img.setPixel(20, 30, display.Color.GRAY)
    }

    updateFrame() {
        scene.setBackgroundImage(this.ctx)
        this.map.updateSprite()
    }

    clear() {
        this.ctx.fill(display.Color.TRANSPARENT)
        this.map.clearMap()
    }

    movePlayer(cx: number, cy: number, c: boolean, speed: number) {
        if (c) {
            //strafe left/right
            let dx = this.sinLookup[this.player.a] * speed
            let dy = this.cosLookup[this.player.a] * speed
            if (cx > 0) {
                this.player.x += dy
                this.player.y -= dx
            }
            if (cx < 0) {
                this.player.x -= dy
                this.player.y += dx
            }

            //loop up/down
            if (cy > 0) {
                this.player.l += 1
            }
            if (cy < 0) {
                this.player.l -= 1
            }
        } else {
            //look left/right
            if (cx > 0) {
                this.player.a++
                if (this.player.a >= 360) {
                    this.player.a -= 360
                }
            }
            if (cx < 0) {
                this.player.a--
                if (this.player.a < 0) {
                    this.player.a += 360
                }
            }
 
            //move forward back
            let dx = this.sinLookup[this.player.a] * speed
            let dy = this.cosLookup[this.player.a] * speed
            if (cy > 0) {
                this.player.x -= dx
                this.player.y -= dy
            }
            if (cy < 0) {
                this.player.x += dx
                this.player.y += dy
            }
        }
    }

    updateFPS() {
        let frameTime = game.runtime()
        info.setScore(1000 / (frameTime - this.pFrameTime))
        this.pFrameTime = frameTime
    }
}