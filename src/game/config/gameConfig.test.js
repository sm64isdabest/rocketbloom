import assert from "node:assert/strict";
import test from "node:test";
import { SPEED, REWARDS, getPlanetDifficulty } from "./gameConfig.js";

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
  assert.equal(REWARDS.diamondValue, 1);
  assert.ok(REWARDS.plantMoney > 0);
});

test("elementos de fase ficam maiores sem alterar o tamanho do foguete", async () => {
  const { ROCKET, MYSTERY_BOX } = await import("./gameConfig.js");
  const { OBSTACLES } = await import("../data/obstacles.js");
  const { COLLECTIBLES } = await import("../data/items.js");

  assert.deepEqual([ROCKET.width, ROCKET.height], [52, 88]);
  assert.equal(MYSTERY_BOX.size, 55);
  assert.deepEqual(COLLECTIBLES.map(({ width, height }) => [width, height]), [[38, 38], [43, 50]]);
  assert.deepEqual(OBSTACLES.map(({ width, height }) => [width, height]), [
    [119, 64], [88, 63], [55, 73], [60, 60], [96, 46], [44, 55],
  ]);
});

test("dificuldade por planeta é configurável", () => {
  assert.equal(getPlanetDifficulty("earth").mathTier, 1);
  assert.ok(getPlanetDifficulty("neptune").mathTier > getPlanetDifficulty("earth").mathTier);
  assert.equal(getPlanetDifficulty("unknown").mathTier, 1);
});
