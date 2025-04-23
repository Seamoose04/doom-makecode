interface Picture {
    width: number
    height: number
    pixels: number[][]
}

class Post {
    topDelta: number
    length: number
    data: number[]
    constructor(topDelta: number, length: number, data: number[]) {
        this.topDelta = topDelta
        this.length = length
        this.data = data
    }
}

class PatchHeader {
    width: number
    height: number
    leftOff: number
    topOff: number
    offsets: number[]
    posts: Post[][]
    constructor(width: number, height: number, leftOff: number, topOff: number, offsets: number[]) {
        this.width = width
        this.height = height
        this.leftOff = leftOff
        this.topOff = topOff
        this.offsets = offsets
    }
    asPicture(): Picture {
        let pixels: number[][] = []
        for (let i = 0; i < this.width; i++) {
            
            for (let post of this.posts) {

            }
        }
        return {
            width: this.width,
            height: this.height,
            pixels: pixels
        }
    }
    static fromLump(data: hex[]): PatchHeader {
        let width = hexToUnsignedInt16(data.slice(0, 2))
        let height = hexToUnsignedInt16(data.slice(2, 4))
        let leftOffset = hexToSignedInt16(data.slice(4, 6))
        let topOffset = hexToSignedInt16(data.slice(6, 8))
        let offsets = hexToUnsignedInt32Arr(data.slice(8, 8 + 4*width))
        return new PatchHeader(
            width,
            height,
            leftOffset,
            topOffset,
            offsets
        )
    }
    setPosts(startOffset: number, file: hex[]) {
        this.posts = []
        for (let offset of this.offsets) {
            let column: Post[] = []
            let off = 0
            while (true) {
                let topDelta = hexToInt(file[off + startOffset + offset])
                if (topDelta == 255) {
                    break
                }
                let length = hexToInt(file[off + startOffset + offset + 1])
                let postData = hexToUnsignedInt8Arr(file.slice(off + startOffset + offset + 3, off + startOffset + offset + 3 + length))
                column.push(new Post(
                    topDelta,
                    length,
                    postData
                ))
                off += 4 + length
            }
            this.posts.push(column)
        }
    }
}