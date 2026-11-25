import assert from "node:assert/strict";
import test from "node:test";
import { POWER_UPS } from "../config/gameConfig.js";
import { activatePowerUp, createPowerUpState, getNextMysteryBoxDelay, getRandomPowerUp, tickPowerUps } from "./powerUps.js";

test("sorteia os cinco poderes com o mesmo índice de chance", () => {
  assert.equal(getRandomPowerUp(() => 0), "turbo");
  assert.equal(getRandomPowerUp(() => 0.199), "turbo");
  assert.equal(getRandomPowerUp(() => 0.2), "bubble");
  assert.equal(getRandomPowerUp(() => 0.4), "magnet");
  assert.equal(getRandomPowerUp(() => 0.6), "doubler");
  assert.equal(getRandomPowerUp(() => 0.8), "freeze");
  assert.deepEqual(Object.keys(POWER_UPS), ["turbo", "bubble", "magnet", "doubler", "freeze"]);
});

test("intervalo da caixa varia de 20 a 40 segundos", () => {
  assert.equal(getNextMysteryBoxDelay(() => 0), 20_000);
  assert.equal(getNextMysteryBoxDelay(() => 0.5), 30_000);
  assert.equal(getNextMysteryBoxDelay(() => 1), 40_000);
});

test("renova poderes temporários e preserva a bolha junto dos demais", () => {
  let state = createPowerUpState();
  state = activatePowerUp(state, "turbo");
  state = activatePowerUp(state, "bubble");
  state = activatePowerUp(state, "magnet");
  state = activatePowerUp(state, "doubler");
  state = activatePowerUp(state, "freeze");
  state = tickPowerUps(state, 1500);
  state = activatePowerUp(state, "magnet");
  assert.equal(state.turboMs, 5500);
  assert.equal(state.magnetMs, POWER_UPS.magnet.durationMs);
  assert.equal(state.doublerMs, 5500);
  assert.equal(state.freezeMs, 5500);
  assert.equal(state.bubble, true);
});

test("tempos congelam fora do jogo e decrementam somente com tempo ativo", () => {
  let state = activatePowerUp(createPowerUpState(), "turbo");
  state = activatePowerUp(state, "magnet");
  assert.equal(tickPowerUps(state, 5000, { paused: true }).turboMs, 7000);
  assert.equal(tickPowerUps(state, 5000).turboMs, 2000);
  assert.equal(tickPowerUps(state, 9000).turboMs, 0);
  assert.equal(tickPowerUps(state, 9000).magnetMs, 0);
});

test("bolha é consumida por uma única penalidade", () => {
  const state = activatePowerUp(createPowerUpState(), "bubble");
  assert.deepEqual(activatePowerUp(state, "consume-bubble"), { ...state, bubble: false });
});
