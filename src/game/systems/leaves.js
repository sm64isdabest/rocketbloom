const LEAF_COUNT = 16;

export function createFallingLeaves(width, height, rng = Math.random) {
  return Array.from({ length: LEAF_COUNT }, (_, index) => ({
    x: rng() * width,
    y: rng() * height,
    size: 22 + rng() * 22,
    speed: 52 + rng() * 62,
    sway: 18 + rng() * 30,
    phase: rng() * Math.PI * 2,
    rotation: rng() * Math.PI * 2,
    spin: (rng() - 0.5) * 1.4,
  }));
}

export function updateFallingLeaves(leaves, dt, width, height, rng = Math.random) {
  for (const leaf of leaves) {
    leaf.y += leaf.speed * dt;
    leaf.phase += dt * 1.7;
    leaf.x += Math.sin(leaf.phase) * leaf.sway * dt;
    leaf.rotation += leaf.spin * dt;
    if (leaf.y - leaf.size > height) {
      leaf.y = -leaf.size;
      leaf.x = rng() * width;
    }
    if (leaf.x < -leaf.size) leaf.x = width + leaf.size;
    else if (leaf.x > width + leaf.size) leaf.x = -leaf.size;
  }
}

export function renderFallingLeaves(ctx, leaves, image) {
  if (!ctx || !image?.complete || image.naturalWidth === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const leaf of leaves) {
    ctx.save();
    ctx.globalAlpha = 0.64;
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rotation);
    ctx.drawImage(image, -leaf.size / 2, -leaf.size / 3, leaf.size, leaf.size * 2 / 3);
    ctx.restore();
  }
  ctx.restore();
}
