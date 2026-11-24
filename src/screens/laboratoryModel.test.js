import test from "node:test";
import assert from "node:assert/strict";
import { getPlantForPlanet } from "../game/data/plants.js";
import { getLaboratoryPlantImage, getLaboratoryPlantScale, getNextPlanetIndex, shouldShowLaboratoryPlant } from "./laboratoryModel.js";

test("laboratory sprites follow each planet's seedling-to-mature artwork order", () => {
  const expectedStages = {
    earth: [2, 3, 5],
    mars: [7, 8, 10],
    neptune: [12, 13, 15],
    saturn: [17, 18, 20],
  };

  for (const [planetId, stages] of Object.entries(expectedStages)) {
    assert.deepEqual(
      stages.map((_, index) => getLaboratoryPlantImage(planetId, index)),
      stages.map((assetId) => `/assets/laboratory/plant-${String(assetId).padStart(2, "0")}.webp`),
      `${planetId} should use three sprites in growth order`,
    );
  }
});

test("Saturn keeps its current three growth stages and the final ringed plant asset", () => {
  assert.deepEqual(getPlantForPlanet("saturn").growthArt, [17, 18, 20]);
});

test("laboratory sprite stage is clamped and supports a Vite base path", () => {
  assert.equal(getLaboratoryPlantImage("earth", -3), "/assets/laboratory/plant-02.webp");
  assert.equal(getLaboratoryPlantImage("earth", 99, "/rocketbloom/"), "/rocketbloom/assets/laboratory/plant-05.webp");
});

test("as três artes ganham escala à medida que a planta cresce", () => {
  assert.deepEqual([0, 1, 2].map(getLaboratoryPlantScale), [0.6, 0.68, 0.82]);
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
