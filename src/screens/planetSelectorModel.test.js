import assert from "node:assert/strict";
import test from "node:test";
import { PLANETS } from "../game/data/planets.js";
import { createDefaultProgress } from "../utils/storage.js";
import { getInitialExpandedPlanetId, getPlanetSelectorModel } from "./planetSelectorModel.js";

test("selector keeps five phase states per planet and respects the saved unlock order", () => {
  const progress = createDefaultProgress();
  const earth = PLANETS[0];
  const model = getPlanetSelectorModel(earth, progress);

  assert.equal(PLANETS.length, 4);
  assert.deepEqual(PLANETS.map((planet) => planet.stages.length), [5, 5, 5, 5]);
  assert.equal(getInitialExpandedPlanetId(progress), "earth");
  assert.deepEqual(model.stages.map(({ status }) => status), ["available", "locked", "locked", "locked", "locked"]);
});

test("selector presents completed, partial, available, and locked phases without unlocking ahead", () => {
  const progress = createDefaultProgress();
  progress.unlockedPlanetIds = ["earth", "mars"];
  progress.completedStageIds = ["earth-1", "earth-2", "earth-3", "mars-1"];
  progress.stageProgress = { "earth-4": 0.35, "mars-2": 0.6 };

  const earth = getPlanetSelectorModel(PLANETS[0], progress);
  const mars = getPlanetSelectorModel(PLANETS[1], progress);
  const saturn = getPlanetSelectorModel(PLANETS[2], progress);

  assert.equal(earth.progressLabel, "3/5 fases concluídas");
  assert.deepEqual(earth.stages.map(({ status }) => status), ["completed", "completed", "completed", "in-progress", "locked"]);
  assert.deepEqual(mars.stages.map(({ status }) => status), ["completed", "in-progress", "locked", "locked", "locked"]);
  assert.equal(saturn.unlocked, false);
  assert.ok(saturn.stages.every(({ status }) => status === "locked"));
  assert.equal(getInitialExpandedPlanetId(progress), "earth");
  progress.completedStageIds = ["earth-1", "earth-2", "earth-3", "earth-4", "earth-5", "mars-1"];
  assert.equal(getInitialExpandedPlanetId(progress), "mars");
});

test("when the campaign is complete, selector defaults to the last unlocked planet", () => {
  const progress = createDefaultProgress();
  progress.unlockedPlanetIds = PLANETS.map(({ id }) => id);
  progress.completedStageIds = PLANETS.flatMap(({ stages }) => stages.map(({ id }) => id));

  assert.equal(getInitialExpandedPlanetId(progress), "neptune");
  assert.ok(PLANETS.every((planet) => getPlanetSelectorModel(planet, progress).stages.every(({ status }) => status === "completed")));
});
