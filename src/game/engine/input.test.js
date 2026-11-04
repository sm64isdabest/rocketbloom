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

test("o modo de controle pode mudar sem recriar o input nem reutilizar um ponteiro antigo", () => {
  withInputEnvironment(({ canvasListeners, target, canvas }) => {
    const input = createInputController(target, "pointer");
    const rocket = new Rocket();
    rocket.place(320, 640);
    const initialX = rocket.x;

    canvasListeners.get("pointermove")({ clientX: 290, pointerType: "mouse" });
    input.apply(rocket, canvas, 0.1);
    assert.notEqual(rocket.targetX, initialX);

    input.setControlMode("keyboard");
    rocket.targetX = rocket.x;
    input.apply(rocket, canvas, 0.1);
    assert.equal(rocket.targetX, rocket.x);

    input.setControlMode("pointer");
    input.apply(rocket, canvas, 0.1);
    assert.equal(rocket.targetX, rocket.x, "switching back should wait for a fresh pointer position");

    canvasListeners.get("pointermove")({ clientX: 40, pointerType: "mouse" });
    input.apply(rocket, canvas, 0.1);
    assert.notEqual(rocket.targetX, rocket.x);
    input.destroy();
  });
});

test("desativar input do jogo deixa setas e espaço disponíveis para a interface", () => {
  withInputEnvironment(({ listeners, target, canvas }) => {
    const input = createInputController(target, "keyboard");
    const rocket = new Rocket();
    rocket.place(320, 640);
    const initialX = rocket.x;

    input.setEnabled(false);
    let preventedDefault = false;
    listeners.get("keydown")({ key: "ArrowRight", preventDefault() { preventedDefault = true; } });
    listeners.get("keydown")({ key: " ", preventDefault() { preventedDefault = true; } });
    input.apply(rocket, canvas, 0.1);

    assert.equal(preventedDefault, false);
    assert.equal(rocket.targetX, initialX);

    input.setEnabled(true);
    listeners.get("keydown")({ key: "ArrowRight", preventDefault() {} });
    input.apply(rocket, canvas, 0.1);
    assert.ok(rocket.targetX > initialX);
    input.destroy();
  });
});
