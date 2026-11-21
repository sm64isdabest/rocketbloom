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

test("assets raster usam WebP", () => {
  const assetFiles = getAssetFiles(assetsDirectory);
  const levelSprites = assetFiles.filter((path) => path.includes("/levels/") && /\.png$/i.test(path));
  assert.equal(levelSprites.length, 20, "cada fase deve ter seu PNG original");
  for (const path of levelSprites) {
    const png = readFileSync(path);
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${path} deve ser um PNG válido`);
    assert.equal(png[25], 6, `${path} deve preservar o canal alfa`);
  }

  const rasterAssets = assetFiles.filter((path) => /\.(png|jpe?g|gif|bmp|tiff?|avif)$/i.test(path) && !levelSprites.includes(path));
  assert.deepEqual(rasterAssets, [], "os demais assets raster devem usar WebP");

  const webpAssets = assetFiles.filter((path) => path.endsWith(".webp"));
  assert.ok(webpAssets.length > 0, "assets WebP devem existir");
  for (const path of webpAssets) {
    const signature = readFileSync(path).subarray(0, 12).toString("ascii");
    assert.equal(signature.slice(0, 4), "RIFF", `${path} deve ter assinatura RIFF`);
    assert.equal(signature.slice(8, 12), "WEBP", `${path} deve ter assinatura WebP`);
  }
});
