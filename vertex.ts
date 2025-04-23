class Vertex {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    static fromLump(data: hex[]): Vertex[] {
        let vertexes: Vertex[] = []
        for (let i = 0; i < data.length - 1; i += 4) {
            vertexes.push(new Vertex(hexToSignedInt16(data.slice(i, i + 2)), hexToSignedInt16(data.slice(i + 2, i + 4))))
        }
        return vertexes
    }
    toString(): string {
        return `x: ${this.x}, y: ${this.y}`
    }
}