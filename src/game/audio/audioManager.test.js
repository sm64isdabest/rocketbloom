import assert from "node:assert/strict";
import test from "node:test";
import { configureAudio, pauseGameAudio, pauseMenuAudio, playGameSound, scaleAudioVolume, startGameAudio, startMenuAudio } from "./audioManager.js";

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

test("gameplay music loops, follows the saved volume, and pauses with the game", () => {
  const tracks = [];
  class FakeAudio {
    constructor(source) {
      this.src = source;
      this.paused = true;
      tracks.push(this);
    }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }

  const priorAudio = globalThis.Audio;
  const priorWindow = globalThis.window;
  globalThis.Audio = FakeAudio;
  globalThis.window = { setTimeout: () => 1, clearTimeout() {} };
  try {
    configureAudio({ music: true, musicVolume: 35 });
    startGameAudio();

    assert.equal(tracks.length, 1);
    assert.equal(tracks[0].loop, true);
    assert.equal(tracks[0].volume, 0.35);
    assert.equal(tracks[0].paused, false);

    pauseGameAudio();
    assert.equal(tracks[0].paused, true);
  } finally {
    pauseGameAudio();
    configureAudio({ music: true, musicVolume: 100 });
    if (priorAudio === undefined) delete globalThis.Audio;
    else globalThis.Audio = priorAudio;
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test("menu music uses its own gentle loop and pauses outside menu screens", () => {
  const tracks = [];
  class FakeAudio {
    constructor(source) {
      this.src = source;
      this.paused = true;
      tracks.push(this);
    }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }

  const priorAudio = globalThis.Audio;
  globalThis.Audio = FakeAudio;
  try {
    configureAudio({ music: true, musicVolume: 40 });
    startMenuAudio();

    assert.equal(tracks.length, 1);
    assert.match(tracks[0].src, /menu-space-loop\.wav$/);
    assert.equal(tracks[0].loop, true);
    assert.equal(tracks[0].volume, 0.4);
    assert.equal(tracks[0].paused, false);

    pauseMenuAudio();
    assert.equal(tracks[0].paused, true);
  } finally {
    pauseMenuAudio();
    configureAudio({ music: true, musicVolume: 100 });
    if (priorAudio === undefined) delete globalThis.Audio;
    else globalThis.Audio = priorAudio;
  }
});
