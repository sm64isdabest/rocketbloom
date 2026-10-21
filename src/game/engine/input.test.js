import assert from "node:assert/strict";
import test from "node:test";
import { createInputController } from "./input.js";
import { Rocket } from "../entities/Rocket.js";

function withInputEnvironment(run) {
  const previousWindow = globalThis.window;
  const listeners = new Map();
  globalThis.window = {
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const canvasListeners = new Map();
  const captured = [];
  const target = {
    addEventListener(name, callback) { canvasListeners.set(name, callback); },
    removeEventListener(name) { canvasListeners.delete(name); },
    setPointerCapture(pointerId) { captured.push(pointerId); },
  };
  const canvas = {
    clientWidth: 320,
    getBoundingClientRect: () => ({ left: 100, top: 0, width: 320, height: 640 }),
  };
  try {
    run({ listeners, canvasListeners, captured, target, canvas });
  } finally {
    globalThis.window = previousWindow;
  }
}

test("arrastar com toque captura o ponteiro e continua atualizando a posição", () => {
  withInputEnvironment(({ canvasListeners, captured, target, canvas }) => {
    const input = createInputController(target);
    const rocket = new Rocket();
    rocket.place(320, 640);
    canvasListeners.get("pointerdown")({ clientX: 180, pointerId: 7, pointerType: "touch" });
    canvasListeners.get("pointermove")({ clientX: 300, pointerId: 7, pointerType: "touch" });
    input.apply(rocket, canvas, 0.05);
    assert.deepEqual(captured, [7]);
    assert.ok(rocket.targetX > rocket.x);
    input.destroy();
  });
});

test("teclado continua controlando o foguete no modo mouse e toque", () => {
  withInputEnvironment(({ listeners, target, canvas }) => {
    const input = createInputController(target, "pointer");
    const rocket = new Rocket();
    rocket.place(320, 640);
    listeners.get("keydown")({ key: "ArrowRight", preventDefault() {} });
    input.apply(rocket, canvas, 0.1);
    assert.ok(rocket.targetX > rocket.x);
    input.destroy();
  });
});
