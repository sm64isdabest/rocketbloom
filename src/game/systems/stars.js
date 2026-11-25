import { SPEED } from "../config/gameConfig.js";

export function createStarfield(count, width, height, alpha, rng = Math.random) {
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: rng() * width,
      y: rng() * height,
      size: rng() * 1.8 + 0.4,
      speed: 18 + rng() * 46,
      alpha: (0.25 + rng() * 0.75) * alpha,
    });
  }
  return stars;
}

export function updateStarfield(stars, dt, width, height, scroll, rng = Math.random) {
  for (const star of stars) {
    star.y += star.speed * scroll * dt;
    if (star.y > height) {
      star.y = -2;
      star.x = rng() * width;
    }
  }
}

export function renderStarfield(ctx, stars) {
  for (const star of stars) {
    ctx.fillStyle = `rgba(244, 247, 251, ${star.alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

export function createSpeedStreaks(count, width, height, rng = Math.random) {
  return Array.from({ length: count }, () => ({
    x: rng() * width,
    y: rng() * height,
    length: 22 + rng() * 42,
    thickness: 1 + rng() * 1.2,
    alpha: 0.2 + rng() * 0.2,
    drift: (rng() - 0.5) * 22,
  }));
}

export function updateSpeedStreaks(streaks, dt, width, height, speed, rng = Math.random) {
  const flowSpeed = 180 + Math.max(0, speed - SPEED.streakThreshold) * 3.8;
  for (const streak of streaks) {
    streak.y += flowSpeed * dt;
    streak.x += streak.drift * dt;
    if (streak.y > height + streak.length * 3) {
      streak.y = -rng() * 100;
      streak.x = rng() * width;
    }
    if (streak.x < -4) streak.x = width + 4;
    else if (streak.x > width + 4) streak.x = -4;
  }
}

export function renderSpeedStreaks(ctx, streaks, accent, speed) {
  if (speed <= SPEED.streakThreshold) return;
  const intensity = Math.min(1, (speed - SPEED.streakThreshold) / (SPEED.max - SPEED.streakThreshold)) ** 0.65;
  const count = Math.ceil(streaks.length * (0.10 + intensity * 0.90));
  ctx.save();
  ctx.lineCap = "round";
  for (let index = 0; index < count; index += 1) {
    const streak = streaks[index];
    const bright = index % 4 === 0;
    const length = streak.length * (0.55 + intensity * 2.4);
    const tailX = streak.x + streak.drift * intensity * 0.3;
    ctx.globalAlpha = streak.alpha * intensity * (bright ? 1.7 : 1);
    ctx.strokeStyle = bright ? "#e3faff" : accent;
    ctx.lineWidth = streak.thickness * (0.6 + intensity);
    ctx.beginPath();
    ctx.moveTo(streak.x, streak.y);
    ctx.lineTo(tailX, streak.y - length);
    ctx.stroke();
    if (bright && intensity > 0.65) {
      ctx.globalAlpha *= 0.24;
      ctx.strokeStyle = accent;
      ctx.lineWidth *= 3.2;
      ctx.stroke();
    }
  }
  ctx.restore();
}
