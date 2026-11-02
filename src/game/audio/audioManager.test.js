import assert from "node:assert/strict";
import test from "node:test";
import { configureAudio, playGameSound, scaleAudioVolume } from "./audioManager.js";

test("audio volume scales linearly and clamps the percentage", () => {
  assert.equal(scaleAudioVolume(0.8, 25), 0.2);
  assert.equal(scaleAudioVolume(0.8, 0), 0);
  assert.equal(scaleAudioVolume(0.8, -30), 0);
  assert.equal(scaleAudioVolume(0.8, 150), 0.8);
});

test("discovery plays a five-note fanfare through the configured effects volume", () => {
  const frequencies = [];
  class FakeAudioContext {
    currentTime = 1;
    state = "running";
    destination = {};
    createOscillator() {
      return {
        type: "sine",
        frequency: { setValueAtTime: (frequency) => frequencies.push(frequency) },
        connect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
  }

  const priorWindow = globalThis.window;
  globalThis.window = { AudioContext: FakeAudioContext, addEventListener() {} };
  try {
    configureAudio({ soundEffects: true, soundEffectsVolume: 100 });
    playGameSound("discovery");
    assert.deepEqual(frequencies, [523.25, 659.25, 783.99, 1046.5, 1318.51]);
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});
