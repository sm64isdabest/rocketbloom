import assert from "node:assert/strict";
import test from "node:test";
import { SPEED, REWARDS, POWER_UPS, getPlanetDifficulty } from "./gameConfig.js";

test("valores de velocidade e derrota estão definidos", () => {
  assert.equal(typeof SPEED.start, "number");
  assert.equal(SPEED.defeatAtOrBelow, 0);
  assert.ok(SPEED.max > SPEED.start);
  assert.ok(SPEED.correctAnswerBonus > 0);
  assert.ok(SPEED.wrongAnswerPenalty > SPEED.correctAnswerBonus);
  assert.ok(SPEED.minProgressMultiplier > 0);
});

test("recompensas numéricas ficam na configuração", () => {
  assert.equal(REWARDS.coinValue, 1);
  assert.ok(REWARDS.plantMoney > 0);
});

test("os três poderes novos usam exatamente a duração existente do turbo", () => {
  assert.equal(POWER_UPS.turbo.durationMs, 7000);
  assert.deepEqual([POWER_UPS.magnet.durationMs, POWER_UPS.doubler.durationMs, POWER_UPS.freeze.durationMs], [7000, 7000, 7000]);
  assert.deepEqual(Object.keys(POWER_UPS), ["turbo", "bubble", "magnet", "doubler", "freeze"]);
});

test("elementos de fase ficam maiores sem alterar o tamanho do foguete", async () => {
  const { ROCKET, MYSTERY_BOX } = await import("./gameConfig.js");
  const { OBSTACLES } = await import("../data/obstacles.js");
  const { COLLECTIBLES } = await import("../data/items.js");

  assert.deepEqual([ROCKET.width, ROCKET.height], [52, 88]);
  assert.equal(MYSTERY_BOX.size, 55);
  assert.deepEqual(COLLECTIBLES.map(({ width, height }) => [width, height]), [[38, 38]]);
  const sizes = Object.fromEntries(OBSTACLES.map(({ id, width, height }) => [id, [width, height]]));
  for (const [id, expected] of Object.entries({
    plane: [90, 85], helicopter: [64, 86], balloon: [55, 73], asteroid: [60, 60], comet: [96, 46],
  })) assert.deepEqual(sizes[id], expected, id);
});

test("dificuldade por planeta é configurável", () => {
  assert.equal(getPlanetDifficulty("earth").mathTier, 1);
  assert.ok(getPlanetDifficulty("neptune").mathTier > getPlanetDifficulty("earth").mathTier);
  assert.equal(getPlanetDifficulty("unknown").mathTier, 1);
});
