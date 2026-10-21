import assert from "node:assert/strict";
import test from "node:test";
import { validateCatalog } from "./catalog.js";
import { PLANETS } from "./planets.js";

test("catálogo de dados está consistente", () => {
  assert.deepEqual(validateCatalog(), []);
  assert.equal(PLANETS[0].id, "earth");
});
