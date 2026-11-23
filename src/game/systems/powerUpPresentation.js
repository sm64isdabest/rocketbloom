const POWER_COLORS = {
  turbo: "#ffc06b",
  star: "#ffe776",
  bubble: "#92ecff",
  shrink: "#b8b5ff",
};

export function renderPowerUpIntro(ctx, power, progress, size) {
  const eased = progress * progress * (3 - 2 * progress);
  const color = POWER_COLORS[power];
  let width = size;
  let height = size;
  let rise = 0;
  let rotation = 0;

  ctx.globalAlpha = 1 - eased;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();

  switch (power) {
    case "turbo": {
      rise = -size * 1.25 * eased;
      width *= 1 - progress * 0.22;
      height *= 1 + progress * 0.65;
      for (let streak = -1; streak <= 1; streak += 1) {
        const x = streak * size * 0.26;
        const y = rise + height / 2;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + size * (0.33 + progress * 0.6 - Math.abs(streak) * 0.18));
      }
      break;
    }
    case "star": {
      width *= 1 + eased * 0.6;
      height = width;
      rotation = Math.sin(progress * Math.PI) * 0.36;
      for (let ray = 0; ray < 8; ray += 1) {
        const angle = ray * Math.PI / 4 - rotation;
        const radius = size * (0.67 + progress * 0.34);
        ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        const tip = radius + size * (ray % 2 === 0 ? 0.22 : 0.13);
        ctx.lineTo(Math.cos(angle) * tip, Math.sin(angle) * tip);
      }
      break;
    }
    case "bubble": {
      rise = -size * 0.42 * eased;
      width *= 1 + Math.sin(progress * Math.PI) * 0.42 + eased * 0.2;
      height = width;
      for (const ring of [0, 0.19]) {
        const radius = size * (0.74 + eased * 0.47 + ring);
        ctx.moveTo(radius, rise);
        ctx.arc(0, rise, radius, 0, Math.PI * 2);
      }
      break;
    }
    case "shrink": {
      width *= 1 - eased * 0.86;
      height *= 1 - eased * 0.49;
      const edge = size * (0.72 - eased * 0.45);
      const scanY = size * (progress - 0.5);
      for (const direction of [-1, 1]) {
        ctx.moveTo(direction * edge, -height * 0.61);
        ctx.lineTo(direction * edge, height * 0.61);
        ctx.moveTo(direction * edge, scanY);
        ctx.lineTo(direction * width * 0.54, scanY);
      }
      break;
    }
  }

  ctx.stroke();
  ctx.translate(0, rise);
  ctx.rotate(rotation);
  return { width, height, color };
}
