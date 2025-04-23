let engine = new Engine(new WAD(getWAD()), 0)
console.log("loaded!")

game.onUpdate(() => {
    engine.movePlayer(controller.dx(), controller.dy(), controller.A.isPressed(), 3)
    engine.clear()
    engine.draw()
    engine.updateFrame()
    engine.updateFPS()
    // console.log(`${engine.player.x}, ${engine.player.y}`)
})