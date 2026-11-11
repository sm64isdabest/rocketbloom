import test from "node:test";
import assert from "node:assert/strict";
import { getLaboratoryPlantImage, getNextPlanetIndex } from "./laboratoryModel.js";

test("laboratory sprites follow each planet's seedling-to-mature artwork order", () => {
  assert.equal(getLaboratoryPlantImage("earth", 0), "/assets/laboratory/plant-10.png");
  assert.equal(getLaboratoryPlantImage("earth", 3), "/assets/laboratory/plant-01.png");
  assert.equal(getLaboratoryPlantImage("mars", 1), "/assets/laboratory/plant-18.png");
  assert.equal(getLaboratoryPlantImage("saturn", 3), "/assets/laboratory/plant-05.png");
  assert.equal(getLaboratoryPlantImage("neptune", 2), "/assets/laboratory/plant-20.png");
});

test("laboratory sprite stage is clamped and supports a Vite base path", () => {
  assert.equal(getLaboratoryPlantImage("earth", -3), "/assets/laboratory/plant-10.png");
  assert.equal(getLaboratoryPlantImage("earth", 99, "/rocketbloom/"), "/rocketbloom/assets/laboratory/plant-01.png");
});

test("laboratory planet navigation wraps at both ends", () => {
  assert.equal(getNextPlanetIndex(0, -1, 4), 3);
  assert.equal(getNextPlanetIndex(3, 1, 4), 0);
  assert.equal(getNextPlanetIndex(1, 1, 4), 2);
});
