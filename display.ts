namespace display {
    export let frames: Image[] = []

    export enum Color {
        TRANSPARENT = 0,
        WHITE = 1,
        GRAY = 9,
        BLACK = 15
    }

    export function getColor(color: number): number {
        if (color <= 0) {
            return Color.BLACK
        }
        return Math.round(Math.map(color, 0, 256, 15, 1))
    }

    export function toGrayscale(r: number, g: number, b: number) {
        return getColor((r + g + b) / 3)
    }

    export function pushFrame(img: Image) {
        frames.push(img)
    }

    export function popFrame(): Image {
        return frames.removeAt(0)
    }
}