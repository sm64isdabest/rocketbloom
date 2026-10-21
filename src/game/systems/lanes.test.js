import assert from "node:assert/strict";
import test from "node:test";
import { getLaneBounds, getLaneFromCenter, LANE_COLORS } from "./lanes.js";

test("colunas usam as quatro cores hexadecimais especificadas", () => {
  assert.deepEqual(LANE_COLORS, ["#00FFFF", "#FF00FE", "#FFFF00", "#000000"]);
});

test("seleção usa o centro do foguete e os limites reais de cada coluna", () => {
  assert.deepEqual([0, 1, 2, 3].map((lane) => getLaneFromCenter((lane + 0.5) * 80, 320)), [0, 1, 2, 3]);
  assert.deepEqual([80, 160, 240].map((edge) => getLaneFromCenter(edge, 320)), [1, 2, 3]);
  assert.deepEqual(getLaneBounds(320, 2), { left: 160, right: 240, width: 80 });
  assert.equal(getLaneFromCenter(0, 0), 0);
});
