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
    length: 12 + rng() * 30,
    thickness: 0.6 + rng() * 1,
    alpha: 0.08 + rng() * 0.16,
    drift: (rng() - 0.5) * 22,
  }));
}

export function updateSpeedStreaks(streaks, dt, width, height, speed, rng = Math.random) {
  const flowSpeed = 150 + Math.max(0, speed) * 1.15;
  for (const streak of streaks) {
    streak.y += flowSpeed * dt;
    streak.x += streak.drift * dt;
    if (streak.y > height + streak.length) {
      streak.y = -streak.length;
      streak.x = rng() * width;
    }
    if (streak.x < -4) streak.x = width + 4;
    else if (streak.x > width + 4) streak.x = -4;
  }
}

export function renderSpeedStreaks(ctx, streaks, accent, speed) {
  const intensity = Math.min(1, Math.max(0, speed) / 260);
  ctx.save();
  ctx.lineCap = "round";
  for (const streak of streaks) {
    ctx.globalAlpha = streak.alpha * (0.55 + intensity * 0.75);
    ctx.strokeStyle = accent;
    ctx.lineWidth = streak.thickness;
    ctx.beginPath();
    ctx.moveTo(streak.x, streak.y);
    ctx.lineTo(streak.x + streak.drift * 0.16, streak.y + streak.length * (0.7 + intensity * 0.7));
    ctx.stroke();
  }
  ctx.restore();
}
