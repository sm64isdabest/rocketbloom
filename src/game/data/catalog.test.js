import assert from "node:assert/strict";
import test from "node:test";
import { validateCatalog } from "./catalog.js";
import { PLANETS } from "./planets.js";

test("catálogo de dados está consistente", () => {
  assert.deepEqual(validateCatalog(), []);
  assert.equal(PLANETS[0].id, "earth");
  assert.deepEqual(PLANETS.map((planet) => planet.stages.length), [5, 5, 5, 5]);
  assert.equal(PLANETS.reduce((count, planet) => count + planet.stages.length, 0), 20);
  for (const planet of PLANETS) {
    assert.deepEqual(planet.stages.map((stage) => stage.id), Array.from({ length: 5 }, (_, index) => `${planet.id}-${index + 1}`));
  }
});

test("dificuldade cresce ao longo da campanha e Netuno 5 usa o limite configurado", () => {
  const stages = PLANETS.flatMap((planet) => planet.stages);
  for (let index = 1; index < stages.length; index += 1) {
    assert.ok(stages[index].speedLossMultiplier > stages[index - 1].speedLossMultiplier);
    assert.ok(stages[index].obstacleIntervalMs < stages[index - 1].obstacleIntervalMs);
    assert.ok(stages[index].obstacleSpeedMultiplier > stages[index - 1].obstacleSpeedMultiplier);
    assert.ok(stages[index].maxActiveObstacles >= stages[index - 1].maxActiveObstacles);
  }
  const neptune5 = PLANETS.find((planet) => planet.id === "neptune").stages[4];
  assert.deepEqual({
    durationMs: neptune5.durationMs,
    speedMultiplier: neptune5.speedMultiplier,
    speedLossMultiplier: neptune5.speedLossMultiplier,
    obstaclePenaltyMultiplier: neptune5.obstaclePenaltyMultiplier,
    obstacleIntervalMs: neptune5.obstacleIntervalMs,
    obstacleMinIntervalMs: neptune5.obstacleMinIntervalMs,
    obstacleSpeedMultiplier: neptune5.obstacleSpeedMultiplier,
    maxActiveObstacles: neptune5.maxActiveObstacles,
  }, {
    durationMs: 90_000,
    speedMultiplier: 1.46,
    speedLossMultiplier: 1.18,
    obstaclePenaltyMultiplier: 0.72,
    obstacleIntervalMs: 2750,
    obstacleMinIntervalMs: 1550,
    obstacleSpeedMultiplier: 1.3,
    maxActiveObstacles: 4,
  });
});
