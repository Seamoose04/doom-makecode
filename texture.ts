class Patch {
    originX: number
    originY: number
    patchId: number
    constructor(originX: number, originY: number, patchId: number) {
        this.originX = originX
        this.originY = originY
        this.patchId = patchId
    }
}

class MapTexture {
    name: string
    masked: boolean
    width: number
    height: number
    patchCount: number
    patches: Patch[]
    pixels: number[][]
    constructor(name: string, masked: boolean, width: number, height: number, patchCount: number, patches: Patch[]) {
        this.name = name
        this.masked = masked
        this.width = width
        this.height = height
        this.patchCount = patchCount
        this.patches = patches
    }
}

class Texture {
    numTextures: number
    textureOffsets: number[]
    textures: MapTexture[]
    constructor(numTextures: number, textureOffsets: number[], textures: MapTexture[]) {
        this.numTextures = numTextures
        this.textureOffsets = textureOffsets
        this.textures = textures
    }

    static fromLump(data: hex[]): Texture {
        let numTextures = hexToSignedInt32(data.slice(0, 4))
        let textureOffsets = hexToSignedInt32Arr(data.slice(4, 4 * numTextures + 4)) 
        let textures: MapTexture[] = []
        for (let i = 0; i < numTextures; i++) {
            let offset = textureOffsets[i]
            let name = hexToString(data.slice(offset, offset + 8))
            let masked = hexToBinaryString(data.slice(offset + 8, offset + 12)) == "00000000000000000000000000000001"
            let width = hexToSignedInt16(data.slice(offset + 12, offset + 14))
            let height = hexToSignedInt16(data.slice(offset + 14, offset + 16))
            let patchCount = hexToSignedInt16(data.slice(offset + 20, offset + 22))
            let patches: Patch[] = []
            for (let j = 0; j < patchCount; j++) {
                let patchOffset = offset + 22 + j * 10
                patches.push(new Patch(
                    hexToSignedInt16(data.slice(patchOffset, patchOffset + 2)),
                    hexToSignedInt16(data.slice(patchOffset + 2, patchOffset + 4)),
                    hexToSignedInt16(data.slice(patchOffset + 4, patchOffset + 6)),
                ))
            }
            textures.push(new MapTexture(
                name,
                masked,
                width,
                height,
                patchCount,
                patches
            ))
        }
        return new Texture(
            numTextures,
            textureOffsets,
            textures
        )
    }
}