const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const SPRITE_FILES = { coin: "coin.webp" };
const SPRITE_IMAGES = new Map();

function getSprite(kind) {
  const filename = SPRITE_FILES[kind];
  if (!filename || typeof Image === "undefined") return null;
  if (!SPRITE_IMAGES.has(kind)) {
    const image = new Image();
    image.src = `${APP_BASE}assets/collectibles/${filename}`;
    SPRITE_IMAGES.set(kind, image);
  }
  return SPRITE_IMAGES.get(kind);
}

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
    this.image = getSprite(kind);
    this.shineTime = 0;
    this.shinePhase = x / 110;
  }

  update(dt, reducedMotion, attractionTarget = null) {
    this.y += this.speed * dt;
    if (attractionTarget) {
      const follow = 1 - Math.exp(-6 * Math.max(0, dt));
      const targetX = attractionTarget.x + attractionTarget.width / 2 - this.width / 2;
      const targetY = attractionTarget.y + attractionTarget.height / 2 - this.height / 2;
      this.x += (targetX - this.x) * follow;
      this.y += (targetY - this.y) * follow;
    }
    if (this.kind === "coin") this.shineTime = reducedMotion ? 0 : this.shineTime + dt;
  }

  render(ctx, reducedMotion = false) {
    const animated = this.kind === "coin" && !reducedMotion;
    const time = this.shineTime + this.shinePhase;
    const turn = time * Math.PI / 1.35;
    const spin = animated ? 0.19 + 0.81 * Math.abs(Math.cos(turn)) : 1;
    const shine = animated ? 0.5 + 0.5 * Math.cos(turn * 2) : 0.65;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.save();
    ctx.shadowBlur = 8 + shine * 9;
    if (this.image?.complete && this.image.naturalWidth > 0) {
      const scale = Math.min(this.width / this.image.naturalWidth, this.height / this.image.naturalHeight);
      const width = this.image.naturalWidth * scale * spin;
      const height = this.image.naturalHeight * scale;
      ctx.shadowColor = "rgba(246, 174, 35, .72)";
      ctx.drawImage(this.image, centerX - width / 2, centerY - height / 2, width, height);
      if (animated) {
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#ffca3c";
        ctx.fillStyle = "#fff6c1";
        for (let index = 0; index < 3; index += 1) {
          const angle = time * 1.8 + index * Math.PI * 2 / 3;
          const pulse = (0.5 + 0.5 * Math.cos(time * 6 - index * 2)) ** 2;
          const x = centerX + Math.cos(angle) * (this.width / 2 + 5);
          const y = centerY + Math.sin(angle) * (this.height / 2 + 5);
          const size = (2.5 + index * 0.6) * pulse;
          ctx.globalAlpha = pulse;
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size * 0.28, y - size * 0.28);
          ctx.lineTo(x + size, y);
          ctx.lineTo(x + size * 0.28, y + size * 0.28);
          ctx.lineTo(x, y + size);
          ctx.lineTo(x - size * 0.28, y + size * 0.28);
          ctx.lineTo(x - size, y);
          ctx.lineTo(x - size * 0.28, y - size * 0.28);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }

    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.fillStyle = "#d6c27a";
    ctx.shadowColor = "rgba(246, 206, 98, .62)";
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
