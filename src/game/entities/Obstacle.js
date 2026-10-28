const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const SPRITE_FILES = { plane: "plane.png", helicopter: "helicopter.png", balloon: "balloon.png" };
const SPRITE_IMAGES = new Map();

function getSprite(obstacleId) {
  const filename = SPRITE_FILES[obstacleId];
  if (!filename || typeof Image === "undefined") return null;
  if (!SPRITE_IMAGES.has(obstacleId)) {
    const image = new Image();
    image.src = `${APP_BASE}assets/obstacles/earth/${filename}`;
    SPRITE_IMAGES.set(obstacleId, image);
  }
  return SPRITE_IMAGES.get(obstacleId);
}

export class Obstacle {
  constructor({ id, x, y, width, height, speed = 130, color = "#b98562", hitbox }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.color = color;
    this.hitbox = hitbox ?? { x: 0.08, y: 0.08, width: 0.84, height: 0.84 };
    this.alive = true;
    this.image = getSprite(id);
  }

  get collisionBox() {
    const box = this.hitbox;
    return {
      x: this.x + this.width * box.x,
      y: this.y + this.height * box.y,
      width: this.width * box.width,
      height: this.height * box.height,
    };
  }

  update(dt) {
    this.y += this.speed * dt;
  }

  render(ctx) {
    if (this.image?.complete && this.image.naturalWidth > 0) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "rgba(10, 23, 35, .62)";
    ctx.lineWidth = 2;
    if (this.id === "plane") {
      const w = this.width; const h = this.height;
      ctx.beginPath(); ctx.moveTo(0, h * .42); ctx.lineTo(w * .39, h * .36); ctx.lineTo(w * .53, 0);
      ctx.lineTo(w * .65, h * .03); ctx.lineTo(w * .6, h * .37); ctx.lineTo(w, h * .48);
      ctx.lineTo(w * .98, h * .61); ctx.lineTo(w * .59, h * .57); ctx.lineTo(w * .54, h);
      ctx.lineTo(w * .42, h * .96); ctx.lineTo(w * .39, h * .57); ctx.lineTo(0, h * .56); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (this.id === "helicopter") {
      ctx.fillRect(this.width * .2, this.height * .38, this.width * .52, this.height * .34);
      ctx.beginPath(); ctx.ellipse(this.width * .7, this.height * .48, this.width * .13, this.height * .12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillRect(this.width * .68, this.height * .47, this.width * .27, this.height * .05);
      ctx.fillRect(this.width * .44, this.height * .14, this.width * .06, this.height * .25);
      ctx.fillRect(this.width * .25, this.height * .12, this.width * .45, this.height * .06);
      ctx.fillRect(this.width * .28, this.height * .72, this.width * .06, this.height * .12);
      ctx.fillRect(this.width * .65, this.height * .72, this.width * .06, this.height * .12);
    } else if (this.id === "balloon") {
      ctx.beginPath(); ctx.ellipse(this.width / 2, this.height * .34, this.width * .43, this.height * .32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(this.width * .4, this.height * .62); ctx.lineTo(this.width * .5, this.height * .75); ctx.lineTo(this.width * .6, this.height * .62); ctx.stroke();
      ctx.strokeRect(this.width * .39, this.height * .75, this.width * .22, this.height * .18);
    } else if (this.id === "asteroid") {
      ctx.beginPath(); ctx.moveTo(this.width * .22, 0); ctx.lineTo(this.width * .8, this.height * .08);
      ctx.lineTo(this.width, this.height * .42); ctx.lineTo(this.width * .78, this.height * .92);
      ctx.lineTo(this.width * .36, this.height); ctx.lineTo(0, this.height * .68); ctx.lineTo(this.width * .08, this.height * .25); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(54, 36, 32, .3)";
      ctx.beginPath(); ctx.arc(this.width * .35, this.height * .4, this.width * .1, 0, Math.PI * 2); ctx.fill();
    } else if (this.id === "comet") {
      ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(0, this.height * .22); ctx.lineTo(this.width * .58, this.height * .35);
      ctx.lineTo(this.width * .58, this.height * .65); ctx.lineTo(0, this.height * .82); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(this.width * .73, this.height / 2, this.height * .38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(this.width / 2, 0); ctx.lineTo(this.width, this.height * .65);
      ctx.lineTo(this.width / 2, this.height); ctx.lineTo(0, this.height * .65); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.moveTo(this.width / 2, 3); ctx.lineTo(this.width / 2, this.height * .78); ctx.stroke();
    }
    ctx.restore();
  }
}
