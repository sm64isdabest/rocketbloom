export function getActiveQuestion(snapshot) {
  return snapshot?.question ?? null;
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
