// Add your code here
class Subsector {
    segCount: number
    firstSegId: number
    constructor(segCount: number, firstSegId: number) {
        this.segCount = segCount
        this.firstSegId = firstSegId
    }

    static fromLump(data: hex[]): Subsector[] {
        let subsectors: Subsector[] = []
        for (let i = 0; i < data.length - 1; i += 4) {
            subsectors.push(new Subsector(
                hexToSignedInt16(data.slice(i, i + 2)),
                hexToSignedInt16(data.slice(i + 2, i + 4))
            ))
        }
        return subsectors
    }
}