import assert from "node:assert/strict";
import test from "node:test";
import { getRocketImageUrl, Rocket } from "./Rocket.js";

test("rocket image URL includes the configured application base path", () => {
  assert.equal(getRocketImageUrl("/rocketbloom/"), "/rocketbloom/assets/rocket.png");
});

test("rocket draws the supplied sprite within its existing hitbox", () => {
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
  assert.ok(Math.abs(drawCall.args[5] - 22.57) < 0.01);
  assert.equal(drawCall.args[6], 30);
  assert.ok(Math.abs(drawCall.args[7] - 36.85) < 0.01);
  assert.equal(drawCall.args[8], 72);
  assert.deepEqual([rocket.width, rocket.height], [42, 72]);
});
