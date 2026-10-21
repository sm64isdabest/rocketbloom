import assert from "node:assert/strict";
import test from "node:test";
import { getLaneBounds, getLaneFromCenter, LANE_COLORS, renderLaneColumns } from "./lanes.js";

function createRecordingContext() {
  const calls = [];
  const ctx = new Proxy({}, {
    get(target, method) {
      if (method in target) return target[method];
      return (...args) => calls.push({ method, args, strokeStyle: ctx.strokeStyle, fillStyle: ctx.fillStyle,
        globalAlpha: ctx.globalAlpha, lineWidth: ctx.lineWidth });
    },
    set(target, property, value) { target[property] = value; return true; },
  });
  return { ctx, calls };
}

test("colunas usam as quatro cores hexadecimais especificadas", () => {
  assert.deepEqual(LANE_COLORS, ["#00FFFF", "#FF00FE", "#FFFF00", "#000000"]);
});

test("seleção usa o centro do foguete e os limites reais de cada coluna", () => {
  assert.deepEqual([0, 1, 2, 3].map((lane) => getLaneFromCenter((lane + 0.5) * 80, 320)), [0, 1, 2, 3]);
  assert.deepEqual([80, 160, 240].map((edge) => getLaneFromCenter(edge, 320)), [1, 2, 3]);
  assert.deepEqual(getLaneBounds(320, 2), { left: 160, right: 240, width: 80 });
  assert.equal(getLaneFromCenter(0, 0), 0);
});

test("colunas ficam ocultas fora do período de resposta", () => {
  const { ctx, calls } = createRecordingContext();
  renderLaneColumns(ctx, 320, 640);
  assert.deepEqual(calls, []);
});

test("respostas ativas usam apenas bordas coloridas sem preenchimento ou rótulos", () => {
  const { ctx, calls } = createRecordingContext();
  renderLaneColumns(ctx, 320, 640, { visible: true });
  assert.equal(calls.filter(({ method }) => method === "fillRect").length, 0);
  assert.equal(calls.filter(({ method }) => method === "fillText").length, 0);
  const borders = calls.filter(({ method }) => method === "strokeRect");
  assert.deepEqual(borders.map(({ strokeStyle }) => strokeStyle), LANE_COLORS);
  assert.ok(borders.every(({ globalAlpha, lineWidth }) => globalAlpha === 0.25 && lineWidth === 1.25));
});

test("feedback de coluna desenha somente uma borda sem preencher sua área", () => {
  const { ctx, calls } = createRecordingContext();
  renderLaneColumns(ctx, 320, 640, { flashLane: 2, flashColor: "#00FF00", flashAlpha: 0.4 });
  assert.equal(calls.filter(({ method }) => method === "fillRect").length, 0);
  const borders = calls.filter(({ method }) => method === "strokeRect");
  assert.deepEqual(borders.map(({ strokeStyle }) => strokeStyle), ["#00FF00"]);
  assert.equal(borders[0].globalAlpha, 0.4);
  assert.equal(borders[0].lineWidth, 2);
});
