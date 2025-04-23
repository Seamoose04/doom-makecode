enum ThingFlags {
    LEVEL1_2 = 1,
    LEVEL3 = 2,
    LEVEL4_5 = 4,
    DEAF = 8,
    NOT_SINGLE_PLAYER = 16
}

class Thing {
    xPos: number
    yPos: number
    angleFacing: number
    thingType: number
    flags: number
    constructor(xPos: number, yPos: number, angleFacing: number, thingType: number, flags: number) {
        this.xPos = xPos
        this.yPos = yPos
        this.angleFacing = angleFacing
        this.thingType = thingType
        this.flags = flags
    }
    static fromLump(data: hex[]) {
        let things: Thing[] = []
        for (let i = 0; i < data.length - 1; i += 10) {
            things.push(new Thing(
                hexToSignedInt16(data.slice(i, i + 2)),
                hexToSignedInt16(data.slice(i + 2, i + 4)),
                hexToSignedInt16(data.slice(i + 4, i + 6)),
                hexToSignedInt16(data.slice(i + 6, i + 8)),
                hexToSignedInt16(data.slice(i + 8, i + 10))
            ))
        }
        return things
    }
}