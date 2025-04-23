type hex = {
    nibbles: string[2]
}

function intToBinary(num: number): string {
    let binary = "";
    while (num > 0) {
        binary = (num % 2) + binary;
        num = Math.floor(num / 2);
    }
    return binary;
}

function hexToInt(data: hex): number {
    return parseInt(data.nibbles, 16)
}

function hexToUnsignedInt8Arr(data: hex[]): number[] {
    let arr: number[] = []
    for (let i = 0; i < data.length; i++) {
        arr.push(hexToInt(data[i]))
    }
    return arr
}

function hexToSignedInt16(data: hex[]): number {
    let hexString: string = ""
    for (let i = 0; i < data.length; i++) {
        hexString += data[i].nibbles
    }
    return Buffer.fromHex(hexString).getNumber(NumberFormat.Int16LE, 0)
}

function hexToUnsignedInt16(data: hex[]): number {
    let hexString: string = ""
    for (let i = 0; i < data.length; i++) {
        hexString += data[i].nibbles
    }
    return Buffer.fromHex(hexString).getNumber(NumberFormat.UInt16LE, 0)
}

function hexToUnsignedInt32(data: hex[]): number {
    let hexString: string = ""
    for (let i = 0; i < data.length; i++) {
        hexString += data[i].nibbles
    }
    return Buffer.fromHex(hexString).getNumber(NumberFormat.UInt32LE, 0)
}

function hexToSignedInt32(data: hex[]): number {
    let hexString: string = ""
    for (let i = 0; i < data.length; i++) {
        hexString += data[i].nibbles
    }
    return Buffer.fromHex(hexString).getNumber(NumberFormat.Int32LE, 0)
}

function hexToSignedInt16Arr(data: hex[]): number[] {
    let arr: number[] = []
    for (let i = 0; i < data.length; i += 2) {
        arr.push(hexToSignedInt16(data.slice(i, i + 2)))
    }
    return arr
}

function hexToUnsignedInt32Arr(data: hex[]): number[] {
    let arr: number[] = []
    for (let i = 0; i < data.length; i += 4) {
        arr.push(hexToUnsignedInt32(data.slice(i, i + 4)))
    }
    return arr
}

function hexToSignedInt32Arr(data: hex[]): number[] {
    let arr: number[] = []
    for (let i = 0; i < data.length; i += 4) {
        arr.push(hexToSignedInt32(data.slice(i, i + 4)))
    }
    return arr
}

function hexToBinaryString(data: hex[]): string {
    let out = ""
    for (let i = data.length - 1; i >= 0; i--) {
        let binaryString: string = intToBinary(hexToInt(data[i]))
        while (binaryString.length < 8) {
            binaryString = "0" + binaryString
        }
        out += binaryString
    }

    return out
}

function hexToChar(data: hex): string {
    return String.fromCharCode(hexToInt(data))
}

function hexToString(data: hex[]): string {
    let text = ""
    for (let i = 0; i < data.length; i++) {
        let char = hexToChar(data[i])
        if (char != "\u0000") {
            text += char.toUpperCase()
        }
    }
    return text
}

function hexToBoolArr(data: hex): boolean[] {
    let num = hexToInt(data)
    let arr: boolean[] = []
    for (let i = 0; i < 8; i++) {
        if (num - Math.pow(2, i) >= 0) {
            arr.push(true)
        } else {
            arr.push(false)
        }
    }
    return arr
}

type lump = {
    name: string
    offset: number
    size: number
}



class WAD {
    header: string
    vertexes: Vertex[][]
    things: Thing[][]
    linedefs: Linedef[][]
    sidedefs: Sidedef[][]
    segs: Seg[][]
    subsectors: Subsector[][]
    nodes: Node[][]
    sectors: Sector[][]
    rejects: RejectTable[]
    blockMaps: BlockMap[]
    playpal: Palette[]
    colormaps: Colormap[]
    texture1: Texture
    texture2: Texture
    pnames: PNames
    patches: Dict<string, PatchHeader>

