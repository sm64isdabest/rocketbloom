import assert from "node:assert/strict";
import test from "node:test";
import { AnswerLaser } from "./AnswerLaser.js";

test("laser desce lentamente e avança os quadros da animação", () => {
  const laser = new AnswerLaser({
    lane: 2,
    x: 100,
    y: 200,
    width: 70,
    height: 28,
    color: "#FFFF00",
    speed: 90,
    frames: Array.from({ length: 8 }, (_, index) => ({ index })),
  });

  laser.update(1);

  assert.equal(laser.y, 290);
  assert.equal(laser.frameIndex, 2);
  assert.equal(laser.lane, 2);
  assert.equal(laser.color, "#FFFF00");
});

test("laser renderiza o quadro atual com a cor da faixa", () => {
  const calls = [];
  const ctx = new Proxy({ filter: "none" }, {
    get(target, method) { return method in target ? target[method] : (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; return true; },
  });
  const frame = { complete: true, naturalWidth: 100, naturalHeight: 40 };
  const laser = new AnswerLaser({ lane: 1, x: 10, y: 20, width: 80, height: 32, color: "#FF00FE", frames: [frame] });

  laser.render(ctx);

  assert.equal(ctx.filter, "hue-rotate(300deg) saturate(1.35)");
  assert.ok(calls.some(({ method, args }) => method === "drawImage" && args[0] === frame));
});
