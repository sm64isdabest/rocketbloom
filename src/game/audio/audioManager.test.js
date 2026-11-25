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

test("defeat plays a short low explosive burst through the configured effects volume", async () => {
  const frequencies = [];
  const waves = [];
  class FakeAudioContext {
    currentTime = 1;
    state = "running";
    destination = {};
    createOscillator() {
      return {
        set type(wave) { waves.push(wave); },
        frequency: { setValueAtTime: (frequency) => frequencies.push(frequency) },
        connect() {}, start() {}, stop() {},
      };
    }
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
  }

  const priorWindow = globalThis.window;
  globalThis.window = { AudioContext: FakeAudioContext, addEventListener() {} };
  try {
    const { configureAudio, playGameSound } = await import("./audioManager.js?defeat-explosion");
    configureAudio({ soundEffects: true, soundEffectsVolume: 100 });
    playGameSound("defeat");
    assert.ok(frequencies.length >= 3, "the defeat effect should contain a layered burst");
    assert.ok(frequencies.every((frequency) => frequency < 200), "the defeat effect should use low frequencies");
    assert.ok(waves.every((wave) => wave === "sawtooth"), "the defeat burst should sound rough and explosive");
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test("victory launch builds a filtered roar and silences it with the effects settings", async () => {
  const sources = [];
  const gainChanges = [];
  const frequencyChanges = [];
  const audioParam = (changes) => ({
    setValueAtTime(value, time) { changes.push({ value, time }); },
    exponentialRampToValueAtTime(value, time) { changes.push({ value, time }); },
  });
  class FakeAudioContext {
    currentTime = 1;
    sampleRate = 8000;
    state = "running";
    destination = {};
    createBuffer(_channels, length) {
      const samples = new Float32Array(length);
      return { getChannelData: () => samples };
    }
    createBufferSource() {
      const source = {
        starts: [], stops: [], connect() {}, disconnect() {},
        start(time) { this.starts.push(time); },
        stop(time) { this.stops.push(time); },
      };
      sources.push(source);
      return source;
    }
    createBiquadFilter() {
      return { frequency: audioParam(frequencyChanges), Q: { value: 0 }, connect() {}, disconnect() {} };
    }
    createGain() {
      return { gain: audioParam(gainChanges), connect() {}, disconnect() {} };
    }
  }

  const tracks = [];
  const priorAudio = globalThis.Audio;
  globalThis.Audio = class {
    constructor() { tracks.push(this); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  };
  const priorWindow = globalThis.window;
  globalThis.window = { AudioContext: FakeAudioContext, addEventListener() {} };
  try {
    const { configureAudio, playVictoryLaunchSound, startGameAudio } = await import("./audioManager.js?victory-launch");
    const play = () => playVictoryLaunchSound?.({ chargeMs: 900, ascentMs: 1900, tailMs: 350 });
    configureAudio({ soundEffects: false, soundEffectsVolume: 100 });
    play();
    configureAudio({ soundEffects: true, soundEffectsVolume: 0 });
    play();
    configureAudio({ muteAll: true, soundEffectsVolume: 40 });
    play();
    assert.equal(sources.length, 0);

    configureAudio({ muteAll: false });
    startGameAudio();
    play();
    assert.equal(tracks[0].paused, false, "a decolagem mantém a trilha da partida");
    assert.equal(sources.length, 1, "the launch synthesizes an exhaust roar");
    const [source] = sources;
    assert.ok(source.buffer.getChannelData(0).some((sample) => sample !== 0));
    assert.ok(source.stops[0] - source.starts[0] >= 3.15 - 1e-9);
    assert.ok(frequencyChanges.some(({ value, time }) => value > 500 && time > 1.9));
    assert.ok(gainChanges.some(({ value }) => value === 0.4));

    configureAudio({ muteAll: true });
    assert.equal(source.stops.at(-1), 1, "global mute cancels a roar already underway");
  } finally {
    if (priorAudio === undefined) delete globalThis.Audio;
    else globalThis.Audio = priorAudio;
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test("menu play click uses the independent interface-sound channel", async () => {
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
    const { configureAudio, playInterfaceSound } = await import("./audioManager.js?menu-click");
    configureAudio({ interfaceSounds: true, soundEffects: false });
    playInterfaceSound("menuClick");
    assert.deepEqual(frequencies, [659.25, 880]);
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test("interface sounds stay independent from gameplay effects", async () => {
  const frequencies = [];
  class FakeAudioContext {
    currentTime = 1;
    state = "running";
    destination = {};
    createOscillator() {
      return { type: "sine", frequency: { setValueAtTime: (frequency) => frequencies.push(frequency) }, connect() {}, start() {}, stop() {} };
    }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  }

  const priorWindow = globalThis.window;
  globalThis.window = { AudioContext: FakeAudioContext, addEventListener() {} };
  try {
    const { configureAudio, playGameSound, playInterfaceSound } = await import("./audioManager.js?independent-interface-sounds");
    configureAudio({ music: false, soundEffects: false, interfaceSounds: true, muteAll: false });
    playGameSound("coin");
    playInterfaceSound("menuClick");
    assert.deepEqual(frequencies, [659.25, 880]);

    frequencies.length = 0;
    configureAudio({ soundEffects: true, interfaceSounds: false });
    playInterfaceSound("menuClick");
    playGameSound("coin");
    assert.deepEqual(frequencies, [783.99, 1046.5]);
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test("interface volume scales only interface sounds and zero mutes them", async () => {
  const frequencies = [];
  const gainTargets = [];
  class FakeAudioContext {
    currentTime = 1;
    state = "running";
    destination = {};
    createOscillator() {
      return { type: "sine", frequency: { setValueAtTime: (frequency) => frequencies.push(frequency) }, connect() {}, start() {}, stop() {} };
    }
    createGain() {
      return { gain: { setValueAtTime: (value) => gainTargets.push(value), exponentialRampToValueAtTime: (value) => gainTargets.push(value) }, connect() {} };
    }
  }

  const priorWindow = globalThis.window;
  globalThis.window = { AudioContext: FakeAudioContext, addEventListener() {} };
  try {
    const { configureAudio, playGameSound, playInterfaceSound } = await import("./audioManager.js?interface-volume-slider");
    configureAudio({ soundEffects: true, soundEffectsVolume: 70, interfaceSoundsVolume: 25, muteAll: false });
    playInterfaceSound("menuClick");
    playGameSound("coin");
    assert.deepEqual(frequencies, [659.25, 880, 783.99, 1046.5]);
    assert.ok(gainTargets.includes(0.025), "interface volume should scale its own tone to 25%");
    assert.ok(gainTargets.includes(0.07), "game effects should retain their independent 70% volume");

    frequencies.length = 0;
    gainTargets.length = 0;
    configureAudio({ interfaceSoundsVolume: 0 });
    playInterfaceSound("menuClick");
    playGameSound("coin");
    assert.deepEqual(frequencies, [783.99, 1046.5], "zero should mute interface sounds without muting gameplay effects");

    frequencies.length = 0;
    gainTargets.length = 0;
    configureAudio({ interfaceSoundsVolume: 35 });
    playInterfaceSound("menuClick");
    assert.deepEqual(frequencies, [659.25, 880], "raising the slider should restore interface sounds");
    assert.ok(gainTargets.includes(0.035));
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test("silenciar todos pausa os canais sem perder seus volumes e permite restaurá-los", async () => {
  const frequencies = [];
  const toneVolumes = [];
  class FakeAudioContext {
    currentTime = 1;
    state = "running";
    destination = {};
    createOscillator() {
      return { type: "sine", frequency: { setValueAtTime: (frequency) => frequencies.push(frequency) }, connect() {}, start() {}, stop() {} };
    }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime: (volume) => toneVolumes.push(volume) }, connect() {} }; }
  }
  const tracks = [];
  class FakeAudio {
    constructor(url) { this.url = url; this.volume = 1; this.paused = false; tracks.push(this); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }

  const priorWindow = globalThis.window;
  const priorAudio = globalThis.Audio;
  globalThis.window = { AudioContext: FakeAudioContext, addEventListener() {} };
  globalThis.Audio = FakeAudio;
  try {
    const { configureAudio, playGameSound, playInterfaceSound, startMenuAudio } = await import("./audioManager.js?restore-after-global-mute");
    configureAudio({ music: true, musicVolume: 40, soundEffects: true, soundEffectsVolume: 80, interfaceSounds: true, interfaceSoundsVolume: 72, muteAll: true });
    startMenuAudio();
    playGameSound("coin");
    playInterfaceSound("menuClick");
    assert.equal(tracks.length, 0);
    assert.deepEqual(frequencies, []);

    configureAudio({ muteAll: false });
    startMenuAudio();
    playGameSound("coin");
    playInterfaceSound("menuClick");
    assert.equal(tracks.length, 1);
    assert.equal(tracks[0].volume, 0.4);
    assert.deepEqual(frequencies, [783.99, 1046.5, 659.25, 880]);
    assert.ok(toneVolumes.some((volume) => Math.abs(volume - 0.08) < 1e-9), "gameplay effects should keep their saved volume after global mute");
    assert.ok(toneVolumes.some((volume) => Math.abs(volume - 0.072) < 1e-9), "interface sounds should keep their saved volume after global mute");
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
    if (priorAudio === undefined) delete globalThis.Audio;
    else globalThis.Audio = priorAudio;
  }
});

test("silenciar todos corta um som de interface que já estava agendado", async () => {
  const gainChanges = [];
  const oscillatorStopTimes = [];
  class FakeAudioContext {
    currentTime = 1;
    state = "running";
    destination = {};
    createOscillator() {
      return { type: "sine", frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop: (time) => oscillatorStopTimes.push(time) };
    }
    createGain() {
      return { gain: { setValueAtTime: (value) => gainChanges.push(value), exponentialRampToValueAtTime() {} }, connect() {} };
    }
  }

  const priorWindow = globalThis.window;
  globalThis.window = { AudioContext: FakeAudioContext, addEventListener() {} };
  try {
    const { configureAudio, playInterfaceSound } = await import("./audioManager.js?mute-interrupts-pending-sounds");
    configureAudio({ interfaceSounds: true, muteAll: false });
    playInterfaceSound("menuClick");
    configureAudio({ muteAll: true });

    assert.ok(gainChanges.includes(0), "the shared audio output should be cut immediately");
    assert.equal(oscillatorStopTimes.filter((time) => time === 1).length, 2, "already scheduled interface tones should be canceled now");
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test("angry rocket touch plays a low, short effect through the configured sound volume", async () => {
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
    const { configureAudio, playGameSound } = await import("./audioManager.js?angry-touch-enabled");
    configureAudio({ soundEffects: true, soundEffectsVolume: 75 });
    playGameSound("angryTouch");
    assert.ok(frequencies.length >= 2, "the angry touch effect should contain multiple tones");
    assert.ok(frequencies.every((frequency) => frequency < 400), "the effect should sound lower than the happy game chimes");
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test("angry rocket touch stays silent when sound effects are disabled or muted", async () => {
  let oscillatorCount = 0;
  class FakeAudioContext {
    currentTime = 1;
    state = "running";
    destination = {};
    createOscillator() {
      oscillatorCount += 1;
      return { frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} };
    }
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
  }

  const priorWindow = globalThis.window;
  globalThis.window = { AudioContext: FakeAudioContext, addEventListener() {} };
  try {
    const { configureAudio, playGameSound } = await import("./audioManager.js?angry-touch-muted");
    configureAudio({ soundEffects: false, soundEffectsVolume: 80 });
    playGameSound("angryTouch");
    configureAudio({ soundEffects: true, soundEffectsVolume: 0 });
    playGameSound("angryTouch");
    assert.equal(oscillatorCount, 0);
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
