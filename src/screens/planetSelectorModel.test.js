import assert from "node:assert/strict";
import test from "node:test";
import { PLANETS } from "../game/data/planets.js";
import { createDefaultProgress } from "../utils/storage.js";
import { getAdjacentPlanets, getInitialExpandedPlanetId, getOrbitStage, getPlanetIdForStage, getPlanetSelectorModel, getStageClickAction } from "./planetSelectorModel.js";

test("selector shows three campaign phases and a locked endless mode on a new save", () => {
  const progress = createDefaultProgress();
  const earth = PLANETS[0];
  const model = getPlanetSelectorModel(earth, progress);

  assert.equal(PLANETS.length, 4);
  assert.deepEqual(PLANETS.map((planet) => planet.stages.length), [3, 3, 3, 3]);
  assert.equal(getInitialExpandedPlanetId(progress), "earth");
  assert.deepEqual(model.stages.map(({ status }) => status), ["available", "locked", "locked"]);
  assert.deepEqual(model.endless, { unlocked: false, highScore: 0 });
});

test("selector presents completed, partial, available, and locked phases without unlocking ahead", () => {
  const progress = createDefaultProgress();
  progress.unlockedPlanetIds = ["earth", "mars"];
  progress.completedStageIds = ["earth-1", "earth-2", "earth-3", "mars-1"];
  progress.stageProgress = { "mars-2": 0.6 };
  progress.endlessHighScores = { earth: 1450 };

  const earth = getPlanetSelectorModel(PLANETS[0], progress);
  const mars = getPlanetSelectorModel(PLANETS[1], progress);
  const saturn = getPlanetSelectorModel(PLANETS[2], progress);

  assert.equal(earth.progressLabel, "3/3 fases concluídas");
  assert.deepEqual(earth.stages.map(({ status }) => status), ["completed", "completed", "completed"]);
  assert.deepEqual(mars.stages.map(({ status }) => status), ["completed", "in-progress", "locked"]);
  assert.deepEqual(earth.endless, { unlocked: true, highScore: 1450 });
  assert.deepEqual(mars.endless, { unlocked: false, highScore: 0 });
  assert.equal(saturn.unlocked, false);
  assert.ok(saturn.stages.every(({ status }) => status === "locked"));
  assert.equal(getInitialExpandedPlanetId(progress), "mars");
});

test("when the campaign is complete, selector defaults to the last unlocked planet", () => {
  const progress = createDefaultProgress();
  progress.unlockedPlanetIds = PLANETS.map(({ id }) => id);
  progress.completedStageIds = PLANETS.flatMap(({ stages }) => stages.map(({ id }) => id));

  assert.equal(getInitialExpandedPlanetId(progress), "neptune");
  assert.ok(PLANETS.every((planet) => getPlanetSelectorModel(planet, progress).stages.every(({ status }) => status === "completed")));
});

test("selector can return to the planet containing the phase just completed", () => {
  assert.equal(getPlanetIdForStage("earth-3"), "earth");
  assert.equal(getPlanetIdForStage("unknown-stage"), null);
});

test("as setas percorrem os planetas em ciclo nos dois sentidos", () => {
  const [earth, mars, saturn, neptune] = PLANETS;
  assert.deepEqual(getAdjacentPlanets("earth"), { previousPlanet: neptune, nextPlanet: mars });
  assert.deepEqual(getAdjacentPlanets("mars"), { previousPlanet: earth, nextPlanet: saturn });
  assert.deepEqual(getAdjacentPlanets("saturn"), { previousPlanet: mars, nextPlanet: neptune });
  assert.deepEqual(getAdjacentPlanets("neptune"), { previousPlanet: saturn, nextPlanet: earth });
});

test("visitar planetas bloqueados não libera fases nem o modo infinito", () => {
  const progress = createDefaultProgress();
  for (const planet of PLANETS.slice(1)) {
    const model = getPlanetSelectorModel(planet, progress);
    assert.ok(model.stages.every(({ available, status }) => !available && status === "locked"));
    assert.equal(model.endless.unlocked, false);
    assert.equal(getOrbitStage(model.stages, planet.stages[0].id), undefined);
  }
});

test("a phase needs a first click to select and a second click to enter", () => {
  assert.equal(getStageClickAction(null, "earth-1"), "select");
  assert.equal(getStageClickAction("earth-1", "earth-1"), "enter");
  assert.equal(getStageClickAction("earth-1", "earth-2"), "select");
});

test("the orbital rocket targets the restored selected phase by its ID", () => {
  const stages = [
    { id: "saturn-1", available: true, completed: false },
    { id: "saturn-2", available: true, completed: false },
    { id: "saturn-3", available: false, completed: false },
  ];
  assert.equal(getOrbitStage(stages, "saturn-2"), stages[1]);
  assert.equal(getOrbitStage(stages, null), stages[0], "without a selection it keeps the existing active-phase fallback");
});
