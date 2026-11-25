const FRAME_DURATION_MS = 100;
const FADE_OUT_DURATION_MS = 280;
const STEP_TRACE_MS = 45;
const LASER_FRAME_COUNT = 8;

export const LASER_SHEETS = {
  "#00FFFF": "/assets/lasers/cyan.webp",
  "#FF00FE": "/assets/lasers/magenta.webp",
  "#FFFF00": "/assets/lasers/yellow.webp",
  "#FFFFFF": "/assets/lasers/white.webp",
};

const sheets = new Map();

function getLaserSheet(color, basePath = import.meta.env?.BASE_URL ?? "/") {
  const path = LASER_SHEETS[color];
  if (!path || typeof Image === "undefined") return null;
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  if (!sheets.has(color)) {
    const image = new Image();
    image.src = `${normalizedBase}${path.slice(1)}`;
    sheets.set(color, image);
  }
  return sheets.get(color);
}

export class AnswerLaser {
  constructor({ lane, x, y, width, height = 28, color, speed = 90, frames } = {}) {
    this.lane = lane;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.speed = speed;
    this.frames = frames;
    this.sheet = frames ? null : getLaserSheet(color);
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.alive = true;
    this.opacity = 1;
    this.fadeOutElapsedMs = null;
  }

  beginFadeOut() {
    if (!this.alive || this.fadeOutElapsedMs !== null) return;
    this.fadeOutElapsedMs = 0;
  }

  update(dt) {
    if (!this.alive) return;
    if (this.fadeOutElapsedMs !== null) {
      this.fadeOutElapsedMs += Math.max(0, dt) * 1000;
      this.opacity = Math.max(0, 1 - this.fadeOutElapsedMs / FADE_OUT_DURATION_MS);
      if (this.opacity === 0) this.alive = false;
      return;
    }
    const previousStep = Math.floor(this.frameElapsedMs / FRAME_DURATION_MS);
    this.frameElapsedMs += Math.max(0, dt) * 1000;
    const step = Math.floor(this.frameElapsedMs / FRAME_DURATION_MS);
    this.y += (step - previousStep) * this.speed * FRAME_DURATION_MS / 1000;
    this.frameIndex = step % (this.frames?.length || LASER_FRAME_COUNT);
  }

  get drawBounds() {
    const frame = this.sheet ?? this.frames?.[this.frameIndex];
    const ready = frame?.complete && frame.naturalWidth > 0 && frame.naturalHeight > 0;
    const height = ready ? this.width * frame.naturalHeight / (frame.naturalWidth * (this.sheet ? LASER_FRAME_COUNT : 1)) : this.height;
    return { x: this.x, y: this.y + (this.height - height) / 2, width: this.width, height };
  }

  render(ctx, reducedMotion = false) {
    if (!this.alive) return;
    const bounds = this.drawBounds;
    const frame = this.sheet ?? this.frames?.[this.frameIndex];
    const { x, y, width, height } = bounds;
    ctx.save();
    const alpha = ctx.globalAlpha * this.opacity;
    ctx.globalAlpha = alpha;
    const timeSinceStep = this.frameElapsedMs % FRAME_DURATION_MS;
    if (!reducedMotion && this.fadeOutElapsedMs === null && this.frameElapsedMs >= FRAME_DURATION_MS && timeSinceStep < STEP_TRACE_MS) {
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha * 0.5 * (1 - timeSinceStep / STEP_TRACE_MS);
      const stepDistance = this.speed * FRAME_DURATION_MS / 1000;
      const centerY = y + height / 2;
      ctx.fillRect(x + width * .08, centerY - stepDistance, width * .84, 2);
      ctx.fillRect(x + width * .19, centerY - stepDistance / 2, width * .62, 2);
      ctx.globalAlpha = alpha;
    }
    if (frame?.complete && frame.naturalWidth > 0 && frame.naturalHeight > 0) {
      if (this.sheet) {
        const frameHeight = frame.naturalHeight / LASER_FRAME_COUNT;
        ctx.drawImage(frame, 0, this.frameIndex * frameHeight, frame.naturalWidth, frameHeight, x, y, width, height);
      } else ctx.drawImage(frame, x, y, width, height);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(x, y + height / 2 - 2, width, 4);
    }
    ctx.restore();
  }
}
