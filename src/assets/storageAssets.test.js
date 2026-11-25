import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { GOLD_GOALS } from "../game/config/goldConfig.js";
import { getTreasureArt, preloadStorageAssets, STORAGE_ICON, VAULT_BASE_ART, VAULT_BUTTON_ART } from "./storageAssets.js";

test("cada meta e o ícone do Cofre têm arte WebP própria com transparência", () => {
  const arts = [
    STORAGE_ICON,
    VAULT_BASE_ART,
    ...Object.values(VAULT_BUTTON_ART),
    getTreasureArt(0),
    ...GOLD_GOALS.map(({ treasure }) => getTreasureArt(treasure.level)),
  ];
  const contents = new Set();
  for (const art of arts) {
    const image = readFileSync(new URL(art));
    assert.match(art, /\.webp$/);
    assert.equal(image.toString("ascii", 8, 16), "WEBPVP8L");
    assert.ok(image.readUInt32LE(21) & (1 << 28), "a arte preserva a transparência");
    contents.add(image.toString("base64"));
  }
  assert.equal(contents.size, arts.length);
  assert.equal(getTreasureArt(-1), getTreasureArt(0));
});

test("cada meta referencia uma sobreposição WebP distinta com transparência", () => {
  const overlays = GOLD_GOALS.map(({ overlay }) => overlay);
  assert.equal(new Set(overlays).size, GOLD_GOALS.length);
  for (const overlay of overlays) {
    const image = readFileSync(new URL(overlay));
    assert.equal(image.subarray(8, 12).toString("ascii"), "WEBP");
    assert.equal(image.subarray(12, 16).toString("ascii"), "VP8X");
    assert.ok(image[20] & 0x10, "a faixa preserva alpha");
  }
});

test("pré-carrega cada imagem uma vez inclusive quando uma imagem falha", async () => {
  const attempted = [];
  class FakeImage {
    set src(url) {
      attempted.push(url);
      if (url === STORAGE_ICON) this.onerror();
      else this.onload();
    }
  }
  const pending = preloadStorageAssets(FakeImage);
  assert.equal(preloadStorageAssets(FakeImage), pending);
  const result = await pending;
  assert.equal(result.failed, 1);
  assert.equal(result.loaded, GOLD_GOALS.length * 2 + 2 + Object.keys(VAULT_BUTTON_ART).length);
  assert.equal(attempted.length, new Set(attempted).size);
});
