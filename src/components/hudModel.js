export function getActiveQuestion(snapshot) {
  return snapshot?.question ?? null;
}

export function getStageProgressPercent(snapshot) {
  if (!Number.isFinite(snapshot?.stageDurationMs)) return null;
  return Math.floor(Math.max(0, Math.min(1, snapshot.stageProgress)) * 100);
}

export function getHudAssetUrl(filename, basePath = "/") {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}assets/ui/${filename}`;
}

// Cada poder usa sua ilustração própria, servida junto aos assets públicos.
export function getPowerUpAssetUrl(power, basePath = "/") {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}assets/powerups/${power}.png`;
}
