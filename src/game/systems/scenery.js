const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const BACKGROUND_FILES = {
  earth: "terra_background.png",
  mars: "marte_background.png",
  saturn: "saturno_background.png",
  neptune: "netuno_background.png",
};
const backgroundImages = new Map();

function getBackgroundImage(planetId) {
  const filename = BACKGROUND_FILES[planetId];
  if (!filename || typeof Image === "undefined") return null;
  if (!backgroundImages.has(planetId)) {
    const image = new Image();
    image.src = `${APP_BASE}assets/backgrounds/${filename}`;
    backgroundImages.set(planetId, image);
  }
  return backgroundImages.get(planetId);
}

export function renderPlanetBackground(ctx, view, planet) {
  const image = getBackgroundImage(planet.id);
  if (!image?.complete || image.naturalWidth === 0) return false;

  const scale = Math.max(view.width / image.naturalWidth, view.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, (view.width - width) / 2, (view.height - height) / 2, width, height);
  return true;
}

function drawAmazon(ctx, width, height) {
  const horizon = height * 0.68;
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#092f26";
  ctx.beginPath(); ctx.moveTo(0, horizon + 28);
  for (let x = 0; x <= width + 24; x += 24) ctx.lineTo(x, horizon + Math.sin(x * 0.028) * 18 + 12);
  ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.52;
  for (let x = 16; x < width; x += 62) {
    const base = horizon + 45 + (x % 3) * 11;
    ctx.fillStyle = x % 2 ? "#12452d" : "#17613d";
    ctx.fillRect(x - 3, base - 70, 6, 104);
    ctx.beginPath(); ctx.arc(x, base - 72, 27 + x % 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 17, base - 55, 18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 17, base - 55, 19, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawMars(ctx, width, height) {
  const base = height * 0.76;
  ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = "#682c21";
  ctx.beginPath(); ctx.moveTo(0, base + 26); ctx.quadraticCurveTo(width * .2, base - 70, width * .42, base + 4);
  ctx.quadraticCurveTo(width * .7, base - 50, width, base + 15); ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#a84e2e"; ctx.globalAlpha = 0.35;
  for (let index = 0; index < 6; index += 1) {
    const x = (index * 79 + 22) % width; const y = base + 34 + index % 3 * 10;
    ctx.beginPath(); ctx.ellipse(x, y, 13 + index % 4 * 3, 5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawSaturn(ctx, width, height, accent) {
  const x = width * 0.72; const y = height * 0.2; const radius = Math.min(53, width * .17);
  ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = accent; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.ellipse(x, y, radius * 1.8, radius * .54, -0.2, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.42; ctx.fillStyle = "#d6ad70";
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.3; ctx.strokeStyle = "#f1d89b"; ctx.lineWidth = 2;
  for (let band = -2; band <= 2; band += 1) {
    ctx.beginPath(); ctx.ellipse(x, y + band * 9, radius * Math.sqrt(Math.max(.2, 1 - band * band * .025)), radius * .2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawNeptune(ctx, width, height, accent) {
  const x = width * .74; const y = height * .2; const radius = Math.min(49, width * .16);
  ctx.save(); ctx.globalAlpha = 0.09; ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.4; ctx.fillStyle = "#236ac0";
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.4; ctx.strokeStyle = "#8ce7ff"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, radius * 1.55, radius * .4, -.2, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.48; ctx.fillStyle = accent;
  for (let index = 0; index < 3; index += 1) {
    const px = width * (.2 + index * .16); const py = height * (.36 + index % 2 * .09);
    ctx.beginPath(); ctx.moveTo(px, py - 5); ctx.lineTo(px + 4, py); ctx.lineTo(px, py + 5); ctx.lineTo(px - 4, py); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function renderPlanetScenery(ctx, view, planet) {
  const { width, height } = view;
  if (!ctx || width <= 0 || height <= 0) return;
  if (planet.biome === "amazon") drawAmazon(ctx, width, height);
  else if (planet.biome === "mars") drawMars(ctx, width, height);
  else if (planet.biome === "saturn") drawSaturn(ctx, width, height, planet.theme.accent);
  else if (planet.biome === "neptune") drawNeptune(ctx, width, height, planet.theme.accent);
}
