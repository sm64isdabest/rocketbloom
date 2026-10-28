import assert from "node:assert/strict";
import test from "node:test";
import { Obstacle } from "./Obstacle.js";

test("obstacle animation changes its drawing while preserving its collision box", () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, method) { return (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; return true; },
  });
  const obstacle = new Obstacle({
    id: "plane", x: 100, y: 50, width: 86, height: 46,
    hitbox: { x: 0.1, y: 0.18, width: 0.8, height: 0.64 },
  });
  obstacle.image = { complete: true, naturalWidth: 86 };
  const collisionBox = obstacle.collisionBox;

  obstacle.update(0.5);
  obstacle.render(ctx);

  assert.deepEqual(obstacle.collisionBox, { ...collisionBox, y: collisionBox.y + obstacle.speed * 0.5 });
  assert.ok(calls.some(({ method, args }) => method === "rotate" && args[0] !== 0), "the sprite should sway during rendering");
  assert.deepEqual([obstacle.x, obstacle.y, obstacle.width, obstacle.height], [100, 115, 86, 46]);
});
