import assert from "node:assert/strict";
import test from "node:test";
import { POWER_UPS } from "../config/gameConfig.js";
import { activatePowerUp, createPowerUpState, getNextMysteryBoxDelay, getRandomPowerUp, tickPowerUps } from "./powerUps.js";

test("sorteia os quatro poderes com o mesmo índice de chance", () => {
  assert.equal(getRandomPowerUp(() => 0), "turbo");
  assert.equal(getRandomPowerUp(() => 0.249), "turbo");
  assert.equal(getRandomPowerUp(() => 0.25), "star");
  assert.equal(getRandomPowerUp(() => 0.5), "bubble");
  assert.equal(getRandomPowerUp(() => 0.75), "shrink");
  assert.deepEqual(Object.keys(POWER_UPS), ["turbo", "star", "bubble", "shrink"]);
});

test("intervalo da caixa varia de 20 a 40 segundos", () => {
  assert.equal(getNextMysteryBoxDelay(() => 0), 20_000);
  assert.equal(getNextMysteryBoxDelay(() => 0.5), 30_000);
  assert.equal(getNextMysteryBoxDelay(() => 1), 40_000);
});

test("renova duração dos poderes iguais e mantém turbo junto de estrela e bolha", () => {
  let state = createPowerUpState();
  state = activatePowerUp(state, "turbo");
  state = activatePowerUp(state, "star");
  state = activatePowerUp(state, "bubble");
  state = tickPowerUps(state, 1500);
  state = activatePowerUp(state, "star");
  assert.equal(state.turboMs, 5500);
  assert.equal(state.starMs, POWER_UPS.star.durationMs);
  assert.equal(state.bubble, true);
});

test("tempos congelam fora do jogo e decrementam somente com tempo ativo", () => {
  let state = activatePowerUp(createPowerUpState(), "turbo");
  assert.equal(tickPowerUps(state, 5000, { paused: true }).turboMs, 7000);
  assert.equal(tickPowerUps(state, 5000).turboMs, 2000);
  assert.equal(tickPowerUps(state, 9000).turboMs, 0);
});

test("bolha é consumida por uma única penalidade", () => {
  const state = activatePowerUp(createPowerUpState(), "bubble");
  assert.deepEqual(activatePowerUp(state, "consume-bubble"), { ...state, bubble: false });
});
