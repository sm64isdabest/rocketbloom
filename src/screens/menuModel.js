export function getMenuAssetUrl(filename, basePath = "/") {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}assets/menu/${filename}`;
}

export function getMenuStartupImages(basePath) {
  return ["logo.webp", "background.webp", "play.webp", "settings.webp"]
    .map((filename) => getMenuAssetUrl(filename, basePath));
}
