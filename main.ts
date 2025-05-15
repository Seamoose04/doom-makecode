let engine = new Engine(new WAD(getWAD()), 0)
console.log("loaded!")

// engine.clear()
// engine.draw()
// 
// controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
//     if (display.frames.length > 0) {
//         scene.setBackgroundImage(display.popFrame())
//     }
// })

game.onUpdate(() => {
    engine.movePlayer(controller.dx(), controller.dy(), controller.A.isPressed(), 5, 3)
    engine.clear()
    engine.draw()
    engine.updateFrame()
    engine.updateFPS()
    // console.log(`${engine.player.x}, ${engine.player.y}`)
})