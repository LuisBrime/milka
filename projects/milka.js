let cnv

console.log('sketch correctly injected!!')
const setup = () => {
  console.log('setuppppp')
  createCanvas(800, 800, document.getElementById('mainCanvas'))
  cnv = createGraphics(800, 800)
  noLoop()
}

const draw = () => {
  cnv.push()
  cnv.translate(400, 400)
  cnv.fill('magenta')
  cnv.circle(0, 0, 100)
  cnv.pop()
  image(cnv, 0, 0)
}

export default {
  setup,
  draw,
}
