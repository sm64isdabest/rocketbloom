import assert from "node:assert/strict";
import test from "node:test";
import { scaleAudioVolume } from "./audioManager.js";

test("audio volume scales linearly and clamps the percentage", () => {
  assert.equal(scaleAudioVolume(0.8, 25), 0.2);
  assert.equal(scaleAudioVolume(0.8, 0), 0);
  assert.equal(scaleAudioVolume(0.8, -30), 0);
  assert.equal(scaleAudioVolume(0.8, 150), 0.8);
});
