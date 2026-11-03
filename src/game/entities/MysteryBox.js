import { MYSTERY_BOX } from "../config/gameConfig.js";

export class MysteryBox {
  constructor({ x, y = -MYSTERY_BOX.size, speed = MYSTERY_BOX.fallSpeed }) {
    this.x = x;
    this.y = y;
    this.width = MYSTERY_BOX.size;
    this.height = MYSTERY_BOX.size;
    this.speed = speed;
    this.rotation = 0;
    this.pulse = 0;
    this.alive = true;
  }

  update(dt) {
    this.y += this.speed * dt;
    this.rotation += dt * 0.9;
    this.pulse += dt * 4;
  }

  render(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.sin(this.rotation) * 0.12);
    ctx.shadowColor = "#ffe34d";
    ctx.shadowBlur = 15 + Math.sin(this.pulse) * 5;
    const gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
    const hue = Math.floor((this.pulse * 18) % 360);
    gradient.addColorStop(0, `hsl(${(hue + 48) % 360} 100% 78%)`);
    gradient.addColorStop(0.5, `hsl(${(hue + 28) % 360} 100% 58%)`);
    gradient.addColorStop(1, `hsl(${(hue + 345) % 360} 88% 58%)`);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(255,255,255,.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 9);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 31px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 1);
    ctx.restore();
  }
}
