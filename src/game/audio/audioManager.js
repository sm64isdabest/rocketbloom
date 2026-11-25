import { AUDIO } from "../config/gameConfig.js";

let audioContext = null;
let gameAudioActive = false;
let menuAudioActive = false;
let gameplayMusic = null;
let menuMusic = null;
let masterGain = null;
let victoryLaunchAudio = null;
const activeOscillators = new Set();
let preferences = {
  music: true,
  soundEffects: true,
  musicVolume: AUDIO.defaultMusicVolume,
  soundEffectsVolume: AUDIO.defaultSoundEffectsVolume,
  interfaceSoundsVolume: AUDIO.defaultInterfaceSoundsVolume,
  interfaceSounds: true,
  muteAll: false,
};

export function scaleAudioVolume(sourceVolume, volumePercent) {
  const percent = Number.isFinite(volumePercent)
    ? Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, volumePercent))
    : AUDIO.maxVolume;
  return sourceVolume * percent / AUDIO.maxVolume;
}

const GAMEPLAY_MUSIC_URLS = {
  earth: new URL("../../assets/gameplay-space-loop.mp3", import.meta.url).href,
  mars: new URL("../../assets/gameplay-mars-loop.mp3", import.meta.url).href,
  saturn: new URL("../../assets/gameplay-saturn-loop.mp3", import.meta.url).href,
  neptune: new URL("../../assets/gameplay-neptune-loop.mp3", import.meta.url).href,
};
let gameplayMusicUrl = GAMEPLAY_MUSIC_URLS.earth;
const MENU_MUSIC_URL = new URL("../../assets/menu-space-loop.mp3", import.meta.url).href;
const SOUND_NOTES = {
  correct: { notes: [523.25, 659.25, 783.99], duration: 0.11, wave: "sine", volume: 0.12 },
  incorrect: { notes: [293.66, 246.94], duration: 0.14, wave: "triangle", volume: 0.12 },
  collision: { notes: [130.81, 98], duration: 0.1, wave: "sawtooth", volume: 0.1 },
  coin: { notes: [783.99, 1046.5], duration: 0.075, wave: "sine", volume: 0.1 },
  goldDeposit: { notes: [1174.66, 1760, 2349.32], duration: 0.09, spacing: 0.022, wave: "triangle", volume: 0.075 },
  angryTouch: { notes: [196, 164.81, 138.59], duration: 0.12, wave: "sawtooth", volume: 0.1 },
  victory: { notes: [523.25, 659.25, 783.99, 1046.5], duration: 0.2, wave: "triangle", volume: 0.12 },
  discovery: { notes: [523.25, 659.25, 783.99, 1046.5, 1318.51], duration: 0.16, wave: "sine", volume: 0.12 },
  turbo: { notes: [146.83, 220, 329.63, 493.88, 739.99], duration: 0.14, spacing: 0.042, wave: "sawtooth", volume: 0.08 },
  bubble: { notes: [261.63, 392, 523.25, 659.25], duration: 0.19, spacing: 0.065, wave: "sine", volume: 0.13 },
  magnet: { notes: [349.23, 293.66, 349.23, 293.66, 220], duration: 0.095, spacing: 0.055, wave: "triangle", volume: 0.12 },
  doubler: { notes: [1046.5, 1567.98, 1046.5, 2093], duration: 0.105, spacing: 0.06, wave: "triangle", volume: 0.09 },
  freeze: { notes: [2349.32, 1760, 1318.51, 880], duration: 0.22, spacing: 0.042, wave: "sine", volume: 0.07 },
  defeat: { notes: [130.81, 65.41, 32.7], duration: 0.3, wave: "sawtooth", volume: 0.14, spacing: 0.045 },
};
const INTERFACE_SOUNDS = {
  menuClick: { notes: [659.25, 880], duration: 0.07, wave: "sine", volume: 0.1 },
};

function getContext() {
  if (audioContext) return audioContext;
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(preferences.muteAll ? 0 : 1, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
    const resume = () => { if (audioContext?.state === "suspended") audioContext.resume().catch(() => {}); };
    window.addEventListener("pointerdown", resume, { passive: true });
    window.addEventListener("keydown", resume);
    return audioContext;
  } catch {
    return null;
  }
}

