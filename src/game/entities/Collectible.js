const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const SPRITE_FILES = { coin: "coin.png", diamond: "diamond.png" };
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
  }

  update(dt) {
    this.y += this.speed * dt;
  }

  render(ctx) {
    ctx.save();
    ctx.shadowBlur = 12;
    if (this.image?.complete && this.image.naturalWidth > 0) {
      const scale = Math.min(this.width / this.image.naturalWidth, this.height / this.image.naturalHeight);
      const width = this.image.naturalWidth * scale;
      const height = this.image.naturalHeight * scale;
      ctx.shadowColor = this.kind === "diamond" ? "rgba(49, 203, 255, .78)" : "rgba(246, 174, 35, .72)";
      ctx.drawImage(this.image, this.x + (this.width - width) / 2, this.y + (this.height - height) / 2, width, height);
      ctx.restore();
      return;
    }

    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
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
