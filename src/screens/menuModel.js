export function getMenuAssetUrl(filename, basePath = "/") {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}assets/menu/${filename}`;
}
