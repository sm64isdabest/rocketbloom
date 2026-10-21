import assert from "node:assert/strict";
import test from "node:test";
import { createGameLoop } from "./loop.js";

function withAnimationFrameMocks(run) {
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  let nextId = 0;
  const callbacks = new Map();
  const cancelled = [];
  globalThis.requestAnimationFrame = (callback) => {
    const id = ++nextId;
    callbacks.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => {
    cancelled.push(id);
    callbacks.delete(id);
  };
  try {
    run({ callbacks, cancelled, fireNext: (time) => {
      const [id, callback] = callbacks.entries().next().value ?? [];
      if (!callback) return false;
      callbacks.delete(id);
      callback(time);
      return true;
    } });
  } finally {
    globalThis.requestAnimationFrame = originalRequest;
    globalThis.cancelAnimationFrame = originalCancel;
  }
}

test("pausar e retomar preserva um único loop de animação", () => {
  withAnimationFrameMocks(({ callbacks, fireNext }) => {
    let ticks = 0;
    const loop = createGameLoop(() => { ticks += 1; });
    loop.start();
    loop.start();
    assert.equal(callbacks.size, 1);
    fireNext(16);
    assert.equal(ticks, 1);
    assert.equal(callbacks.size, 1);
    loop.stop();
    loop.stop();
    assert.equal(callbacks.size, 0);
    fireNext(32);
    assert.equal(ticks, 1);
    loop.start();
    loop.start();
    assert.equal(callbacks.size, 1);
    fireNext(48);
    assert.equal(ticks, 2);
    loop.stop();
    assert.equal(callbacks.size, 0);
  });
});

test("parar dentro de um tick de vitória não agenda outro frame", () => {
  withAnimationFrameMocks(({ callbacks, fireNext }) => {
    let loop;
    loop = createGameLoop(() => loop.stop());
    loop.start();
    fireNext(16);
    assert.equal(loop.isRunning, false);
    assert.equal(callbacks.size, 0);
  });
});
