class Controller {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.colors = ['cyan', 'yellow', 'magenta']
  }

  setup() {
    this.circles = [
      { x: random(this.w), y: random(this.h), c: random(this.colors) },
      { x: random(this.w), y: random(this.h), c: random(this.colors) },
      { x: random(this.w), y: random(this.h), c: random(this.colors) },
      { x: random(this.w), y: random(this.h), c: random(this.colors) },
      { x: random(this.w), y: random(this.h), c: random(this.colors) },
      { x: random(this.w), y: random(this.h), c: random(this.colors) },
    ]
  }

  draw(cnv) {
    cnv.push()
    for (let i = 0; i < this.circles.length; i++) {
      const { x, y, c } = this.circles[i]
      cnv.push()
      cnv.translate(x, y)
      cnv.fill(c)
      cnv.circle(0, 0, this.w * 0.15)
      cnv.pop()
    }
    cnv.pop()
  }
}

export default { Controller }
