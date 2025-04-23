// Add your code here
class Sector {
    floorHeight: number
    ceilingHeight: number
    floorTexName: string
    ceilingTexName: string
    lightLevel: number
    specialType: number
    tagId: number
    constructor(floorHeight: number, ceilingHeight: number, floorTexName: string, ceilingTexName: string, lightLevel: number, specialType: number, tagId: number) {
        this.floorHeight = floorHeight
        this.ceilingHeight = ceilingHeight
        this.floorTexName = floorTexName
        this.ceilingTexName = ceilingTexName
        this.lightLevel = lightLevel
        this.specialType = specialType
        this.tagId = tagId
    }

    static fromLump(data: hex[]): Sector[] {
        let sectors: Sector[] = []
        for (let i = 0; i < data.length - 1; i += 26) {
            sectors.push(new Sector(
                hexToSignedInt16(data.slice(i, i + 2)),
                hexToSignedInt16(data.slice(i + 2, i + 4)),
                hexToString(data.slice(i + 4, i + 12)),
                hexToString(data.slice(i + 12, i + 20)),
                hexToSignedInt16(data.slice(i + 20, i + 22)),
                hexToSignedInt16(data.slice(i + 22, i + 24)),
                hexToSignedInt16(data.slice(i + 24, i + 26))
            ))
        }
        return sectors
    }
}