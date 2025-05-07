class Node {
    partitionXStart: number
    partitionYStart: number
    partitionXSlope: number
    partitionYSlope: number
    rightBoundingBox: number[]
    leftBoundingBox: number[]
    rightChildIdBinary: string
    leftChildIdBinary: string
    constructor(partitionXStart: number, partitionYStart: number, partitionXSlope: number, partitionYSlope: number, rightBoundingBox: number[], leftBoundingBox: number[], rightChildIdBinary: string, leftChildIdBinary: string) {
        this.partitionXStart = partitionXStart
        this.partitionYStart = partitionYStart
        this.partitionXSlope = partitionXSlope
        this.partitionYSlope = partitionYSlope
        this.rightBoundingBox = rightBoundingBox
        this.leftBoundingBox = leftBoundingBox
        this.rightChildIdBinary = rightChildIdBinary
        this.leftChildIdBinary = leftChildIdBinary
    }

    getOrderedChildren(player: player): {front: string, back: string} {
        // Vector from partition start to the player's position
        const playerDirX = player.x - this.partitionXStart;
        const playerDirY = player.y - this.partitionYStart;

        // Cross product of partition direction and player direction vector to determine which side
        const crossProduct = this.partitionXSlope * playerDirY - this.partitionYSlope * playerDirX;

        // If crossProduct > 0, the player is on the left side, otherwise on the right side
        if (crossProduct > 0) {
            return { front: this.rightChildIdBinary, back: this.leftChildIdBinary}
        } else {
            return { front: this.leftChildIdBinary, back: this.rightChildIdBinary}
        }
    }

    toString(): string {
        return `xStart: ${this.partitionXStart}, yStart: ${this.partitionYStart}, xSlope: ${this.partitionXSlope}, ySlope: ${this.partitionYSlope},
        rightBounding: ${this.rightBoundingBox},
        leftBounding: ${this.leftBoundingBox},
        rightChild: ${this.rightChildIdBinary}, leftChild: ${this.rightChildIdBinary}`
    }

    static fromLump(data: hex[]): Node[] {
        let nodes: Node[] = []
        for (let i = 0; i < data.length - 1; i += 28) {
            nodes.push(new Node(
                hexToSignedInt16(data.slice(i, i + 2)),
                hexToSignedInt16(data.slice(i + 2, i + 4)),
                hexToSignedInt16(data.slice(i + 4, i + 6)),
                hexToSignedInt16(data.slice(i + 6, i + 8)),
                hexToSignedInt16Arr(data.slice(i + 8, i + 16)),
                hexToSignedInt16Arr(data.slice(i + 16, i + 24)),
                hexToBinaryString(data.slice(i + 24, i + 26)),
                hexToBinaryString(data.slice(i + 26, i + 28))
            ))
        }
        return nodes
    }
}