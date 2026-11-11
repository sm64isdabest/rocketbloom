import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { getFlameImageUrl, getRocketImageUrl, Rocket } from "./Rocket.js";

test("rocket image URL includes the configured application base path", () => {
  assert.equal(getRocketImageUrl("/rocketbloom/"), "/rocketbloom/assets/rocket.webp");
});

test("the eight flame assets exist and their URLs include the configured base path", () => {
  for (let frame = 0; frame < 8; frame += 1) {
    const filename = `chama_${String(frame + 1).padStart(2, "0")}.webp`;
    assert.equal(getFlameImageUrl(frame, "/rocketbloom"), `/rocketbloom/assets/flames/${filename}`);
    assert.equal(existsSync(new URL(`../../../public/assets/flames/${filename}`, import.meta.url)), true, `${filename} should be publicly available`);
  }
});

test("rocket sprite is shifted left to align with its hitbox", () => {
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
  assert.deepEqual(drawCall.args.slice(1, 5), [292, 51, 494, 740]);
  assert.ok(Math.abs(drawCall.args[5] + 22.52) < 0.01);
  assert.equal(drawCall.args[6], -44);
  assert.ok(Math.abs(drawCall.args[7] - 45.05) < 0.01);
  assert.ok(Math.abs(drawCall.args[8] - (88 * 740 / 965)) < 0.01);
  assert.deepEqual([rocket.width, rocket.height], [52, 88]);
});

test("rocket renders animated flame assets beneath the trimmed body using its tilt", () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, method) { return (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; return true; },
  });
  const image = { complete: true, naturalWidth: 1080, naturalHeight: 1080 };
  const flameImages = Array.from({ length: 8 }, (_, index) => ({ id: index, complete: true, naturalWidth: 194, naturalHeight: 491 }));
  const rocket = new Rocket({ image, flameImages });
  rocket.x = 20;
  rocket.y = 30;
  rocket.rotation = -0.12;

  rocket.render(ctx, 0);

  const drawCalls = calls.filter(({ method }) => method === "drawImage");
  assert.equal(drawCalls.length, 2, "one flame frame and the rocket body should render");
  assert.equal(drawCalls[0].args[0], flameImages[0], "the first animation frame should be drawn behind the rocket");
  assert.deepEqual(drawCalls[1].args.slice(1, 5), [292, 51, 494, 740], "the rocket sprite crop should exclude its built-in exhaust");
  assert.ok(calls.some(({ method, args }) => method === "rotate" && args[0] === -0.12), "the flame and body should share the rocket tilt transform");
  assert.equal(calls.filter(({ method }) => method === "translate").length, 1, "the flame and body should share the rocket position transform");
});

test("rocket flame animation advances through all eight frames and freezes for reduced motion", () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, method) { return (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; return true; },
  });
  const flameImages = Array.from({ length: 8 }, (_, index) => ({ id: index, complete: true, naturalWidth: 194, naturalHeight: 491 }));
  const rocket = new Rocket({ image: { complete: false }, flameImages });

  for (let frame = 0; frame < 8; frame += 1) {
    calls.length = 0;
    rocket.render(ctx, frame * 80);
    assert.equal(calls.find(({ method }) => method === "drawImage")?.args[0], flameImages[frame]);
  }

  calls.length = 0;
  rocket.render(ctx, 560, true);
  assert.equal(calls.find(({ method }) => method === "drawImage")?.args[0], flameImages[0]);
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

test("rocket damage feedback fades out and clamps at zero", () => {
  const rocket = new Rocket({ image: { complete: false } });

  rocket.triggerDamageFeedback(900);
  assert.equal(rocket.damageFeedbackRemainingMs, 900);

  rocket.updateDamageFeedback(0.3);
  assert.equal(rocket.damageFeedbackRemainingMs, 600);

  rocket.updateDamageFeedback(1);
  assert.equal(rocket.damageFeedbackRemainingMs, 0);
});

test("active damage tints and shakes the rendered sprite without moving gameplay position", () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, method) { return (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; calls.push({ method: "set", property, value }); return true; },
  });
  const rocket = new Rocket({ image: { complete: true, naturalWidth: 1080, naturalHeight: 1080 } });
  rocket.x = 20;
  rocket.y = 30;
  rocket.triggerDamageFeedback(900);

  rocket.render(ctx, 20);

  assert.equal(rocket.x, 20);
  assert.equal(rocket.y, 30);
  assert.equal(calls.filter(({ method }) => method === "drawImage").length, 2);
  assert.ok(calls.some(({ property, value }) => property === "filter" && value.includes("hue-rotate(358deg)")));
  const [renderX, renderY] = calls.find(({ method }) => method === "translate").args;
  assert.ok(Math.hypot(renderX - 46, renderY - 74) >= 5, "render transform should visibly shake the rocket");
});

test("reduced motion retains the red damage tint without shaking", () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, method) { return (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; calls.push({ method: "set", property, value }); return true; },
  });
  const rocket = new Rocket({ image: { complete: true, naturalWidth: 1080, naturalHeight: 1080 } });
  rocket.x = 20;
  rocket.y = 30;
  rocket.triggerDamageFeedback(900);

  rocket.render(ctx, 20, true);

  assert.equal(calls.filter(({ method }) => method === "drawImage").length, 2);
  assert.ok(calls.some(({ property, value }) => property === "filter" && value.includes("hue-rotate(358deg)")));
  assert.ok(calls.some(({ property, value }) => property === "globalAlpha" && value > 0));
  assert.deepEqual(calls.find(({ method }) => method === "translate").args, [46, 74]);
});
