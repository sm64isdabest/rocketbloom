import assert from "node:assert/strict";
import test from "node:test";
import { GOLD_GOALS } from "../game/config/goldConfig.js";
import { createTreasureSvg, getTreasureArt, preloadStorageAssets, STORAGE_ICON } from "./storageAssets.js";

test("cada meta tem um SVG próprio e progressivamente mais moedas", () => {
  let coins = 0;
  const arts = new Set();
  for (const treasure of [{ level: 0 }, ...GOLD_GOALS.map((goal) => goal.treasure)]) {
    const svg = createTreasureSvg(treasure.level);
    assert.match(svg, /^<svg[^>]*viewBox="0 0 420 240"/);
    const nextCoins = (svg.match(/href="#coin"/g) ?? []).length;
    if (treasure.level) assert.ok(nextCoins > coins);
    coins = nextCoins;
    arts.add(getTreasureArt(treasure.level));
  }
  assert.equal(arts.size, GOLD_GOALS.length + 1);
  assert.notEqual(STORAGE_ICON.normal, STORAGE_ICON.highlight);
  assert.equal(getTreasureArt(-1), getTreasureArt(0));
});

test("a decoração usa só o tesouro, sem plataforma, e ganha lingotes nas metas altas", () => {
  const first = createTreasureSvg(1, { floor: true });
  const last = createTreasureSvg(GOLD_GOALS.at(-1).treasure.level, { floor: true });
  assert.match(first, /href="#coin"/);
  assert.doesNotMatch(first, /M68 196|href="#ingot"/);
  assert.match(last, /href="#ingot"/);
  assert.notEqual(getTreasureArt(1, { floor: true }), getTreasureArt(1));
});

test("pré-carrega cada SVG uma vez inclusive quando uma imagem falha", async () => {
  const attempted = [];
  class FakeImage {
    set src(url) {
      attempted.push(url);
      if (url === STORAGE_ICON.normal) this.onerror();
      else this.onload();
    }
  }
  const pending = preloadStorageAssets(FakeImage);
  assert.equal(preloadStorageAssets(FakeImage), pending);
  const result = await pending;
  assert.equal(result.failed, 1);
  assert.equal(result.loaded, GOLD_GOALS.length * 2 + 2);
  assert.equal(attempted.length, new Set(attempted).size);
});
