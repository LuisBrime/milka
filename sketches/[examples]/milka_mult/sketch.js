let cnv
let drawingController
let otherController

const setup = () => {
  createCanvas(800, 800, document.getElementById('mainCanvas'))
  cnv = createGraphics(800, 800)
  drawingController = new Controller(800, 800)
  otherController = new OtherController(800, 800)
  drawingController.setup()
  noLoop()
}

const draw = () => {
  drawingController.draw(cnv)
  otherController.draw(cnv)
  image(cnv, 0, 0)
}

export default {
  setup,
  draw,
}
