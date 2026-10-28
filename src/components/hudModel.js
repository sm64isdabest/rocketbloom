export function getActiveQuestion(snapshot) {
  return snapshot?.question ?? null;
}

export function getHudAssetUrl(filename, basePath = "/") {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}assets/ui/${filename}`;
}
