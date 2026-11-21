import assert from "node:assert/strict";
import test from "node:test";
import { PLANETS } from "../data/planets.js";
import { renderPlanetBackground } from "./scenery.js";

test("o fundo repete verticalmente e desloca horizontalmente com a câmera", () => {
  const previousImage = globalThis.Image;
  const draws = [];
  const transforms = [];
  const images = [];
  globalThis.Image = class {
    complete = true;
    naturalWidth = 1600;
    naturalHeight = 909;
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
    assert.equal(images[0].source, "/assets/backgrounds/terra_background_seamless.jpg");
    assert.equal(images[0].sourceHeight, 941, "a escala usa a altura original do cenário");
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

    for (const [id, filename] of [["mars", "marte_background_seamless.jpg"], ["saturn", "saturno_background_seamless.jpg"], ["neptune", "netuno_background_seamless.jpg"]]) {
      assert.equal(renderPlanetBackground(ctx, { width: 320, height: 640 }, { id }, { offsetY: -10_000 }), true);
      assert.equal(images.at(-1).source, `/assets/backgrounds/${filename}`);
      assert.equal(images.at(-1).sourceHeight, 941, `${id} mantém a escala vertical original`);
      assert.ok(draws.slice(-4).every(([image]) => image === images.at(-1)), `${id} repete sua própria imagem`);
    }
  } finally {
    globalThis.Image = previousImage;
  }
});

test("os 20 níveis mantêm a escala e a repetição em telas desktop e celular", () => {
  const draws = [];
  const previousImage = globalThis.Image;
  globalThis.Image = class {
    complete = true;
    naturalWidth = 1600;
    naturalHeight = 909;
    set src(value) { this.source = value; }
  };
  try {
    const ctx = { drawImage: (...args) => draws.push(args) };
    const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
    for (const planet of PLANETS) {
      assert.equal(planet.stages.length, 5);
      for (const stage of planet.stages) {
        assert.equal(stage.planetId, planet.id);
        for (const view of viewports) {
          draws.length = 0;
          assert.equal(renderPlanetBackground(ctx, view, planet, { offsetY: -987_654.25 }), true);
          assert.ok(draws.length >= 2, `${stage.id} cobre o viewport ${view.width}x${view.height}`);
          const scale = Math.max(view.width / 1600, view.height / 941);
          const tileHeight = 909 * scale;
          assert.ok(Math.abs(draws[0][4] - tileHeight) < 0.001, `${stage.id} preserva o tamanho dos elementos`);
          for (let index = 1; index < draws.length; index += 1) {
            assert.ok(Math.abs((draws[index][2] - draws[index - 1][2]) - tileHeight) < 0.001,
              `${stage.id} repete sem lacunas no viewport ${view.width}x${view.height}`);
          }
        }
      }
    }
  } finally {
    globalThis.Image = previousImage;
  }
});
