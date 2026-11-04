import { AUDIO } from "../config/gameConfig.js";

let audioContext = null;
let gameAudioActive = false;
let gameplayMusic = null;
let preferences = {
  music: true,
  soundEffects: true,
  musicVolume: AUDIO.defaultMusicVolume,
  soundEffectsVolume: AUDIO.defaultSoundEffectsVolume,
};

export function scaleAudioVolume(sourceVolume, volumePercent) {
  const percent = Number.isFinite(volumePercent)
    ? Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, volumePercent))
    : AUDIO.maxVolume;
  return sourceVolume * percent / AUDIO.maxVolume;
}

const GAMEPLAY_MUSIC_URL = new URL("../../assets/gameplay-space-loop.wav", import.meta.url).href;
const SOUND_NOTES = {
  correct: { notes: [523.25, 659.25, 783.99], duration: 0.11, wave: "sine", volume: 0.12 },
  incorrect: { notes: [293.66, 246.94], duration: 0.14, wave: "triangle", volume: 0.12 },
  collision: { notes: [130.81, 98], duration: 0.1, wave: "sawtooth", volume: 0.1 },
  coin: { notes: [783.99, 1046.5], duration: 0.075, wave: "sine", volume: 0.1 },
  diamond: { notes: [659.25, 987.77, 1318.51], duration: 0.1, wave: "sine", volume: 0.1 },
  victory: { notes: [523.25, 659.25, 783.99, 1046.5], duration: 0.2, wave: "triangle", volume: 0.12 },
  discovery: { notes: [523.25, 659.25, 783.99, 1046.5, 1318.51], duration: 0.16, wave: "sine", volume: 0.12 },
  defeat: { notes: [392, 329.63, 261.63, 196], duration: 0.24, wave: "triangle", volume: 0.12 },
};

function getContext() {
  if (audioContext) return audioContext;
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    audioContext = new AudioContextClass();
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
  gain.connect(context.destination);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playSequence(notes, duration, wave, volume, spacing = duration * 0.82) {
  const context = getContext();
  if (!context) return;
  const startAt = context.currentTime + 0.015;
  notes.forEach((frequency, index) => playTone(frequency, startAt + index * spacing, duration, wave, volume));
}

function stopMusic() {
  gameplayMusic?.pause();
}

function startMusic() {
  if (!gameAudioActive || !preferences.music || preferences.musicVolume <= AUDIO.minVolume) return;
  if (typeof Audio === "undefined") return;
  if (!gameplayMusic) {
    try {
      gameplayMusic = new Audio(GAMEPLAY_MUSIC_URL);
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

export function configureAudio(nextPreferences = {}) {
  preferences = { ...preferences, ...nextPreferences };
  if (gameplayMusic) gameplayMusic.volume = scaleAudioVolume(1, preferences.musicVolume);
  if (!preferences.music || preferences.musicVolume <= AUDIO.minVolume) stopMusic();
  else if (gameAudioActive) startMusic();
}

export function startGameAudio() {
  gameAudioActive = true;
  startMusic();
}

export function pauseGameAudio() {
  gameAudioActive = false;
  stopMusic();
}

export function finishGameAudio(outcome) {
  pauseGameAudio();
  playGameSound(outcome);
}

export function playGameSound(name) {
  if (!preferences.soundEffects || preferences.soundEffectsVolume <= AUDIO.minVolume) return;
  const sound = SOUND_NOTES[name];
  if (sound) playSequence(sound.notes, sound.duration, sound.wave, scaleAudioVolume(sound.volume, preferences.soundEffectsVolume));
}
