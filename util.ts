function dist2(x1: number, y1: number, x2: number, y2: number): number {
    let distX = x2 - x1
    let distY = y2 - y1
    return distX * distX + distY * distY
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
    let distX = x2 - x1
    let distY = y2 - y1
    return Math.sqrt(distX * distX + distY * distY)
}

class RLE<V> { // run length encoder
    rle: {value: V, length: number}[]
    constructor(values?: V[]) {
        this.rle = []
        if (values != null) {
            let curr: {value: V, length: number} = {value: null, length: 0};
            for (let value of values) {
                if (curr.value == value) {
                    curr.length++
                } else {
                    this.rle.push(curr)
                    curr = {value: value, length: 1}
                }
            }
        }
    }
    getValue(index: number): V {
        let currentIndex = 0
        for (let item of this.rle) {
            if (index > currentIndex && index < currentIndex + item.length) {
                return item.value
            }
            currentIndex += item.length
        }
        return null
    }
    setValue(value: V, indexLow: number, indexHigh?: number) {
        if (indexHigh == null) {
            indexHigh = indexLow
        }
        let currentIndex = 0
        let rleIndex = 0
        for (let item of this.rle) {
            if (indexLow > currentIndex && indexLow < currentIndex + item.length) {
                let newItem = {value: value, length: -(currentIndex - item.length)}
                item.length = item.length - currentIndex
                this.rle.insertAt(rleIndex+1, newItem)
            }
            rleIndex++
        }
    }
    private collapse() {
        let i = 0
        while (i < this.rle.length) {
            if (this.rle[i].value == this.rle[i+1].value) {
                this.rle[i].length += this.rle.removeAt(i+1).length
            }
            i++
        }
    }
}

class Dict<K, V> {
    keys: K[]
    values: V[]
    constructor() {
        this.keys = []
        this.values = []
    }
    set(key: K, value: V) {
        let index = this.keys.indexOf(key)
        if (index < 0) {
            this.keys.push(key)
            this.values.push(value)
        } else {
            this.values[index] = value
        }
    }
    get(key: K): V | null {
        let index = this.keys.indexOf(key)
        if (index < 0) {
            return null
        } else {
            return this.values[index]
        }
    }
}

function newArray<T>(size: number): T[] {
    let arr: T[] = []
    for (let i = 0; i < size; i++) {
        arr.push(null)
    }
    return arr
}

function replaceElements<T>(arr: T[], data: T[], offset?: number, length?: number) {
    if (offset == null) {
        offset = 0
    }
    if (length == null) {
        length = data.length
    }
    for (let i = 0; i < length; i++) {
        arr[i + offset] = data[i]
    }
}