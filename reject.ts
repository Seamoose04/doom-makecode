// Add your code here
class RejectTable {
    table: boolean[][] // [monster][player]
    constructor(table: boolean[][]) {
        this.table = table
    }
    static fromLump(data: hex[]): RejectTable {
        let numSectors = Math.floor(Math.sqrt(data.length * 8))
        let flat: boolean[] = []
        for (let i = 0; i < data.length; i++) {
            let arr = hexToBoolArr(data[i])
            arr.reverse()
            flat.concat(arr)
        }
        let table: boolean[][] = []
        while (flat.length > 0) {
            table.push(flat.slice(0, numSectors))
            flat.splice(0, numSectors)
        }
        return new RejectTable(table)
    }
}