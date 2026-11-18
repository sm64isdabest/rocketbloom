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

test("mantém a largura lógica do gameplay em telas estreitas e largas", () => {
  const originalWindow = globalThis.window;
  globalThis.window = { devicePixelRatio: 1 };
  try {
    for (const cssWidth of [320, 1080]) {
      const { canvas } = createCanvas(cssWidth, 640);
      const view = fitCanvasToContainer(canvas);
      assert.equal(view.width, VIEW.designWidth);
      assert.equal(view.scale, cssWidth / VIEW.designWidth);
      assert.equal(view.height, 640 / view.scale);
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
    assert.equal(view.width, VIEW.designWidth);
    assert.equal(view.dpr, 2);
    assert.deepEqual(transforms.at(-1), [2 * (320 / VIEW.designWidth), 0, 0, 2 * (320 / VIEW.designWidth), 0, 0]);
  } finally {
    globalThis.window = originalWindow;
  }
});
