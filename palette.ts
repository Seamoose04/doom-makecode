interface Color {
    r: number
    g: number
    b: number
}

class Palette {
    colors: Color[]
    grays: number[]
    constructor(colors: Color[]) {
        this.colors = []
        this.grays = []
        for (let color of colors) {
            this.colors.push(color)
            this.grays.push(display.toGrayscale(color.r, color.g, color.b))
        }
    }

    static fromLump(data: hex[]): Palette[] {
        let palettes: Palette[] = []
        for (let i = 0; i < 14; i++) {
            let colors: Color[] = []
            for (let j = 0; j < 256; j++) {
                let idx = i * 768 + j * 3
                colors.push({
                    r: hexToInt(data[idx + 0]),
                    g: hexToInt(data[idx + 1]),
                    b: hexToInt(data[idx + 2])
                })
            }
            palettes.push(new Palette(colors))
        }
        return palettes
    }
}