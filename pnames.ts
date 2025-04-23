class PNames {
    numPatches: number
    names: string[]
    constructor(numPatches: number, names: string[]) {
        this.numPatches = numPatches
        this.names = names
    }
    static fromLump(data: hex[]): PNames {
        let numPatches = hexToSignedInt32(data.slice(0, 4))
        let names: string[] = []
        for (let i = 0; i < numPatches; i++) {
            names.push(hexToString(data.slice(4 + i * 8, 4 + i * 8 + 8)))
        }
        return new PNames(numPatches, names)
    }
}