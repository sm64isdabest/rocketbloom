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

  render(ctx, accessibility) {
    ctx.save();
    this.renderLabel(ctx, this.x + this.width / 2, this.y + this.height / 2, 700, accessibility);
    ctx.restore();
  }

  renderPerspective(ctx, progress, viewHeight, accessibility) {
    const t = Math.max(0, Math.min(1, progress));
    const eased = t * t * (3 - 2 * t);
    const centerX = this.x + this.width / 2;
    const y = this.y + (viewHeight + this.height - this.y + 80) * eased;
    const scale = 1 + eased * 2;
    ctx.save();
    ctx.translate(centerX, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.max(0, 1 - eased);
    this.renderLabel(ctx, 0, 0, 800, accessibility);
    ctx.restore();
  }

  renderLabel(ctx, x, y, weight, { largeText = false, highContrast = false } = {}) {
    const fontSize = largeText ? Math.min(46, this.width * 0.72) : Math.min(36, this.width * 0.58);
    if (highContrast) {
      const padding = 6;
      ctx.fillStyle = "#050a16";
      ctx.fillRect(x - this.width / 2, y - fontSize / 2 - padding, this.width, fontSize + padding * 2);
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#071331";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.font = `${weight} ${fontSize}px Trebuchet MS, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = String(this.value);
    const maxWidth = this.width - 8;
    ctx.strokeText(label, x, y, maxWidth);
    ctx.fillText(label, x, y, maxWidth);
  }
}
