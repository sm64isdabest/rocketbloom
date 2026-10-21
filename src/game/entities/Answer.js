export class Answer {
  constructor({ id, value, x, y, width = 56, height = 56, correct = false, speed = 90, lane }) {
    this.id = id;
    this.lane = lane;
    this.value = value;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.correct = correct;
    this.speed = speed;
    this.alive = true;
  }

  update(dt) {
    this.y += this.speed * dt;
  }

  render(ctx) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.72)";
    ctx.shadowBlur = 5;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${Math.min(26, this.width * 0.48)}px Trebuchet MS, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(this.value), this.x + this.width / 2, this.y + this.height / 2);
    ctx.restore();
  }

  renderPerspective(ctx, progress, viewHeight) {
    const t = Math.max(0, Math.min(1, progress));
    const eased = t * t * (3 - 2 * t);
    const centerX = this.x + this.width / 2;
    const y = this.y + (viewHeight + this.height - this.y + 80) * eased;
    const scale = 1 + eased * 2;
    ctx.save();
    ctx.translate(centerX, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.max(0, 1 - eased);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0,0,0,.7)";
    ctx.shadowBlur = 6 / scale;
    ctx.font = `800 ${Math.min(26, this.width * 0.48)}px Trebuchet MS, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(this.value), 0, 0);
    ctx.restore();
  }
}
