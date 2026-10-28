import assert from "node:assert/strict";
import test from "node:test";
import { getRocketImageUrl, Rocket } from "./Rocket.js";

test("rocket image URL includes the configured application base path", () => {
  assert.equal(getRocketImageUrl("/rocketbloom/"), "/rocketbloom/assets/rocket.png");
});

test("rocket draws the supplied sprite within its enlarged hitbox", () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, method) { return (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; return true; },
  });
  const image = { complete: true, naturalWidth: 1080, naturalHeight: 1080 };
  const rocket = new Rocket({ image });
  rocket.x = 20;
  rocket.y = 30;

  rocket.render(ctx);

  const drawCall = calls.find(({ method }) => method === "drawImage");
  assert.ok(drawCall, "the loaded sprite should be rendered on the canvas");
  assert.deepEqual(drawCall.args.slice(1, 5), [292, 51, 494, 965]);
  assert.ok(Math.abs(drawCall.args[5] - 3.48) < 0.01);
  assert.equal(drawCall.args[6], -44);
  assert.ok(Math.abs(drawCall.args[7] - 45.05) < 0.01);
  assert.equal(drawCall.args[8], 88);
  assert.deepEqual([rocket.width, rocket.height], [52, 88]);
});

test("rocket tilts with horizontal movement and returns upright when it stops", () => {
  const rocket = new Rocket({ image: { complete: false } });
  rocket.place(320, 640);
  rocket.targetX += 100;

  for (let frame = 0; frame < 20; frame += 1) rocket.update(1 / 60);
  assert.ok(rocket.rotation > 0, "moving right should tilt clockwise");

  rocket.targetX = rocket.x;
  for (let frame = 0; frame < 60; frame += 1) rocket.update(1 / 60);
  assert.ok(Math.abs(rocket.rotation) < 0.001, "the rocket should return upright after stopping");

  rocket.targetX -= 100;
  for (let frame = 0; frame < 20; frame += 1) rocket.update(1 / 60);
  assert.ok(rocket.rotation < 0, "moving left should tilt counterclockwise");
});

test("rocket applies its rotation while rendering its sprite", () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, method) { return (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; return true; },
  });
  const rocket = new Rocket({ image: { complete: true, naturalWidth: 1080, naturalHeight: 1080 } });
  rocket.rotation = 0.1;

  rocket.render(ctx);

  assert.ok(calls.some(({ method, args }) => method === "rotate" && args[0] === 0.1));
});
