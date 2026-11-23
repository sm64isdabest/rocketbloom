import assert from "node:assert/strict";
import test from "node:test";
import { validateCatalog } from "./catalog.js";
import { PLANETS } from "./planets.js";

test("catálogo de dados está consistente", () => {
  assert.deepEqual(validateCatalog(), []);
  assert.equal(PLANETS[0].id, "earth");
  assert.deepEqual(PLANETS.map((planet) => planet.stages.length), [3, 3, 3, 3]);
  assert.equal(PLANETS.reduce((count, planet) => count + planet.stages.length, 0), 12);
  for (const planet of PLANETS) {
    assert.deepEqual(planet.stages.map((stage) => stage.id), Array.from({ length: 3 }, (_, index) => `${planet.id}-${index + 1}`));
    assert.equal(planet.endlessStage.durationMs, Infinity);
  }
});

test("dificuldade cresce ao longo da campanha e Netuno 3 usa o limite configurado", () => {
  const stages = PLANETS.flatMap((planet) => planet.stages);
  for (let index = 1; index < stages.length; index += 1) {
    assert.ok(stages[index].speedLossMultiplier > stages[index - 1].speedLossMultiplier);
    assert.ok(stages[index].obstacleIntervalMs < stages[index - 1].obstacleIntervalMs);
    assert.ok(stages[index].obstacleSpeedMultiplier > stages[index - 1].obstacleSpeedMultiplier);
    assert.ok(stages[index].maxActiveObstacles >= stages[index - 1].maxActiveObstacles);
  }
  const finalStage = PLANETS.find((planet) => planet.id === "neptune").stages.at(-1);
  assert.deepEqual({
    durationMs: finalStage.durationMs,
    speedMultiplier: finalStage.speedMultiplier,
    speedLossMultiplier: finalStage.speedLossMultiplier,
    obstaclePenaltyMultiplier: finalStage.obstaclePenaltyMultiplier,
    obstacleIntervalMs: finalStage.obstacleIntervalMs,
    obstacleMinIntervalMs: finalStage.obstacleMinIntervalMs,
    obstacleSpeedMultiplier: finalStage.obstacleSpeedMultiplier,
    maxActiveObstacles: finalStage.maxActiveObstacles,
  }, {
    durationMs: 74_000,
    speedMultiplier: 1.46,
    speedLossMultiplier: 1.18,
    obstaclePenaltyMultiplier: 0.72,
    obstacleIntervalMs: 1900,
    obstacleMinIntervalMs: 1000,
    obstacleSpeedMultiplier: 1.3,
    maxActiveObstacles: 5,
  });
});
