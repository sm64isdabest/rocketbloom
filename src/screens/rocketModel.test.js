import assert from "node:assert/strict";
import test from "node:test";
import { createRocketModel } from "./rocketModel.js";

test("procedural rocket has a white fuselage, red nose and fins, blue window, and animated flame", () => {
  const rocket = createRocketModel();
  const parts = new Map(rocket.children.map((child) => [child.name, child]));

  assert.ok(parts.get("fuselage").isMesh);
  assert.ok(parts.get("nose").isMesh);
  assert.ok(parts.get("window").isMesh);
  assert.ok(parts.get("left-fin").isMesh);
  assert.ok(parts.get("right-fin").isMesh);
  assert.ok(parts.get("flame").isGroup);
  assert.equal(parts.get("fuselage").material.color.getHex(), 0xf7f5ee);
  assert.equal(parts.get("nose").material.color.getHex(), 0xf32924);
  assert.equal(parts.get("window").material.color.getHex(), 0x079fe8);

  rocket.traverse((child) => child.geometry?.dispose());
  rocket.traverse((child) => child.material?.dispose());
});