function playTone(frequency, startAt, duration, wave, volume) {
  const context = getContext();
  if (!context) return;
  if (context.state === "suspended") context.resume().catch(() => {});
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(masterGain ?? context.destination);
  activeOscillators.add(oscillator);
  oscillator.onended = () => { activeOscillators.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playSequence(notes, duration, wave, volume, spacing = duration * 0.82) {
  const context = getContext();
  if (!context) return;
  const startAt = context.currentTime + 0.015;
  notes.forEach((frequency, index) => playTone(frequency, startAt + index * spacing, duration, wave, volume));
}

function stopVictoryLaunchSound() {
  if (!victoryLaunchAudio) return;
  const { source } = victoryLaunchAudio;
  victoryLaunchAudio = null;
  source.stop(audioContext.currentTime);
}

export function playVictoryLaunchSound({ chargeMs, ascentMs, tailMs }) {
  stopVictoryLaunchSound();
  if (preferences.muteAll || !preferences.soundEffects || preferences.soundEffectsVolume <= AUDIO.minVolume) return;
  const context = getContext();
  if (!context) return;
  if (context.state === "suspended") context.resume().catch(() => {});

  const startAt = context.currentTime + 0.015;
  const ignitionAt = startAt + chargeMs / 1000;
  const exitAt = ignitionAt + ascentMs / 1000;
  const endAt = exitAt + tailMs / 1000;
  const noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(95, startAt);
  filter.frequency.exponentialRampToValueAtTime(310, ignitionAt);
  filter.frequency.exponentialRampToValueAtTime(1250, ignitionAt + 0.2);
  filter.frequency.exponentialRampToValueAtTime(570, exitAt);
  filter.frequency.exponentialRampToValueAtTime(140, endAt);

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(0.14, startAt + 0.12);
  envelope.gain.exponentialRampToValueAtTime(0.48, ignitionAt);
  envelope.gain.exponentialRampToValueAtTime(1.05, ignitionAt + 0.16);
  envelope.gain.exponentialRampToValueAtTime(0.24, exitAt);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endAt);

  const volume = context.createGain();
  volume.gain.setValueAtTime(scaleAudioVolume(1, preferences.soundEffectsVolume), context.currentTime);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(volume);
  volume.connect(masterGain ?? context.destination);
  victoryLaunchAudio = { source, volume };
  source.onended = () => {
    if (victoryLaunchAudio?.source === source) victoryLaunchAudio = null;
    source.disconnect();
    filter.disconnect();
    envelope.disconnect();
    volume.disconnect();
  };
  source.start(startAt);
  source.stop(endAt);
}

function stopMusic() {
  gameplayMusic?.pause();
}

function stopMenuMusic() {
  menuMusic?.pause();
}

function startMusic() {
  if (!gameAudioActive || preferences.muteAll || !preferences.music || preferences.musicVolume <= AUDIO.minVolume) return;
  if (typeof Audio === "undefined") return;
  if (!gameplayMusic) {
    try {
      gameplayMusic = new Audio(gameplayMusicUrl);
      gameplayMusic.loop = true;
      gameplayMusic.preload = "auto";
    } catch {
      return;
    }
  }
  gameplayMusic.volume = scaleAudioVolume(1, preferences.musicVolume);
  const playback = gameplayMusic.play();
  if (playback?.catch) playback.catch(() => {});
}

function startMenuTrack() {
  if (!menuAudioActive || preferences.muteAll || !preferences.music || preferences.musicVolume <= AUDIO.minVolume) return;
  if (typeof Audio === "undefined") return;
  if (!menuMusic) {
    try {
      menuMusic = new Audio();
      menuMusic.loop = true;
      menuMusic.preload = "metadata";
      menuMusic.src = MENU_MUSIC_URL;
    } catch {
      return;
    }
  }
  menuMusic.volume = scaleAudioVolume(1, preferences.musicVolume);
  const playback = menuMusic.play();
  if (playback?.catch) playback.catch(() => {});
}

export function configureAudio(nextPreferences = {}) {
  const wasMuted = preferences.muteAll;
  preferences = { ...preferences, ...nextPreferences };
  if (Object.hasOwn(nextPreferences, "interfaceSoundsVolume")) {
    preferences.interfaceSoundsVolume = Number.isFinite(Number(nextPreferences.interfaceSoundsVolume))
      ? Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, Number(nextPreferences.interfaceSoundsVolume)))
      : AUDIO.defaultInterfaceSoundsVolume;
    preferences.interfaceSounds = preferences.interfaceSoundsVolume > AUDIO.minVolume;
  } else if (Object.hasOwn(nextPreferences, "interfaceSounds")) {
    preferences.interfaceSounds = Boolean(nextPreferences.interfaceSounds);
    if (!preferences.interfaceSounds) preferences.interfaceSoundsVolume = AUDIO.minVolume;
    else if (preferences.interfaceSoundsVolume <= AUDIO.minVolume) preferences.interfaceSoundsVolume = AUDIO.defaultInterfaceSoundsVolume;
  }
  if (masterGain && wasMuted !== preferences.muteAll) {
    masterGain.gain.setValueAtTime(preferences.muteAll ? 0 : 1, audioContext.currentTime);
  }
  if (preferences.muteAll && !wasMuted && audioContext) {
    for (const oscillator of activeOscillators) {
      try { oscillator.stop(audioContext.currentTime); } catch { /* A tone may have ended during this update. */ }
    }
    activeOscillators.clear();
  }
  if (victoryLaunchAudio) {
    if (preferences.muteAll || !preferences.soundEffects || preferences.soundEffectsVolume <= AUDIO.minVolume) {
      stopVictoryLaunchSound();
    } else {
      victoryLaunchAudio.volume.gain.setValueAtTime(scaleAudioVolume(1, preferences.soundEffectsVolume), audioContext.currentTime);
    }
  }
  if (gameplayMusic) gameplayMusic.volume = scaleAudioVolume(1, preferences.musicVolume);
  if (menuMusic) menuMusic.volume = scaleAudioVolume(1, preferences.musicVolume);
  if (preferences.muteAll || !preferences.music || preferences.musicVolume <= AUDIO.minVolume) {
    stopMusic();
    stopMenuMusic();
  } else if (gameAudioActive) startMusic();
  else if (menuAudioActive) startMenuTrack();
}

