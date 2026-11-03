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
  assert.ok(calls.some(({ method, args }) => method === "rotate" && Math.abs(args[0]) >= 0.12), "the sprite should have a clearly visible sway");
  assert.deepEqual([obstacle.x, obstacle.y, obstacle.width, obstacle.height], [100, 115, 86, 46]);
});

test("obstáculo em encolhimento deixa de causar dano e some com easing", () => {
  const obstacle = new Obstacle({ id: "asteroid", x: 10, y: 20, width: 30, height: 30 });
  obstacle.startShrink(600);
  assert.equal(obstacle.isDamaging, false);
  obstacle.update(0.3);
  assert.ok(obstacle.scale < 1 && obstacle.scale > 0);
  obstacle.update(0.3);
  assert.equal(obstacle.alive, false);
});
