const FRAME_DURATION_MS = 100;

const LASER_FILTERS = {
  "#00FFFF": "hue-rotate(180deg) saturate(1.35)",
  "#FF00FE": "hue-rotate(300deg) saturate(1.35)",
  "#FFFF00": "hue-rotate(60deg) saturate(1.35)",
  "#FFFFFF": "grayscale(1) brightness(2.6)",
};

function loadLaserFrames(basePath = import.meta.env?.BASE_URL ?? "/") {
  if (typeof Image === "undefined") return [];
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return Array.from({ length: 8 }, (_, index) => {
    const image = new Image();
    image.src = `${normalizedBase}assets/lasers/idle/frame_${String(index + 1).padStart(2, "0")}.png`;
    return image;
  });
}

let sharedLaserFrames;

function getLaserFrames() {
  sharedLaserFrames ??= loadLaserFrames();
  return sharedLaserFrames;
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
    this.frames = frames ?? getLaserFrames();
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.y += this.speed * dt;
    if (!this.frames.length) return;
    this.frameElapsedMs += Math.max(0, dt) * 1000;
    this.frameIndex = Math.floor(this.frameElapsedMs / FRAME_DURATION_MS) % this.frames.length;
  }

  render(ctx) {
    if (!this.alive) return;
    const frame = this.frames[this.frameIndex];
    if (!frame?.complete || frame.naturalWidth <= 0) return;
    ctx.save();
    ctx.filter = LASER_FILTERS[this.color] ?? "none";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 9;
    ctx.drawImage(frame, this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}
