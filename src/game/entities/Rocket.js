import { ROCKET } from "../config/gameConfig.js";

const ROCKET_SOURCE = { x: 292, y: 51, width: 494, height: 965 };

export function getRocketImageUrl(basePath = import.meta.env?.BASE_URL ?? "/") {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}assets/rocket.png`;
}

function createRocketImage() {
  if (typeof Image === "undefined") return null;
  const image = new Image();
  image.src = getRocketImageUrl();
  return image;
}

export class Rocket {
  constructor({ image } = {}) {
    this.width = ROCKET.width;
    this.height = ROCKET.height;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.rotation = 0;
    this.damageFeedbackDurationMs = 0;
    this.damageFeedbackRemainingMs = 0;
    this.image = image ?? createRocketImage();
  }

  triggerDamageFeedback(durationMs = 900) {
    this.damageFeedbackDurationMs = Math.max(1, durationMs);
    this.damageFeedbackRemainingMs = this.damageFeedbackDurationMs;
  }

  updateDamageFeedback(dt) {
    this.damageFeedbackRemainingMs = Math.max(0, this.damageFeedbackRemainingMs - Math.max(0, dt) * 1000);
  }

  place(viewWidth, viewHeight) {
    this.x = viewWidth / 2 - this.width / 2;
    this.targetX = this.x;
    this.y = viewHeight - Math.min(ROCKET.bottomOffset, viewHeight * 0.13) - this.height;
  }

  clamp(viewWidth) {
    this.x = Math.max(0, Math.min(viewWidth - this.width, this.x));
    this.targetX = Math.max(0, Math.min(viewWidth - this.width, this.targetX));
  }

  update(dt) {
    const previousX = this.x;
    const delta = this.targetX - this.x;
    const maxStep = ROCKET.horizontalSpeed * dt;
    const easedStep = delta * (1 - Math.exp(-14 * dt));
    if (Math.abs(delta) <= 0.6) {
      this.x = this.targetX;
    } else {
      this.x += Math.max(-maxStep, Math.min(maxStep, easedStep));
    }
    const horizontalMovement = this.x - previousX;
    const targetRotation = Math.abs(horizontalMovement) < 0.01 ? 0 : Math.sign(horizontalMovement) * 0.12;
    this.rotation += (targetRotation - this.rotation) * (1 - Math.exp(-12 * dt));
  }

  render(ctx, elapsedMs = 0, reducedMotion = false) {
    const { x, y, width, height } = this;
    const damageStrength = this.damageFeedbackDurationMs > 0
      ? this.damageFeedbackRemainingMs / this.damageFeedbackDurationMs
      : 0;
    const blink = 0.25 + (0.75 * (0.5 + 0.5 * Math.sin(elapsedMs * 0.045)));
    const tintAlpha = damageStrength * blink;
    const shakeStrength = reducedMotion ? 0 : damageStrength;
    const shakeX = Math.sin(elapsedMs * 0.08) * 8 * shakeStrength;
    const shakeY = Math.cos(elapsedMs * 0.11) * 5 * shakeStrength;
    ctx.save();
    ctx.translate(x + width / 2 + shakeX, y + height / 2 + shakeY);
    ctx.rotate(this.rotation);
    if (this.image?.complete && this.image.naturalWidth > 0) {
      const drawWidth = Math.min(width, height * ROCKET_SOURCE.width / ROCKET_SOURCE.height);
      const drawX = (width - drawWidth) / 2;
      const drawRocket = () => ctx.drawImage(
        this.image, ROCKET_SOURCE.x, ROCKET_SOURCE.y, ROCKET_SOURCE.width, ROCKET_SOURCE.height,
        drawX, -height / 2, drawWidth, height,
      );
      drawRocket();
      if (tintAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = tintAlpha;
        ctx.filter = "brightness(0) saturate(100%) invert(14%) sepia(100%) saturate(7462%) hue-rotate(358deg) brightness(105%) contrast(114%)";
        drawRocket();
        ctx.restore();
      }
      ctx.restore();
      return;
    }

    ctx.fillStyle = tintAlpha > 0
      ? `rgb(${Math.round(217 + tintAlpha * 38)}, ${Math.round(231 - tintAlpha * 196)}, ${Math.round(242 - tintAlpha * 197)})`
      : "#d9e7f2";
    ctx.beginPath();
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(width / 2.2, height / 3);
    ctx.lineTo(0, height / 2.6);
    ctx.lineTo(-width / 2.2, height / 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#3dcc7a";
    ctx.fillRect(-width / 6, -height / 8, width / 3, height / 3.2);

    ctx.fillStyle = "#e07a4a";
    ctx.beginPath();
    ctx.moveTo(-width / 5, height / 3);
    const flameLength = reducedMotion ? height / 1.7 : height / 1.65 + Math.sin(elapsedMs * 0.018) * 4;
    ctx.lineTo(0, flameLength);
    ctx.lineTo(width / 5, height / 3);
    ctx.fill();

    ctx.restore();
  }
}
