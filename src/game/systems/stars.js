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
