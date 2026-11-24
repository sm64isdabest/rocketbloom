import assert from "node:assert/strict";
import test from "node:test";
import { createDepositTimeline, drawDepositFrame, getDepositFrame } from "./storageAnimation.js";

test("a moeda gigante nasce no centro e encolhe ao chegar à barra", () => {
  const timeline = createDepositTimeline(0, 1);
  const { start, arrival } = timeline.flights[0];
  const positions = [];
  const sizes = [];
  const ctx = {
    save() {}, restore() {}, scale() {},
    translate(x, y) { positions.push([x, y]); },
    drawImage(_image, _x, _y, width) { sizes.push(width); },
  };
  const view = { width: 360, height: 640 };
  const bar = { x: 180, y: 520 };
  const coin = { naturalWidth: 64 };
  drawDepositFrame(ctx, timeline, start, view, bar, coin);
  drawDepositFrame(ctx, timeline, arrival - 1, view, bar, coin);
  assert.deepEqual(positions[0], [180, 320]);
  assert.ok(sizes[0] >= 100);
  assert.ok(Math.abs(positions[1][1] - 520) < 1);
  assert.ok(sizes[1] < 40);
});

test("a contagem começa quando a primeira moeda chega e termina no saldo exato", () => {
  const timeline = createDepositTimeline(9, 12);
  const first = timeline.flights[0];

  assert.equal(getDepositFrame(timeline, first.arrival - 1).total, 9);
  assert.equal(getDepositFrame(timeline, first.arrival).arrived, 1);
  assert.equal(getDepositFrame(timeline, first.arrival + 100).total, 10);
  assert.equal(getDepositFrame(timeline, timeline.duration).total, 12);
  assert.equal(timeline.flights.length, 3);
});

test("depósitos grandes são agrupados e completam em menos de quatro segundos", () => {
  const timeline = createDepositTimeline(17, 10_018);
  assert.ok(timeline.flights.length <= 18);
  assert.ok(timeline.duration <= 4000);
  assert.equal(timeline.flights.reduce((sum, flight) => sum + flight.amount, 0), 10_001);
  assert.equal(getDepositFrame(timeline, timeline.duration).total, 10_018);
  assert.equal(createDepositTimeline(10, 10).duration, 0);
});
