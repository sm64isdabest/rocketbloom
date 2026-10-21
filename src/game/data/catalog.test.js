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
