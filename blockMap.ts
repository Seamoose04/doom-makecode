// Add your code here

class BlockMap {
    xOrigin: number
    yOrigin: number
    numCols: number
    numRows: number
    blockLists: BlockList[]
    constructor(xOrigin: number, yOrigin: number, numCols: number, numRows: number, blockLists: BlockList[]) {
        this.xOrigin = xOrigin
        this.yOrigin = yOrigin
        this.numCols = numCols
        this.numRows = numRows
        this.blockLists = blockLists
    }

    static fromLump(data: hex[]): BlockMap {
        // let numEntries = hexToSignedInt16(data.slice(4, 6)) * hexToSignedInt16(data.slice(6, 8))
        // let offsets: number[] = []
        // for (let i = 8; i <= 8 + 2 * (numEntries - 1); i += 2) {
        //     offsets.push(hexToSignedInt16(data.slice(i, i + 2)))
        // }
        // let blockLists: BlockList[] = []
        // for (let offset of offsets) {
        //     let linedefIds: number[] = []
        //     let first = data[offset].nibbles
        //     let second = data[offset+1].nibbles
        //     while (hexToSignedInt16(data.slice(offset, offset + 2)) != -1) {
        //         linedefIds.push(hexToSignedInt16(data.slice(offset, offset + 2)))
        //         offset += 2
        //     }
        //     blockLists.push(new BlockList(linedefIds))
        // }
        // return new BlockMap(
        //     hexToSignedInt16(data.slice(0, 2)),
        //     hexToSignedInt16(data.slice(2, 4)),
        //     hexToSignedInt16(data.slice(4, 6)),
        //     hexToSignedInt16(data.slice(6, 8)),
        //     blockLists
        // )
        return new BlockMap(
            hexToSignedInt16(data.slice(0, 2)),
            hexToSignedInt16(data.slice(2, 4)),
            hexToSignedInt16(data.slice(4, 6)),
            hexToSignedInt16(data.slice(6, 8)),
            null
        )
    }
}

class BlockList {
    linedefIds: number[]
    constructor(linedefIds: number[]) {
        this.linedefIds = linedefIds
    }
}