import { EMPTY_TREASURE, GOLD_GOALS } from "../game/config/goldConfig.js";
import { preloadImages } from "../utils/preloadImages.js";

export const STORAGE_ICON = {
  normal: new URL("./storage/icon-normal.webp", import.meta.url).href,
  highlight: new URL("./storage/icon-highlight.webp", import.meta.url).href,
};

const TREASURE_ART = [
  new URL("./storage/vault/pile-0.webp", import.meta.url).href,
  new URL("./storage/vault/pile-1.webp", import.meta.url).href,
  new URL("./storage/vault/pile-2.webp", import.meta.url).href,
  new URL("./storage/vault/pile-3.webp", import.meta.url).href,
  new URL("./storage/vault/pile-4.webp", import.meta.url).href,
  new URL("./storage/vault/pile-5.webp", import.meta.url).href,
];

export const VAULT_BASE_ART = new URL("./storage/vault/platform.webp", import.meta.url).href;
export const VAULT_BUTTON_ART = {
  back: new URL("./storage/vault/button-back.webp", import.meta.url).href,
  settings: new URL("./storage/vault/button-settings.webp", import.meta.url).href,
  skip: new URL("./storage/vault/button-skip.webp", import.meta.url).href,
  decorations: new URL("./storage/vault/button-decorations.webp", import.meta.url).href,
  cosmetics: new URL("./storage/vault/button-cosmetics.webp", import.meta.url).href,
  close: new URL("./storage/vault/button-close.webp", import.meta.url).href,
};

export function getTreasureArt(level) {
  const art = TREASURE_ART[level];
  return typeof art === "string" ? art : TREASURE_ART[EMPTY_TREASURE.level];
}

let preloading;
export function preloadStorageAssets(ImageConstructor = globalThis.Image) {
  preloading ??= preloadImages([
    STORAGE_ICON.normal,
    STORAGE_ICON.highlight,
    VAULT_BASE_ART,
    ...Object.values(VAULT_BUTTON_ART),
    getTreasureArt(EMPTY_TREASURE.level),
    ...GOLD_GOALS.map(({ treasure }) => getTreasureArt(treasure.level)),
    ...GOLD_GOALS.map(({ overlay }) => overlay),
  ], { ImageConstructor });
  return preloading;
}
