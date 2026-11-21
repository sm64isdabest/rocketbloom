import assert from "node:assert/strict";
import test from "node:test";
import { renderPlanetBackground } from "./scenery.js";

test("o fundo repete verticalmente e desloca horizontalmente com a câmera", () => {
  const previousImage = globalThis.Image;
  const draws = [];
  const transforms = [];
  const images = [];
  globalThis.Image = class {
    complete = true;
    naturalWidth = 1600;
    naturalHeight = 900;
    constructor() { images.push(this); }
    set src(value) { this.source = value; }
  };
  try {
    const ctx = {
      drawImage: (...args) => draws.push(args),
      save: () => transforms.push("save"),
      restore: () => transforms.push("restore"),
      translate: () => transforms.push("translate"),
      scale: () => transforms.push("scale"),
    };
    assert.equal(renderPlanetBackground(ctx, { width: 320, height: 640 }, { id: "earth" }, { offsetX: 40, offsetY: 200 }), true);
    assert.ok(draws.length >= 2);
    assert.ok(draws.every(([image]) => image === images[0]), "todas as cópias usam a imagem original");
    assert.deepEqual(transforms, [], "as cópias não usam transformações de espelhamento");
    for (let index = 1; index < draws.length; index += 1) {
      assert.equal(draws[index][2] - draws[index - 1][2], draws[index - 1][4], "as cópias ficam encostadas sem lacunas");
    }
    const firstY = draws[0][2];
    draws.length = 0;
    renderPlanetBackground(ctx, { width: 320, height: 640 }, { id: "earth" }, { offsetY: 240 });
    assert.notEqual(draws[0][2], firstY, "a posição das cópias precisa acompanhar o offset vertical");
    assert.ok(draws.every(([image]) => image === images[0]));
    assert.deepEqual(transforms, []);

    for (const [id, filename] of [["mars", "marte_background.webp"], ["saturn", "saturno_background.webp"], ["neptune", "netuno_background.webp"]]) {
      assert.equal(renderPlanetBackground(ctx, { width: 320, height: 640 }, { id }, { offsetY: -10_000 }), true);
      assert.equal(images.at(-1).source, `/assets/backgrounds/${filename}`);
      assert.ok(draws.slice(-4).every(([image]) => image === images.at(-1)), `${id} repete sua própria imagem`);
    }
  } finally {
    globalThis.Image = previousImage;
  }
});
