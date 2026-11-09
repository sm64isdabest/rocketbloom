import assert from "node:assert/strict";
import test from "node:test";
import { clampFloatingPosition, readFloatingPosition } from "./floatingControlModel.js";

test("botão preserva sua posição dentro da janela, inclusive após redimensionamento", () => {
  assert.deepEqual(
    clampFloatingPosition({ x: 1200, y: 850 }, { width: 800, height: 600 }, { width: 56, height: 56 }),
    { x: 744, y: 544 },
  );
});

test("posição ausente ou inválida usa posição inicial segura", () => {
  assert.deepEqual(readFloatingPosition(null), null);
  assert.deepEqual(readFloatingPosition("{bad json"), null);
  assert.deepEqual(readFloatingPosition('{"x":12,"y":34}'), { x: 12, y: 34 });
  assert.deepEqual(readFloatingPosition('{"x":-1,"y":34}'), null);
});
