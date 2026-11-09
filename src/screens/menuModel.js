export function getMenuAssetUrl(filename, basePath = "/") {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}assets/menu/${filename}`;
}

export function getSettingsReturnPage(currentPage, pages) {
  return currentPage === pages.PLANETS ? pages.PLANETS : pages.MENU;
}
