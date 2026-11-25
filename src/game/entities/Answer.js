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
    this.renderLabel(ctx, this.x + this.width / 2, this.y + this.height / 2, 700);
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
    this.renderLabel(ctx, 0, 0, 800);
    ctx.restore();
  }

  renderLabel(ctx, x, y, weight) {
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#071331";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.font = `${weight} ${Math.min(36, this.width * 0.58)}px Trebuchet MS, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = String(this.value);
    ctx.strokeText(label, x, y);
    ctx.fillText(label, x, y);
  }
}
