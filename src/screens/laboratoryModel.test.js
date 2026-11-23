import test from "node:test";
import assert from "node:assert/strict";
import { getLaboratoryPlantImage, getLaboratoryPlantScale, getNextPlanetIndex, shouldShowLaboratoryPlant } from "./laboratoryModel.js";

test("laboratory sprites follow each planet's seedling-to-mature artwork order", () => {
  const expectedStages = {
    earth: [1, 2, 3, 4, 5],
    mars: [6, 7, 8, 9, 10],
    neptune: [11, 12, 13, 14, 15],
    saturn: [16, 17, 18, 19, 20],
  };

  for (const [planetId, stages] of Object.entries(expectedStages)) {
    assert.deepEqual(
      stages.map((_, index) => getLaboratoryPlantImage(planetId, index)),
      stages.map((assetId) => `/assets/laboratory/plant-${String(assetId).padStart(2, "0")}.png`),
      `${planetId} should use its five new sprites in growth order`,
    );
  }
});

test("laboratory sprite stage is clamped and supports a Vite base path", () => {
  assert.equal(getLaboratoryPlantImage("earth", -3), "/assets/laboratory/plant-01.png");
  assert.equal(getLaboratoryPlantImage("earth", 99, "/rocketbloom/"), "/rocketbloom/assets/laboratory/plant-05.png");
});

test("Saturn uses individual progressively larger scales without changing the other planets", () => {
  assert.deepEqual(
    Array.from({ length: 5 }, (_, stage) => getLaboratoryPlantScale("saturn", stage)),
    [0.5, 0.6, 0.68, 0.76, 0.82],
  );
  for (const planetId of ["earth", "mars", "neptune"]) {
    assert.deepEqual(
      Array.from({ length: 5 }, (_, stage) => getLaboratoryPlantScale(planetId, stage)),
      [0.5, 0.6, 0.68, 0.76, 0.82],
    );
  }
});

test("plant is hidden until the first stage of its planet is complete", () => {
  const planet = { stages: [{ id: "mars-1" }, { id: "mars-2" }] };
  assert.equal(shouldShowLaboratoryPlant(planet, []), false);
  assert.equal(shouldShowLaboratoryPlant(planet, ["mars-2"]), false);
  assert.equal(shouldShowLaboratoryPlant(planet, ["mars-1"]), true);
});

test("laboratory planet navigation wraps at both ends", () => {
  assert.equal(getNextPlanetIndex(0, -1, 4), 3);
  assert.equal(getNextPlanetIndex(3, 1, 4), 0);
  assert.equal(getNextPlanetIndex(1, 1, 4), 2);
});
