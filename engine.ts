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
        const start = this.levelData.vertexes[this.currentLevel][seg.startVertexId]
        const end = this.levelData.vertexes[this.currentLevel][seg.endVertexId]

        const linedef = this.levelData.linedefs[this.currentLevel][seg.linedefId]
        this.map.img.drawLine((start.x - this.player.x) / this.miniMapScale + 20, (start.y - this.player.y) / -this.miniMapScale + 30, (end.x - this.player.x) / this.miniMapScale + 20, (end.y - this.player.y) / -this.miniMapScale + 30, display.Color.WHITE)

        if ((linedef.flags & LinedefFlag.TWO_SIDED) != 0) {
            if (linedef.frontSidedefId >= 0 && linedef.backSidedefId >= 0) {
                const frontSidedef = this.levelData.sidedefs[this.currentLevel][linedef.frontSidedefId]
                const frontSector = this.levelData.sectors[this.currentLevel][frontSidedef.sectorNumber]
                const backSidedef = this.levelData.sidedefs[this.currentLevel][linedef.backSidedefId]
                const backSector = this.levelData.sectors[this.currentLevel][backSidedef.sectorNumber]
                if (frontSector.ceilingHeight > backSector.ceilingHeight) {
                    this.drawWall(
                        frontSidedef.upperTexName,
                        null, backSector.ceilingHeight,
                        frontSector.ceilingTexName, frontSector.ceilingHeight,
                        start, end
                    )
                }
                if (frontSector.floorHeight < backSector.floorHeight) {
                    this.drawWall(
                        frontSidedef.lowerTexName,
                        frontSector.floorTexName, backSector.floorHeight,
                        null, frontSector.floorHeight,
                        start, end
                    )
                }
            }
        } else {
            if (linedef.frontSidedefId >= 0) {
                const frontSidedef = this.levelData.sidedefs[this.currentLevel][linedef.frontSidedefId]
                const frontSector = this.levelData.sectors[this.currentLevel][frontSidedef.sectorNumber]
                this.drawWall(
                    frontSidedef.middleTexName,
                    frontSector.floorTexName, frontSector.floorHeight,
                    frontSector.ceilingTexName, frontSector.ceilingHeight,
                    start, end
                )
            }
            if (linedef.backSidedefId >= 0) {
                const backSidedef = this.levelData.sidedefs[this.currentLevel][linedef.frontSidedefId]
                const backSector = this.levelData.sectors[this.currentLevel][backSidedef.sectorNumber]
                this.drawWall(
                    backSidedef.middleTexName,
                    backSector.floorTexName, backSector.floorHeight,
                    backSector.ceilingTexName, backSector.ceilingHeight,
                    start, end
                )
            }
        }
    }

    private drawWall(
        texName: string,
        floorTexName: string = null,
        floorHeight: number,
        ceilingTexName: string = null,
        ceilingHeight: number,
        start: Vertex,
        end: Vertex
      ) {
        // ——————————————————————————————
        // 1) Setup
        const texture = this.levelData.texture1.textures.find(t => t.name === texName);
        const texW = texture.width, texH = texture.height;
        const dx = end.x - start.x, dy = end.y - start.y;
        const wallWidth  = Math.sqrt(dx*dx + dy*dy)
        const wallHeight = ceilingHeight - floorHeight;
        const pal = this.levelData.playpal[0].grays;
        const cm  = this.levelData.colormaps[0].map;
      
        // camera‐space transform
        const SN = this.sinLookup[this.player.a], CS = this.cosLookup[this.player.a];
        let x1 = (start.x - this.player.x) * CS - (start.y - this.player.y) * SN,
            y1 = (start.y - this.player.y) * CS + (start.x - this.player.x) * SN,
            z1 = floorHeight - this.player.z,
            z3 = z1 + wallHeight;
      
        let x2 = (end.x - this.player.x) * CS - (end.y - this.player.y) * SN,
            y2 = (end.y - this.player.y) * CS + (end.x - this.player.x) * SN,
            z2 = floorHeight - this.player.z,
            z4 = z2 + wallHeight;
      
        // near‐plane clipping
        let uL = 0, uR = wallWidth;
        if (y1 < 1 && y2 < 1) return;
        if (y1 < 1) {
            const clip     = this.clipBehindPlayer(x1, y1, z1, x2, y2, z2);
            const clipTop  = this.clipBehindPlayer(x1, y1, z3, x2, y2, z4);
            const s        = clip.s;
            x1 = clip.x; y1 = clip.y; z1 = clip.z; z3 = clipTop.z;
            uL = uR * s;
        }
        if (y2 < 1) {
            const clip     = this.clipBehindPlayer(x2, y2, z2, x1, y1, z1);
            const clipTop  = this.clipBehindPlayer(x2, y2, z4, x1, y1, z3);
            const s        = 1 - clip.s;
            x2 = clip.x; y2 = clip.y; z2 = clip.z; z4 = clipTop.z;
            uR = uR * s;
        }
      
        // ——————————————————————————————
        // 2) Project endpoints to screen X
        const scale = 200, cx = 80, cy = 60;
        const sx1 = (x1 / y1) * scale + cx;
        const sx2 = (x2 / y2) * scale + cx;
      
        // reciprocals and “height over depth”
        let dL = y1,         dR = y2;
        let invL = 1 / dL,    invR = 1 / dR;
        let zBotL_p = z1 * invL,  zBotR_p = z2 * invR;
        let zTopL_p = z3 * invL,  zTopR_p = z4 * invR;
        let uL_p    = uL * invL,  uR_p    = uR * invR;
      
        // sort so x0 < x1p
        let x0 = sx1, x1p = sx2;
        if (sx2 < sx1) {
            [x0, x1p]      = [sx2, sx1];
            [invL, invR]  = [invR, invL];
            [zBotL_p, zBotR_p] = [zBotR_p, zBotL_p];
            [zTopL_p, zTopR_p] = [zTopR_p, zTopL_p];
            [uL_p, uR_p]  = [uR_p, uL_p];
        }
      
        // integer column bounds
        const xStart = Math.max(0, Math.ceil(x0));
        const xEnd   = Math.min(159, Math.floor(x1p));
        const span   = xEnd - xStart;
        if (span <= 0) return;
      
        // ——————————————————————————————
        // 3) Per‐column loop using t
        for (let x = x0; x <= x1p; x++) {
            x = Math.round(x);
            if (x < xStart || x >= xEnd) {
                continue
            }
            const t    = (x - x0) / (x1p - x0);
        
            // perspective‐correct interpolation
            const invZ     = invL + t * (invR - invL);
            const zBot_p   = zBotL_p + t * (zBotR_p - zBotL_p);
            const zTop_p   = zTopL_p + t * (zTopR_p - zTopL_p);
            const uOZ      = uL_p    + t * (uR_p    - uL_p);
        
            // actual depth, texture X
            const z        = 1 / invZ;
            let   u        = (uOZ * z) % texW;
            if (u < 0) u   += texW;
            const tx       = Math.min(texW - 1, u | 0);
        
            // screen y‐range
            const floorY = zBot_p * scale + cy;
            const ceilY = zTop_p * scale + cy;

            const bottom = Math.max(0,   Math.min(floorY, ceilY));
            const top = Math.min(119, Math.max(floorY, ceilY));
        
            // 3a) wall span
            const seg = this.clipSegment(x, { yb: bottom, yt: top });
            if (seg) {
                const yStart = Math.min(floorY, ceilY);
                const yEnd   = Math.max(floorY, ceilY);
                const h      = yEnd - yStart;
                for (let yy = Math.ceil(yStart); yy <= yEnd; yy++) {
                    yy = Math.round(yy);
                    if (yy < bottom || yy >= top) {
                        continue;
                    }
                    const beta = (yy - yStart) / h;
                    let   ty   = ((beta * texH) | 0) % texH;
                    if (ty < 0) ty += texH;
                    const pix   = texture.pixels[tx][ty];
                    const color = pal[cm[pix]];
                    this.ctx.setPixel(x, 120 - yy, color);
                }
            }
        
            // // 3b) ceiling fill
            // if (ceilingTexName) {
            //     const ccol = ceilingTexName.charCodeAt(0) % 4 + 1;
            //     const cseg = this.clipSegment(x, { yb: top, yt: 120 });
            //     if (cseg) {
            //         for (let yy2 = cseg.yb | 0; yy2 < (cseg.yt | 0); yy2++) {
            //             this.ctx.setPixel(x, 120 - yy2, ccol);
            //         }
            //     }
            // }
        
            // // 3c) floor fill
            // if (floorTexName) {
            //     const fcol = floorTexName.charCodeAt(0) % 4 + 1;
            //     const fseg = this.clipSegment(x, { yb: 0, yt: bottom });
            //     if (fseg) {
            //         for (let yy2 = fseg.yb | 0; yy2 < (fseg.yt | 0); yy2++) {
            //             this.ctx.setPixel(x, 120 - yy2, fcol);
            //         }
            //     }
            // }
        }
    }   

    private drawFloorAndCeiling(
        floorTexName: string | null,
        ceilingTexName: string | null,
        floorHeight: number,
        ceilingHeight: number
      ) {
        if (!floorTexName && !ceilingTexName) return;
        const width = 160, height = 120;
        const cx = width / 2, cy = height / 2;
      
        // camera direction
        const dirX = this.cosLookup[this.player.a];
        const dirY = this.sinLookup[this.player.a];
        // perpendicular plane (FOV)
        const planeX = -dirY;
        const planeY = dirX;
      
        // load textures
        const floorTex   = floorTexName   ? this.levelData.texture1.textures.find(t => t.name === floorTexName) : null;
        const ceilTex    = ceilingTexName ? this.levelData.texture1.textures.find(t => t.name === ceilingTexName) : null;
      
        // iterate scanlines
        for (let y = cy + 1; y < height; y++) {
            // row distance from camera
            const p = y - cy;
            const dist = (floorHeight - this.player.z) / p;
        
            // compute start and step of ray in world
            const stepX = dist * (dirX + planeX * ((width - cx) / cx) - (dirX - planeX * ((0 - cx) / cx))) / width;
            const stepY = dist * (dirY + planeY * ((width - cx) / cx) - (dirY - planeY * ((0 - cx) / cx))) / width;
            let floorX = this.player.x + dist * (dirX - planeX);
            let floorY = this.player.y + dist * (dirY - planeY);
        
            for (let x = 0; x < width; x++) {
                if (floorTex) {
                    const tx = ((floorX * floorTex.width) | 0) % floorTex.width;
                    const ty = ((floorY * floorTex.height) | 0) % floorTex.height;
                    const pix = floorTex.pixels[tx][ty];
                    this.ctx.setPixel(x, y, this.levelData.playpal[0].grays[this.levelData.colormaps[0].map[pix]]);
                }
                if (ceilTex) {
                    const tx = ((floorX * ceilTex.width) | 0) % ceilTex.width;
                    const ty = ((floorY * ceilTex.height) | 0) % ceilTex.height;
                    const pix = ceilTex.pixels[tx][ty];
                    this.ctx.setPixel(x, height - y, this.levelData.playpal[0].grays[this.levelData.colormaps[0].map[pix]]);
                }
                floorX += stepX;
                floorY += stepY;
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

    private clipBehindPlayer(
        x1: number, y1: number, z1: number,
        x2: number, y2: number, z2: number
    ): { x: number, y: number, z: number, s: number } {
        const s = (0.1 - y1) / (y2 - y1);
        return {
            x: x1 + s * (x2 - x1),
            y: y1 + s * (y2 - y1),
            z: z1 + s * (z2 - z1),
            s: s
        };
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