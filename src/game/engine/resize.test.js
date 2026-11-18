import assert from "node:assert/strict";
import test from "node:test";
import { VIEW } from "../config/gameConfig.js";
import { fitCanvasToContainer } from "./resize.js";

function createCanvas(width, height) {
  const transforms = [];
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    parentElement: { getBoundingClientRect: () => ({ width, height }) },
    getContext: () => ({ setTransform: (...args) => transforms.push(args) }),
  };
  return { canvas, transforms };
}

test("escala pela menor proporção para caber no viewport horizontal sem ampliar os assets", () => {
  const originalWindow = globalThis.window;
  globalThis.window = { devicePixelRatio: 1 };
  try {
    for (const { width: cssWidth, height: cssHeight } of [
      { width: 320, height: 640 },
      { width: 1080, height: 656 },
    ]) {
      const { canvas, transforms } = createCanvas(cssWidth, cssHeight);
      const view = fitCanvasToContainer(canvas);
      const expectedScale = Math.min(cssWidth / VIEW.designWidth, cssHeight / VIEW.designHeight);
      assert.equal(view.scale, expectedScale);
      assert.equal(view.width, cssWidth / expectedScale);
      assert.equal(view.height, cssHeight / expectedScale);
      assert.ok(view.scale <= 1, "viewports menores que o design não podem ampliar os assets");
      assert.deepEqual(transforms.at(-1), [expectedScale, 0, 0, expectedScale, 0, 0]);
    }
  } finally {
    globalThis.window = originalWindow;
  }
});

test("aplica DPR à resolução do canvas sem alterar o espaço lógico", () => {
  const originalWindow = globalThis.window;
  globalThis.window = { devicePixelRatio: 2 };
  try {
    const { canvas, transforms } = createCanvas(320, 640);
    const view = fitCanvasToContainer(canvas);
    assert.deepEqual([canvas.width, canvas.height], [640, 1280]);
    assert.equal(view.width, 320 / view.scale);
    assert.equal(view.dpr, 2);
    assert.deepEqual(transforms.at(-1), [2 * view.scale, 0, 0, 2 * view.scale, 0, 0]);
  } finally {
    globalThis.window = originalWindow;
  }
});
