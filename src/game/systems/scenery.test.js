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
    const ctx = { drawImage: (...args) => draws.push(args) };
    assert.equal(renderPlanetBackground(ctx, { width: 320, height: 640 }, { id: "earth" }, { offsetX: 40, offsetY: 200 }), true);
    assert.equal(draws.length, 2);
    assert.equal(draws[0][1], -368.8888888888889);
    assert.equal(draws[1][1], -368.8888888888889);
    assert.equal(draws[0][2] + draws[0][4], draws[1][2]);
  } finally {
    globalThis.Image = previousImage;
  }
});
