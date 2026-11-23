import assert from "node:assert/strict";
import test from "node:test";
import { createDepositTimeline, getDepositFrame } from "./storageAnimation.js";

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
