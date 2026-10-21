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

test("dificuldade por planeta é configurável", () => {
  assert.equal(getPlanetDifficulty("earth").mathTier, 1);
  assert.ok(getPlanetDifficulty("neptune").mathTier > getPlanetDifficulty("earth").mathTier);
  assert.equal(getPlanetDifficulty("unknown").mathTier, 1);
});
