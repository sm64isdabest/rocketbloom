import assert from "node:assert/strict";
import test from "node:test";
import { getAudioVolumeChange } from "./settingsModel.js";

test("music slider reaching zero and rising again updates only music", () => {
  assert.deepEqual(getAudioVolumeChange("musicVolume", 0), { musicVolume: 0, music: false });
  assert.deepEqual(getAudioVolumeChange("musicVolume", 63), { musicVolume: 63, music: true });
});

test("effects slider reaching zero and rising again updates only effects", () => {
  assert.deepEqual(getAudioVolumeChange("soundEffectsVolume", 0), { soundEffectsVolume: 0, soundEffects: false });
  assert.deepEqual(getAudioVolumeChange("soundEffectsVolume", 63), { soundEffectsVolume: 63, soundEffects: true });
});

test("interface volume reaching zero and rising again updates only interface sounds", () => {
  assert.deepEqual(getAudioVolumeChange("interfaceSoundsVolume", 0), { interfaceSoundsVolume: 0, interfaceSounds: false });
  assert.deepEqual(getAudioVolumeChange("interfaceSoundsVolume", 63), { interfaceSoundsVolume: 63, interfaceSounds: true });
});

test("audio volume slider values remain within the configured range", () => {
  assert.deepEqual(getAudioVolumeChange("musicVolume", -8), { musicVolume: 0, music: false });
  assert.deepEqual(getAudioVolumeChange("soundEffectsVolume", 108), { soundEffectsVolume: 100, soundEffects: true });
  assert.deepEqual(getAudioVolumeChange("interfaceSoundsVolume", 108), { interfaceSoundsVolume: 100, interfaceSounds: true });
});
