import assert from "node:assert/strict";
import test from "node:test";
import { ORBIT_PERIOD_SECONDS, getRocketOrbitPose, smoothTarget } from "./rocketOrbit.js";

test("rocket completes an elliptical orbit in six seconds with front and back depth", () => {
  assert.equal(ORBIT_PERIOD_SECONDS, 6);
  const target = { x: 120, y: 80 };
  const front = getRocketOrbitPose(1.5, target, { radiusX: 48, radiusY: 30 });
  const back = getRocketOrbitPose(4.5, target, { radiusX: 48, radiusY: 30 });

  assert.ok(Math.abs(front.x - target.x) < 1e-8);
  assert.ok(front.y > target.y);
  assert.ok(front.depth > 0);
  assert.ok(back.y < target.y);
  assert.ok(back.depth < 0);
  assert.ok(front.scale > back.scale);
});

test("rocket orientation follows the orbit tangent rather than spinning in place", () => {
  const target = { x: 0, y: 0 };
  const eastbound = getRocketOrbitPose(0, target, { radiusX: 50, radiusY: 30 });
  const northbound = getRocketOrbitPose(1.5, target, { radiusX: 50, radiusY: 30 });

  assert.notEqual(eastbound.rotationZ, northbound.rotationZ);
  assert.ok(Math.abs(eastbound.rotationZ) < 1e-8);
});

test("target changes ease smoothly and reduced motion can freeze the orbit", () => {
  const current = { x: 0, y: 0 };
  const destination = { x: 100, y: 40 };
  const halfway = smoothTarget(current, destination, 0.1, 4);
  const frozen = getRocketOrbitPose(3, destination, { radiusX: 50, radiusY: 30, reducedMotion: true });

  assert.ok(halfway.x > 0 && halfway.x < destination.x);
  assert.ok(halfway.y > 0 && halfway.y < destination.y);
  assert.equal(frozen.x, destination.x + 50);
  assert.equal(frozen.y, destination.y);
  assert.equal(frozen.rotationZ, 0);
  assert.equal(frozen.scale, 1);
});
