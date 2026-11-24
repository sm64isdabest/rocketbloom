import { EMPTY_TREASURE, GOLD_GOALS } from "../game/config/goldConfig.js";
import { preloadImages } from "../utils/preloadImages.js";

export const STORAGE_ICON = {
  normal: new URL("./storage/icon-normal.webp", import.meta.url).href,
  highlight: new URL("./storage/icon-highlight.webp", import.meta.url).href,
};

const TREASURE_ART = [
  new URL("./storage/treasure-0.webp", import.meta.url).href,
  new URL("./storage/treasure-1.webp", import.meta.url).href,
  new URL("./storage/treasure-2.webp", import.meta.url).href,
  new URL("./storage/treasure-3.webp", import.meta.url).href,
  new URL("./storage/treasure-4.webp", import.meta.url).href,
  new URL("./storage/treasure-5.webp", import.meta.url).href,
];

export function getTreasureArt(level) {
  const art = TREASURE_ART[level];
  return typeof art === "string" ? art : TREASURE_ART[EMPTY_TREASURE.level];
}

let preloading;
export function preloadStorageAssets(ImageConstructor = globalThis.Image) {
  preloading ??= preloadImages([
    STORAGE_ICON.normal,
    STORAGE_ICON.highlight,
    getTreasureArt(EMPTY_TREASURE.level),
    ...GOLD_GOALS.map(({ treasure }) => getTreasureArt(treasure.level)),
    ...GOLD_GOALS.map(({ overlay }) => overlay),
  ], { ImageConstructor });
  return preloading;
}
