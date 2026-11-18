import assert from "node:assert/strict";
import test from "node:test";
import { createCollisionImpactState, getCollisionImpactSpeedFactor, tickCollisionImpact, triggerCollisionImpact } from "./collisionImpact.js";

function assertSpeedFactor(impact, expected) {
  assert.ok(Math.abs(getCollisionImpactSpeedFactor(impact) - expected) < 1e-9);
}

test("impacto reduz a velocidade por dois segundos e a recupera gradualmente", () => {
  let impact = createCollisionImpactState();
  assert.equal(getCollisionImpactSpeedFactor(impact), 1);
  impact = triggerCollisionImpact(0.64);
  impact = tickCollisionImpact(impact, 1900, true);
  assert.equal(getCollisionImpactSpeedFactor(impact), 0.64);
  impact = tickCollisionImpact(impact, 100, true);
  assert.equal(getCollisionImpactSpeedFactor(impact), 0.64);
  impact = tickCollisionImpact(impact, 600, true);
  assertSpeedFactor(impact, 0.82);
  impact = tickCollisionImpact(impact, 700, true);
  assert.equal(getCollisionImpactSpeedFactor(impact), 1);
});

test("impacto repetido reinicia a duração sem acumular reduções", () => {
  let impact = tickCollisionImpact(triggerCollisionImpact(0.64), 2600, true);
  assertSpeedFactor(impact, 0.82);

  impact = triggerCollisionImpact(0.64);
  assert.equal(getCollisionImpactSpeedFactor(impact), 0.64);
  impact = tickCollisionImpact(impact, 2000, true);
  assert.equal(getCollisionImpactSpeedFactor(impact), 0.64);
});

test("pausa congela a duração e a recuperação do impacto", () => {
  let impact = tickCollisionImpact(triggerCollisionImpact(0.64), 2000, true);
  impact = tickCollisionImpact(impact, 600, false);
  assert.equal(getCollisionImpactSpeedFactor(impact), 0.64);
  impact = tickCollisionImpact(impact, 600, true);
  assertSpeedFactor(impact, 0.82);
});

test("a redução nunca zera o movimento mesmo quando a penalidade excede a velocidade", () => {
  assert.equal(getCollisionImpactSpeedFactor(triggerCollisionImpact(-1)), 0.32);
});
