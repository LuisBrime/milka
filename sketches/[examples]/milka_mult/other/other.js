class OtherController {
  constructor(w, h) {
    this.r = {
      x: random(w),
      y: random(h),
      w: random(w * 0.05, w * 0.1),
      h: random(h * 0.05, h * 0.1),
    };
  }

  draw(cnv) {
    cnv.push();
    cnv.translate(this.r.x, this.r.y);
    cnv.rect(0, 0, this.r.w, this.r.h);
    cnv.pop();
  }
}

export default { OtherController };
