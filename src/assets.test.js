import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const imageDirectories = ["../public/assets/", "./assets/", "../artwork/", "../docs/demos/"]
  .map((path) => fileURLToPath(new URL(path, import.meta.url)));

function getImageFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return getImageFiles(path);
    return /\.(webp|png|jpe?g|gif|bmp|tiff?|avif|svg|ico)$/i.test(path) ? [path] : [];
  });
}

function hasWebpAlpha(image) {
  const chunk = image.toString("ascii", 12, 16);
  if (chunk === "VP8X") return Boolean(image[20] & 0x10);
  if (chunk === "VP8L") return Boolean(image.readUInt32LE(21) & (1 << 28));
  return false;
}

test("todas as imagens usam WebP e os sprites preservam a transparência", () => {
  const imageFiles = imageDirectories.flatMap(getImageFiles);
  assert.ok(imageFiles.length > 0, "as imagens WebP devem existir");

  const transparentLayers = [
    "laboratory-dome-back.webp",
    "laboratory-dome-front.webp",
    "laboratory-equipment-base.webp",
    "return-portal.webp",
  ];
  const requiredImages = [
    "menu/logo.webp",
    "laboratory-background-clean.webp",
    "marte_background_seamless.webp",
    "netuno_background_seamless.webp",
    "saturno_background_seamless.webp",
    ...transparentLayers,
  ];
  for (const filename of requiredImages) {
    assert.ok(imageFiles.some((path) => path.endsWith(`/${filename}`)), `${filename} deve existir`);
  }

  const levelSprites = imageFiles.filter((path) => path.includes("/levels/"));
  const plantSprites = imageFiles.filter((path) => path.includes("/laboratory/plant-"));
  assert.equal(levelSprites.length, 12, "cada fase deve ter sua arte");
  assert.equal(plantSprites.length, 12, "cada planeta deve ter três sprites de crescimento");

  for (const path of imageFiles) {
    assert.match(path, /\.webp$/i, `${path} deve usar extensão WebP`);
    const image = readFileSync(path);
    assert.equal(image.toString("ascii", 0, 4), "RIFF", `${path} deve ter assinatura RIFF`);
    assert.equal(image.toString("ascii", 8, 12), "WEBP", `${path} deve ter assinatura WebP`);
    if (levelSprites.includes(path) || plantSprites.includes(path)
      || transparentLayers.some((filename) => path.endsWith(`/${filename}`))) {
      assert.ok(hasWebpAlpha(image), `${path} deve preservar o canal alfa`);
    }
  }
});
