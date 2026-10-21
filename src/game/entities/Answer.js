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
    ctx.shadowColor = "rgba(0,0,0,.85)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.lane === 3 ? "#101820" : "rgba(5, 20, 28, .94)";
    ctx.strokeStyle = this.lane === 3 ? "#FFFFFF" : "#8ee2df";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.lane === 3 ? "rgba(255,255,255,.62)" : "rgba(142, 226, 223, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8, 9);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 9px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`COLUNA ${this.lane + 1}`, this.x + this.width / 2, this.y + 13);
    ctx.fillStyle = "#f4f7fb";
    ctx.font = `700 ${Math.min(25, this.width * 0.42)}px Trebuchet MS, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(this.value), this.x + this.width / 2, this.y + this.height * 0.65);
    ctx.restore();
  }

  renderPerspective(ctx, progress, viewHeight) {
    const t = Math.max(0, Math.min(1, progress));
    const eased = t * t * (3 - 2 * t);
    const centerX = this.x + this.width / 2;
    const y = this.y + (viewHeight + this.height - this.y + 80) * eased;
    const scale = 1 + eased * 5.5;
    ctx.save();
    ctx.translate(centerX, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.max(0, 1 - eased * 0.18);
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "rgba(0,255,255,.9)";
    ctx.lineWidth = 2 / scale;
    ctx.shadowColor = "#00FFFF";
    ctx.shadowBlur = 22 / scale;
    ctx.font = `800 ${Math.min(25, this.width * 0.42)}px Trebuchet MS, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(String(this.value), 0, 0);
    ctx.fillText(String(this.value), 0, 0);
    ctx.restore();
  }
}
