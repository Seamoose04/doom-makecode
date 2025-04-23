// Add your code here
class Minimap {
    sprite: Sprite
    img: Image
    width: number
    height: number
    constructor(width: number, height: number) {
        this.width = width
        this.height = height
        this.img = image.create(this.width, this.height)
        this.sprite = sprites.create(this.img)
        this.sprite.setPosition(this.width / 2, this.height / 2)
    }
    updateSprite() {
        this.sprite.setImage(this.img)
    }
    clearMap() {
        this.img.fill(display.Color.BLACK)
        this.img.drawRect(0, 0, this.width, this.height, display.Color.WHITE)
    }
}