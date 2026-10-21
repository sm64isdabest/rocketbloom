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
    ctx.fillStyle = "rgba(7, 24, 34, 0.94)";
    ctx.strokeStyle = "#8ee2df";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 12);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(142, 226, 223, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8, 9);
    ctx.stroke();
    ctx.fillStyle = "#8ee2df";
    ctx.font = "500 8px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ROTA", this.x + this.width / 2, this.y + 14);
    ctx.fillStyle = "#f4f7fb";
    ctx.font = `700 ${Math.min(21, this.width * 0.34)}px Trebuchet MS, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(this.value), this.x + this.width / 2, this.y + this.height * 0.65);
    ctx.restore();
  }
}
