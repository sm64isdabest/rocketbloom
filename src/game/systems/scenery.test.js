import assert from "node:assert/strict";
import test from "node:test";
import { renderPlanetBackground } from "./scenery.js";

test("o fundo repete verticalmente e desloca horizontalmente com a câmera", () => {
  const previousImage = globalThis.Image;
  const draws = [];
  globalThis.Image = class {
    complete = true;
    naturalWidth = 1600;
    naturalHeight = 900;
    set src(value) { this.source = value; }
  };
  try {
    const ctx = { drawImage: (...args) => draws.push(args), save() {}, restore() {}, translate() {}, scale() {} };
    assert.equal(renderPlanetBackground(ctx, { width: 320, height: 640 }, { id: "earth" }, { offsetX: 40, offsetY: 200 }), true);
    assert.ok(draws.length >= 2);
    const firstY = draws[0][2];
    draws.length = 0;
    renderPlanetBackground(ctx, { width: 320, height: 640 }, { id: "earth" }, { offsetY: 240 });
    assert.notEqual(draws[0][2], firstY, "a posição das cópias precisa acompanhar o offset vertical");
  } finally {
    globalThis.Image = previousImage;
  }
});
