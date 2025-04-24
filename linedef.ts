enum LinedefFlag {
    BLOCKING = 1,
    BLOCK_MONSTERS = 2,
    TWO_SIDED = 4,
    UNPEGGED_TOP = 8,
    UNPEGGED_BOTTOM = 16,
    SECRET = 32,
    SOUND_BLOCK = 64,
    DONT_DRAW = 128,
    MAPPED = 256
}

class Linedef {
    startVertexId: number
    endVertexId: number
    flags: number
    special: number
    tag: number
    frontSidedefId: number
    backSidedefId: number
    constructor(startVertexId: number, endVertexId: number, flags: number, special: number, tag: number, frontSidedefId: number, backSidedefId: number) {
        this.startVertexId = startVertexId
        this.endVertexId = endVertexId
        this.flags = flags
        this.special = special
        this.tag = tag
        this.frontSidedefId = frontSidedefId
        this.backSidedefId = backSidedefId
    }

    static fromLump(data: hex[]): Linedef[] {
        let linedefs: Linedef[] = []
        for (let i = 0; i < data.length - 1; i += 14) {
            linedefs.push(new Linedef(
                hexToSignedInt16(data.slice(i, i + 2)),
                hexToSignedInt16(data.slice(i + 2, i + 4)),
                hexToSignedInt16(data.slice(i + 4, i + 6)),
                hexToSignedInt16(data.slice(i + 6, i + 8)),
                hexToSignedInt16(data.slice(i + 8, i + 10)),
                hexToSignedInt16(data.slice(i + 10, i + 12)),
                hexToSignedInt16(data.slice(i + 12, i + 14))
            ))
        }
        return linedefs
    }
}