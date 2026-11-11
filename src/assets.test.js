import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const assetsDirectory = fileURLToPath(new URL("../public/assets/", import.meta.url));

function getAssetFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? getAssetFiles(path) : [path];
  });
}

test("todos os assets raster usam WebP", () => {
  const rasterAssets = getAssetFiles(assetsDirectory).filter((path) => /\.(png|jpe?g|gif|bmp|tiff?|avif)$/i.test(path));

  assert.deepEqual(rasterAssets, [], "assets raster devem ser convertidos para WebP");

  const webpAssets = getAssetFiles(assetsDirectory).filter((path) => path.endsWith(".webp"));
  assert.ok(webpAssets.length > 0, "assets WebP devem existir");
  for (const path of webpAssets) {
    const signature = readFileSync(path).subarray(0, 12).toString("ascii");
    assert.equal(signature.slice(0, 4), "RIFF", `${path} deve ter assinatura RIFF`);
    assert.equal(signature.slice(8, 12), "WEBP", `${path} deve ter assinatura WebP`);
  }
});