    constructor(file: string) {
        let data: hex[] = [];
        file = file.split("\n").join("")
        for (let i = 0; i < file.length - 1; i += 2) {
            data.push({ nibbles: file.slice(i, i+2) })
        }

        this.header = hexToString(data.slice(0, 4))
        let numLumps = hexToSignedInt32(data.slice(4, 8))
        let offsetToLumps = hexToSignedInt32(data.slice(8, 12))

        let lumps: lump[] = []
        for (let i = 0; i < numLumps; i++) {
            let offset = offsetToLumps + i * 16
            let lumpOffset = hexToSignedInt32(data.slice(offset, offset + 4))
            let lumpSize = hexToSignedInt32(data.slice(offset + 4, offset + 8))
            let lumpName = hexToString(data.slice(offset + 8, offset + 16))
            lumps.push({name: lumpName, offset: lumpOffset, size: lumpSize})
        }

        this.vertexes = []
        this.things = []
        this.linedefs = []
        this.sidedefs = []
        this.segs = []
        this.subsectors = []
        this.nodes = []
        this.sectors = []
        this.rejects = []
        this.blockMaps = []
        this.patches = new Dict()

        let fStart = false
        let fEnd = false
        let pStart = false
        let pEnd = false

        for (let part of lumps) {
            let lumpData: hex[] = data.slice(part.offset, part.offset + part.size)
            let name = part.name
            if (name.includes("VERTEXES")) {
                this.vertexes.push(Vertex.fromLump(lumpData))
                continue
            }
            if (name.includes("THINGS")) {
                this.things.push(Thing.fromLump(lumpData))
                continue
            }
            if (name.includes("LINEDEFS")) {
                this.linedefs.push(Linedef.fromLump(lumpData))
                continue
            }
            if (name.includes("SIDEDEFS")) {
                this.sidedefs.push(Sidedef.fromLump(lumpData))
                continue
            }
            if (name.includes("SEGS")) {
                this.segs.push(Seg.fromLump(lumpData))
                continue
            }
            if (name.includes("SSECTORS")) {
                this.subsectors.push(Subsector.fromLump(lumpData))
                continue
            }
            if (name.includes("SECTORS")) {
                this.sectors.push(Sector.fromLump(lumpData))
                continue
            }
            if (name.includes("NODES")) {
                this.nodes.push(Node.fromLump(lumpData))
                continue
            }
            if (name.includes("REJECT")) {
                this.rejects.push(RejectTable.fromLump(lumpData))
                continue
            }
            if (name.includes("BLOCKMAP")) {
                // this.blockMaps.push(BlockMap.fromLump(lumpData))
                continue
            }
            if (name.includes("PLAYPAL")) {
                this.playpal = Palette.fromLump(lumpData)
                continue
            }
            if (name.includes("COLORMAP")) {
                this.colormaps = Colormap.fromLump(lumpData)
                continue
            }
            if (name.includes("TEXTURE1")) {
                this.texture1 = Texture.fromLump(lumpData)
                continue
            }
            if (name.includes("TEXTURE2")) {
                this.texture2 = Texture.fromLump(lumpData)
                continue
            }
            if (name.includes("PNAMES")) {
                this.pnames = PNames.fromLump(lumpData)
                continue
            }
            if (name.includes("P_START")) {
                pStart = true
                continue
            }
            if (name.includes("P_END")) {
                pEnd = true
                continue
            }
            if (name.includes("F_START")) {
                fStart = true
                continue
            }
            if (name.includes("F_END")) {
                fEnd = true
                continue
            }
            if (fStart && !fEnd) {
                // add flat data
            }
            if (pStart && !pEnd) {
                if (name.includes("P1_START") || name.includes("P1_END") || name.includes("P2_START") || name.includes("P2_END")) {
                    continue
                }
                // add patches
                let patch = PatchHeader.fromLump(lumpData)
                patch.setPosts(part.offset, data)
                this.patches.set(name, patch)
            }
        }

        for (let texture of this.texture1.textures) {
            texture.pixels = this.mapTextureToPixels(texture)
        }
    }

    private mapTextureToPixels(texture: MapTexture): number[][] {
        let pixels: number[][] = []
        for (let i = 0; i < texture.width; i++) {
            pixels[i] = newArray<number>(texture.width)
        }
        for (let patch of texture.patches) {
            let patchName = this.pnames.names[patch.patchId]
            let rawHeader = this.patches.get(patchName)
            for (let i = 0; i < rawHeader.posts.length; i++) {
                for (let post of rawHeader.posts[i]) {
                    let rowstart = post.topDelta
                    let pixelCount = post.length
                    for (let j = 0; j < pixelCount; j++) {
                        let x = i + patch.originX
                        let y = j + patch.originY + rowstart
                        if (x >= 0 && x < pixels.length && y >= 0 && y < pixels[0].length) {
                            pixels[x][y] = post.data[j]
                        }
                    }
                }
            }
        }
        return pixels
    }
}