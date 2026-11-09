import assert from "node:assert/strict";
import test from "node:test";
import { PLANETS } from "../game/data/planets.js";
import { createDefaultProgress } from "./storage.js";
import { addDebugCurrency, completeDebugStage, isDebugShortcut, unlockAllPlanets } from "./debugTools.js";

test("debug shortcut requires Q and P to be held together in either order", () => {
  assert.equal(isDebugShortcut(new Set(["q", "p"])), true);
  assert.equal(isDebugShortcut(new Set(["Q", "P"])), true);
  assert.equal(isDebugShortcut(new Set(["q"])), false);
  assert.equal(isDebugShortcut(new Set(["p"])), false);
});

test("debug currency grants only a supported resource and never drops below zero", () => {
  const progress = createDefaultProgress();
  assert.equal(addDebugCurrency(progress, "coins", 250).coins, 250);
  assert.equal(addDebugCurrency(progress, "diamonds", 12).diamonds, 12);
  assert.equal(addDebugCurrency(progress, "money", 40).money, 40);
  assert.throws(() => addDebugCurrency(progress, "invalid", 1), /Recurso/);
  assert.equal(addDebugCurrency({ ...progress, coins: 4 }, "coins", -10).coins, 0);
});

test("debug unlock opens every planet without marking campaign phases complete", () => {
  const unlocked = unlockAllPlanets(createDefaultProgress());
  assert.deepEqual(unlocked.unlockedPlanetIds, PLANETS.map(({ id }) => id));
  assert.deepEqual(unlocked.completedStageIds, []);
});

test("debug completion advances the campaign and unlocks the next planet at the final phase", () => {
  const progress = createDefaultProgress();
  const completed = completeDebugStage(progress, "earth", "earth-1");
  assert.ok(completed.completedStageIds.includes("earth-1"));
  assert.equal(completed.stageProgress["earth-1"], 1);
  assert.deepEqual(completed.unlockedPlanetIds, ["earth"]);

  const atFinalEarthStage = {
    ...progress,
    completedStageIds: PLANETS[0].stages.slice(0, -1).map(({ id }) => id),
  };
  assert.deepEqual(completeDebugStage(atFinalEarthStage, "earth", "earth-5").unlockedPlanetIds, ["earth", "mars"]);
  assert.deepEqual(completeDebugStage(progress, "mars", "mars-1").unlockedPlanetIds, ["earth", "mars"]);
});
