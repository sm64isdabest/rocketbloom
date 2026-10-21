export class Collectible {
  constructor({ id, kind, x, y, width, height, speed = 110, pickupId = id }) {
    this.id = id;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.pickupId = pickupId;
    this.alive = true;
  }

  update(dt) {
    this.y += this.speed * dt;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.shadowBlur = 12;
    if (this.kind === "diamond") {
      ctx.fillStyle = "#7ad4ff";
      ctx.shadowColor = "rgba(122, 212, 255, .72)";
      ctx.beginPath();
      ctx.moveTo(0, -this.height / 2);
      ctx.lineTo(this.width / 2, 0);
      ctx.lineTo(0, this.height / 2);
      ctx.lineTo(-this.width / 2, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#d6c27a";
      ctx.shadowColor = "rgba(246, 206, 98, .62)";
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
