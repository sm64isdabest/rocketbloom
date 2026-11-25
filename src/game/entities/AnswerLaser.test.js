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

test("laser atingido desaparece gradualmente durante o fade-out", () => {
  const calls = [];
  const state = { globalAlpha: 1 };
  const stack = [];
  const ctx = new Proxy(state, {
    get(target, method) {
      if (method === "save") return () => stack.push(target.globalAlpha);
      if (method === "restore") return () => { target.globalAlpha = stack.pop(); };
      return method in target ? target[method] : (...args) => calls.push({ method, args });
    },
    set(target, property, value) { target[property] = value; return true; },
  });
  const frame = { complete: true, naturalWidth: 100, naturalHeight: 40 };
  const laser = new AnswerLaser({ lane: 0, x: 0, y: 0, width: 80, color: "#00FFFF", frames: [frame] });

  laser.beginFadeOut();
  laser.update(0.1);
  laser.render(ctx);

  assert.equal(laser.alive, true);
  assert.ok(laser.opacity > 0 && laser.opacity < 1);
  assert.equal(ctx.globalAlpha, 1, "rendering restores the canvas alpha");
  assert.ok(calls.some(({ method }) => method === "drawImage"));

  laser.update(0.2);
  assert.equal(laser.alive, false);
});

test("laser renderiza o quadro sem filtros ou sombras em tempo real", () => {
  const calls = [];
  const ctx = new Proxy({ filter: "none", shadowBlur: 0 }, {
    get(target, method) { return method in target ? target[method] : (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; return true; },
  });
  const frame = { complete: true, naturalWidth: 100, naturalHeight: 40 };
  const laser = new AnswerLaser({ lane: 1, x: 10, y: 20, width: 80, height: 32, color: "#FF00FE", frames: [frame] });

  laser.render(ctx);

  assert.equal(ctx.filter, "none");
  assert.equal(ctx.shadowBlur, 0);
  assert.ok(calls.some(({ method, args }) => method === "drawImage" && args[0] === frame));
});

test("laser segura a posição entre saltos e desenha um rastro breve ao avançar", () => {
  const traces = [];
  const ctx = { globalAlpha: 1, save() {}, restore() {}, drawImage() {}, fillRect: (...args) => traces.push(args) };
  const frame = { complete: true, naturalWidth: 100, naturalHeight: 40 };
  const laser = new AnswerLaser({ x: 0, y: 20, width: 80, speed: 100, frames: [frame] });
  laser.update(0.05);
  assert.equal(laser.y, 20);
  laser.update(0.05);
  assert.equal(laser.y, 30);
  laser.render(ctx);
  assert.ok(traces.length > 0);
  traces.length = 0;
  laser.update(0.08);
  laser.render(ctx);
  assert.equal(laser.y, 30);
  assert.equal(traces.length, 0);
});

test("laser mantém a proporção original do sprite ao renderizar", () => {
  let dimensions;
  const frame = { complete: true, naturalWidth: 320, naturalHeight: 80 };
  const ctx = new Proxy({}, { get: (_target, method) => (...args) => { if (method === "drawImage") dimensions = args.slice(-2); } });
  new AnswerLaser({ lane: 0, x: 0, y: 0, width: 70, height: 28, color: "#00FFFF", frames: [frame] }).render(ctx);
  assert.deepEqual(dimensions, [70, 17.5]);
});
