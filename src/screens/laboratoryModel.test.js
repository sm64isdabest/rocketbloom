import test from "node:test";
import assert from "node:assert/strict";
import { getLaboratoryPlantImage, getNextPlanetIndex, shouldShowLaboratoryPlant } from "./laboratoryModel.js";

test("laboratory sprites follow each planet's seedling-to-mature artwork order", () => {
  assert.equal(getLaboratoryPlantImage("earth", 0), "/assets/laboratory/plant-09.webp");
  assert.equal(getLaboratoryPlantImage("earth", 1), "/assets/laboratory/plant-10.webp");
  assert.equal(getLaboratoryPlantImage("earth", 4), "/assets/laboratory/plant-01.webp");
  assert.equal(getLaboratoryPlantImage("mars", 2), "/assets/laboratory/plant-18.webp");
  assert.equal(getLaboratoryPlantImage("saturn", 0), "/assets/laboratory/plant-06.webp");
  assert.equal(getLaboratoryPlantImage("neptune", 3), "/assets/laboratory/plant-20.webp");
});

test("laboratory sprite stage is clamped and supports a Vite base path", () => {
  assert.equal(getLaboratoryPlantImage("earth", -3), "/assets/laboratory/plant-09.webp");
  assert.equal(getLaboratoryPlantImage("earth", 99, "/rocketbloom/"), "/rocketbloom/assets/laboratory/plant-01.webp");
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
