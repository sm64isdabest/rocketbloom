import assert from "node:assert/strict";
import test from "node:test";
import { Answer } from "./Answer.js";

test("alternativa é renderizada como um número simples sem cartão ou rótulo", () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, method) { return (...args) => calls.push({ method, args }); },
    set(target, property, value) { target[property] = value; return true; },
  });
  const answer = new Answer({ id: "q1-a1", value: 42, x: 100, y: 148, lane: 2 });

  answer.render(ctx);

  assert.deepEqual(calls.filter(({ method }) => method === "fillText").map(({ args }) => args[0]), ["42"]);
  assert.equal(calls.some(({ method }) => ["fill", "fillRect", "stroke", "strokeRect", "roundRect"].includes(method)), false);
});
