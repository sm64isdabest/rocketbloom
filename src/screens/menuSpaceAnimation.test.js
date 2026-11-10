import assert from "node:assert/strict";
import test from "node:test";
import { createMenuSpaceAnimation } from "./menuSpaceAnimation.js";

function createHarness() {
  const calls = [];
  let nextFrameId = 1;
  const frames = new Map();
  const cancelled = [];
  const context = new Proxy({}, {
    get(target, property) {
      if (property === "setTransform") return (...args) => calls.push([property, ...args]);
      if (property === "createRadialGradient") {
        return (...args) => {
          calls.push([property, ...args]);
          return { addColorStop: (...stopArgs) => calls.push(["addColorStop", ...stopArgs]) };
        };
      }
      if (!(property in target)) target[property] = (...args) => calls.push([property, ...args]);
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
  const canvas = {
    width: 0,
    height: 0,
    clientWidth: 800,
    clientHeight: 600,
    getContext: () => context,
  };

  return {
    canvas,
    calls,
    cancelled,
    frames,
    animationOptions: {
      random: () => 0.37,
      requestAnimationFrame(callback) {
        const id = nextFrameId++;
        frames.set(id, callback);
        return id;
      },
      cancelAnimationFrame(id) {
        cancelled.push(id);
        frames.delete(id);
      },
      getDevicePixelRatio: () => 1,
    },
  };
}

test("menu space animation draws layered stars and keeps requesting frames", () => {
  const harness = createHarness();
  const animation = createMenuSpaceAnimation(harness.canvas, harness.animationOptions);

  animation.start();

  assert.ok(harness.calls.some(([name]) => name === "arc"), "the canvas should render stars");
  assert.equal(harness.frames.size, 1, "continuous motion should schedule the next frame");
  assert.equal(harness.canvas.width, 800);
  assert.equal(harness.canvas.height, 600);

  const [frameId, frame] = harness.frames.entries().next().value;
  harness.frames.delete(frameId);
  frame(16);
  assert.equal(harness.frames.size, 1, "each frame should schedule its successor");

  animation.stop();
  assert.deepEqual(harness.cancelled, [2]);
});

test("reduced motion draws a still starfield without scheduling animation frames", () => {
  const harness = createHarness();
  const animation = createMenuSpaceAnimation(harness.canvas, {
    ...harness.animationOptions,
    reducedMotion: true,
  });

  animation.start();

  assert.ok(harness.calls.some(([name]) => name === "arc"), "the static background should still show stars");
  assert.equal(harness.frames.size, 0);
  animation.stop();
});

test("pointer movement eases the background layers by different amounts", () => {
  const harness = createHarness();
  const animation = createMenuSpaceAnimation(harness.canvas, harness.animationOptions);
  animation.start();
  animation.setPointer(1, -1);

  const step = (timestamp) => {
    const [frameId, frame] = harness.frames.entries().next().value;
    harness.frames.delete(frameId);
    frame(timestamp);
  };
  step(16);
  step(66);

  const horizontalOffsets = harness.calls
    .filter(([name]) => name === "translate")
    .map(([, x]) => x)
    .filter((x) => x < 0);
  assert.ok(horizontalOffsets.length >= 3, "each star layer should respond to pointer movement");
  assert.ok(new Set(horizontalOffsets.map((x) => x.toFixed(2))).size >= 3, "parallax depth should vary by layer");
  assert.ok(horizontalOffsets.every((x) => Math.abs(x) < 30), "the eased movement should stay subtle");
  animation.stop();
});

test("reduced motion ignores pointer-driven parallax", () => {
  const harness = createHarness();
  const animation = createMenuSpaceAnimation(harness.canvas, {
    ...harness.animationOptions,
    reducedMotion: true,
  });
  animation.start();
  const translationsBeforePointer = harness.calls.filter(([name]) => name === "translate").length;

  animation.setPointer(1, 1);

  assert.equal(harness.calls.filter(([name]) => name === "translate").length, translationsBeforePointer);
  animation.stop();
});
