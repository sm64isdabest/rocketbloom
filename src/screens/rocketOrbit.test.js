import assert from "node:assert/strict";
import test from "node:test";
import { ORBIT_PERIOD_SECONDS, getRocketOrbitPose, setOrbitTargetElement, smoothTarget } from "./rocketOrbit.js";

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
  for (const elapsedSeconds of [0, 0.75, 1.5, 2.25, 3.75, 5.25]) {
    const pose = getRocketOrbitPose(elapsedSeconds, target, { radiusX: 50, radiusY: 30 });
    const angle = (elapsedSeconds / ORBIT_PERIOD_SECONDS) * Math.PI * 2;
    const tangentX = -50 * Math.sin(angle);
    const tangentY = -30 * Math.cos(angle);
    const tangentZ = 23 * Math.cos(angle);
    const tangentLength = Math.hypot(tangentX, tangentY, tangentZ);
    const { x, y, z, w } = pose.quaternion;
    const noseX = 2 * (x * y - z * w);
    const noseY = 1 - 2 * (x * x + z * z);
    const noseZ = 2 * (y * z + x * w);

    assert.ok(noseX * tangentX / tangentLength + noseY * tangentY / tangentLength + noseZ * tangentZ / tangentLength > 0.999999);
  }
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
  assert.deepEqual(frozen.quaternion, { x: 0, y: 0, z: 0, w: 1 });
  assert.equal(frozen.scale, 1);
});

test("selecting a replayable phase makes its button the next orbital target", () => {
  const activeButton = { id: "earth-2", isConnected: true };
  const clickedButton = { id: "earth-1", isConnected: true };
  const targetRef = { current: activeButton };

  assert.equal(setOrbitTargetElement(targetRef, clickedButton), true);
  assert.equal(targetRef.current, clickedButton);
  assert.equal(setOrbitTargetElement(targetRef, null), false);
  assert.equal(targetRef.current, clickedButton);
});
