class Colormap {
    map: number[]
    constructor(map: number[]) {
        this.map = map
    }
    static fromLump(data: hex[]): Colormap[] {
        let colormaps: Colormap[] = []
        for (let i = 0; i < 34; i++) {
            let map: number[] = []
            for (let j = 0; j < 256; j++) {
                map.push(hexToInt(data[i*256 + j]))
            }
            colormaps.push(new Colormap(map))
        }
        return colormaps
    }
}

