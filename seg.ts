// Add your code here
class Seg {
    startVertexId: number
    endVertexId: number
    angle: number
    linedefId: number
    direction: number //0=same as Linedef, 1=opposite of Linedef
    offset: number
    constructor(startVertexId: number, endVertexId: number, angle: number, linedefId: number, direction: number, offset: number) {
        this.startVertexId = startVertexId
        this.endVertexId = endVertexId
        this.angle = angle
        this.linedefId = linedefId
        this.direction = direction
        this.offset = offset
    }

    static fromLump(data: hex[]): Seg[] {
        let segs: Seg[] = []
        for (let i = 0; i < data.length - 1; i += 12) {
            segs.push(new Seg(
                hexToSignedInt16(data.slice(i, i + 2)),
                hexToSignedInt16(data.slice(i + 2, i + 4)),
                hexToSignedInt16(data.slice(i + 4, i + 6)),
                hexToSignedInt16(data.slice(i + 6, i + 8)),
                hexToSignedInt16(data.slice(i + 8, i + 10)),
                hexToSignedInt16(data.slice(i + 10, i + 12)),
            ))
        }
        return segs
    }
}