export function startGameAudio(planetId = "earth") {
  pauseMenuAudio();
  const trackUrl = Object.hasOwn(GAMEPLAY_MUSIC_URLS, planetId) ? GAMEPLAY_MUSIC_URLS[planetId] : GAMEPLAY_MUSIC_URLS.earth;
  if (gameplayMusicUrl !== trackUrl) {
    stopMusic();
    gameplayMusic = null;
    gameplayMusicUrl = trackUrl;
  }
  gameAudioActive = true;
  startMusic();
}

export function pauseGameAudio() {
  gameAudioActive = false;
  stopMusic();
  stopVictoryLaunchSound();
}

export function startMenuAudio() {
  pauseGameAudio();
  menuAudioActive = true;
  startMenuTrack();
}

export function pauseMenuAudio() {
  menuAudioActive = false;
  stopMenuMusic();
}

export function finishGameAudio(outcome) {
  pauseGameAudio();
  playGameSound(outcome);
}

export function playGameSound(name) {
  if (preferences.muteAll || !preferences.soundEffects || preferences.soundEffectsVolume <= AUDIO.minVolume) return;
  const sound = SOUND_NOTES[name];
  if (sound) playSequence(sound.notes, sound.duration, sound.wave, scaleAudioVolume(sound.volume, preferences.soundEffectsVolume), sound.spacing);
}

export function playInterfaceSound(name) {
  if (preferences.muteAll || !preferences.interfaceSounds || preferences.interfaceSoundsVolume <= AUDIO.minVolume) return;
  const sound = INTERFACE_SOUNDS[name];
  if (sound) playSequence(sound.notes, sound.duration, sound.wave, scaleAudioVolume(sound.volume, preferences.interfaceSoundsVolume), sound.spacing);
}
