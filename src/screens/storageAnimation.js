const MAX_FLIGHTS = 18;
const FLIGHT_MS = 550;
const INTERVAL_MS = 125;
const COUNT_MS = 100;
const SPARKLE_MS = 430;

const clampUnit = (value) => Math.max(0, Math.min(1, value));
const easeOut = (ratio) => 1 - (1 - ratio) ** 3;

export function createDepositTimeline(from, to) {
  const amount = to - from;
  const count = Math.min(MAX_FLIGHTS, amount);
  const flights = Array.from({ length: count }, (_, index) => {
    const start = 110 + index * INTERVAL_MS;
    return {
      start,
      arrival: start + FLIGHT_MS,
      amount: Math.floor(amount / count) + (index < amount % count ? 1 : 0),
    };
  });
  return { from, flights, duration: count ? flights[count - 1].arrival + SPARKLE_MS : 0 };
}

export function getDepositFrame(timeline, elapsed) {
  let total = timeline.from;
  let arrived = 0;
  for (const flight of timeline.flights) {
    if (elapsed < flight.arrival) break;
    arrived += 1;
    const progress = clampUnit((elapsed - flight.arrival) / COUNT_MS);
    total += Math.floor(flight.amount * easeOut(progress));
  }
  return { total, arrived };
}

export function drawDepositFrame(ctx, timeline, elapsed, { width, height }, target, coin) {
  const { x, y } = target;
  const centerX = width / 2;
  const centerY = height / 2;
  const startSize = Math.min(250, Math.min(width, height) * 0.36);
  for (const [index, flight] of timeline.flights.entries()) {
    if (elapsed < flight.start) break;
    if (elapsed < flight.arrival) {
      const progress = (elapsed - flight.start) / FLIGHT_MS;
      const eased = progress * progress * (3 - 2 * progress);
      const size = startSize + (30 - startSize) * eased;
      const arc = (index % 2 === 0 ? -1 : 1) * Math.sin(Math.PI * eased) * startSize * 0.45;
      ctx.save();
      ctx.translate(centerX + (x - centerX) * eased + arc, centerY + (y - centerY) * eased);
      ctx.scale(0.34 + 0.66 * Math.abs(Math.cos(progress * Math.PI * 2)), 1);
      ctx.shadowBlur = 11;
      ctx.shadowColor = "#ffc358";
      if (coin?.naturalWidth) {
        ctx.drawImage(coin, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = "#ffd468";
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      continue;
    }
    const life = (elapsed - flight.arrival) / SPARKLE_MS;
    if (life >= 1) continue;
    ctx.save();
    ctx.globalAlpha = (1 - life) ** 1.6;
    ctx.fillStyle = "#ffe491";
    for (let spark = 0; spark < 8; spark += 1) {
      const angle = spark * Math.PI / 4 + index * 0.43;
      const distance = 4 + easeOut(life) * (20 + (spark % 3) * 10);
      const sx = x + Math.cos(angle) * distance;
      const sy = y + Math.sin(angle) * distance + life * life * 12;
      ctx.fillRect(sx - 3, sy - 0.75, 6, 1.5);
      ctx.fillRect(sx - 0.75, sy - 3, 1.5, 6);
    }
    ctx.restore();
  }
}
