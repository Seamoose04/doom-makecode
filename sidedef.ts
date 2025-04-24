class Sidedef {
    xOff: number
    yOff: number
    upperTexName: string
    middleTexName: string
    lowerTexName: string
    sectorNumber: number
    TEMPCOLOR: number
    constructor(xOff: number, yOff: number, upperTexName: string, middleTexName: string, lowerTexName: string, sectorNumber: number) {
        this.xOff = xOff
        this.yOff = yOff
        this.upperTexName = upperTexName
        this.middleTexName = middleTexName
        this.lowerTexName = lowerTexName
        this.sectorNumber = sectorNumber
        this.TEMPCOLOR = Math.randomRange(1, 14)
    }

    static fromLump(data: hex[]): Sidedef[] {
        let sidedefs: Sidedef[] = []
        for (let i = 0; i < data.length - 1; i += 30) {
            let xOff = hexToSignedInt16(data.slice(i, i + 2))
            let yOff = hexToSignedInt16(data.slice(i + 2, i + 4))
            let upperTexName = hexToString(data.slice(i + 4, i + 12))
            if (upperTexName[0] == "-") {
                upperTexName = null
            }
            let lowerTexName = hexToString(data.slice(i + 12, i + 20))
            if (lowerTexName[0] == "-") {
                lowerTexName = null
            }
            let middleTexName = hexToString(data.slice(i + 20, i + 28))
            if (middleTexName[0] == "-") {
                middleTexName = null
            }
            let sectorNumber = hexToSignedInt16(data.slice(i + 28, i + 30))
            sidedefs.push(new Sidedef(
                xOff,
                yOff,
                upperTexName,
                middleTexName,
                lowerTexName,
                sectorNumber
            ))
        }
        return sidedefs
    }
}