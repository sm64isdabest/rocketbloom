import assert from "node:assert/strict";
import test from "node:test";
import { collectCoins } from "./coinManager.js";

test("a coleta soma moedas inteiras e ignora quantidades inválidas", () => {
  assert.equal(collectCoins(0), 1);
  assert.equal(collectCoins(1, 25), 26);
  for (const amount of [-1, 0.5, "2", Infinity, NaN]) {
    assert.equal(collectCoins(5, amount), 5);
  }
});
