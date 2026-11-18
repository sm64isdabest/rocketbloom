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

test("assets raster usam WebP, preservando PNG nos sprites com transparência", () => {
  const rasterAssets = getAssetFiles(assetsDirectory).filter((path) => /\.(png|jpe?g|gif|bmp|tiff?|avif)$/i.test(path));

  const pngAssets = rasterAssets.map((path) => path.split(/[\\/]/).at(-1)).sort();
  assert.deepEqual(pngAssets, ["helicopter.png", "plane.png", "warning-alert.png"], "somente assets que precisam preservar transparência devem usar PNG");
  for (const path of rasterAssets) {
    const png = readFileSync(path);
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${path} deve ser PNG válido`);
    assert.equal(png[25], 6, `${path} deve preservar o canal alfa`);
  }

  const webpAssets = getAssetFiles(assetsDirectory).filter((path) => path.endsWith(".webp"));
  assert.ok(webpAssets.length > 0, "assets WebP devem existir");
  for (const path of webpAssets) {
    const signature = readFileSync(path).subarray(0, 12).toString("ascii");
    assert.equal(signature.slice(0, 4), "RIFF", `${path} deve ter assinatura RIFF`);
    assert.equal(signature.slice(8, 12), "WEBP", `${path} deve ter assinatura WebP`);
  }
});
