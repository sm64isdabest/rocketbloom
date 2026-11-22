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

  const seamlessBackgrounds = assetFiles.filter((path) => path.includes("/backgrounds/") && path.endsWith("_seamless.jpg"));
  assert.equal(seamlessBackgrounds.length, 4, "cada planeta deve ter uma cópia contínua do cenário");
  for (const path of seamlessBackgrounds) {
    const jpeg = readFileSync(path);
    assert.equal(jpeg[0], 0xff, `${path} deve ter assinatura JPEG válida`);
    assert.equal(jpeg[1], 0xd8, `${path} deve ter assinatura JPEG válida`);
  }

  const approvedPng = assetFiles.filter((path) => ["/netuno_diamond_rain.png", "/marte_new.png", "/return-portal.png"].some((name) => path.endsWith(name)));
  assert.equal(approvedPng.length, 3, "as artes aprovadas de Netuno, Marte e saída devem existir como PNG");
  for (const path of approvedPng) {
    assert.equal(readFileSync(path).subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${path} deve ser PNG válido`);
  }

  const rasterAssets = assetFiles.filter((path) => /\.(png|jpe?g|gif|bmp|tiff?|avif)$/i.test(path)
    && !levelSprites.includes(path) && !seamlessBackgrounds.includes(path) && !approvedPng.includes(path));
  assert.deepEqual(rasterAssets, [], "os demais assets raster devem usar WebP");

  const webpAssets = assetFiles.filter((path) => path.endsWith(".webp"));
  assert.ok(webpAssets.length > 0, "assets WebP devem existir");
  for (const path of webpAssets) {
    const signature = readFileSync(path).subarray(0, 12).toString("ascii");
    assert.equal(signature.slice(0, 4), "RIFF", `${path} deve ter assinatura RIFF`);
    assert.equal(signature.slice(8, 12), "WEBP", `${path} deve ter assinatura WebP`);
  }
});
