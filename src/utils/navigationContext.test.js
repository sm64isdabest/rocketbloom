import assert from "node:assert/strict";
import test from "node:test";
import { initialNavigationContext, navigationContextReducer } from "./navigationContext.js";

const runCases = [
  ["earth", "earth-2"],
  ["mars", "mars-3"],
  ["saturn", "saturn-2"],
  ["neptune", "neptune-3"],
];

const laboratoryCases = [
  ["earth", "earth-3"],
  ["mars", "mars-2"],
  ["saturn", "saturn-3"],
  ["neptune", "neptune-2"],
];

test("sair de uma partida restaura planeta e nível selecionado de origem", () => {
  for (const [planetId, stageId] of runCases) {
    let context = {
      ...initialNavigationContext,
      selector: { planetId: "saturn", selectedStageId: "saturn-4" },
    };
    context = navigationContextReducer(context, { type: "start-run", planetId, stageId });
    context = navigationContextReducer(context, { type: "exit-run" });
    assert.deepEqual(context.selector, { planetId, selectedStageId: stageId });
    assert.equal(context.runOrigin, null, "a origem da partida encerrada é limpa");
  }
});

test("sair do laboratório restaura planeta e nível selecionado de origem", () => {
  for (const [planetId, selectedStageId] of laboratoryCases) {
    let context = {
      ...initialNavigationContext,
      selector: { planetId: "saturn", selectedStageId: "saturn-4" },
    };
    context = navigationContextReducer(context, { type: "open-laboratory", planetId, selectedStageId });
    context = navigationContextReducer(context, { type: "exit-laboratory" });
    assert.deepEqual(context.selector, { planetId, selectedStageId });
    assert.equal(context.laboratoryOrigin, null, "a origem desse acesso ao laboratório é limpa");
  }
});

test("origens da partida e do laboratório preservam seleções independentes", () => {
  let context = navigationContextReducer(initialNavigationContext, {
    type: "open-laboratory", planetId: "earth", selectedStageId: "earth-3",
  });
  context = navigationContextReducer(context, { type: "start-run", planetId: "saturn", stageId: "saturn-2" });
  context = navigationContextReducer(context, { type: "exit-run" });
  assert.deepEqual(context.selector, { planetId: "saturn", selectedStageId: "saturn-2" });
  assert.deepEqual(context.laboratoryOrigin, { planetId: "earth", selectedStageId: "earth-3" });
  context = navigationContextReducer(context, { type: "exit-laboratory" });
  assert.deepEqual(context.selector, { planetId: "earth", selectedStageId: "earth-3" });
});

test("acessos consecutivos ao laboratório substituem sua origem e nível", () => {
  let context = navigationContextReducer(initialNavigationContext, {
    type: "open-laboratory", planetId: "earth", selectedStageId: "earth-3",
  });
  context = navigationContextReducer(context, { type: "exit-laboratory" });
  context = navigationContextReducer(context, {
    type: "open-laboratory", planetId: "neptune", selectedStageId: "neptune-2",
  });
  context = navigationContextReducer(context, { type: "exit-laboratory" });
  assert.deepEqual(context.selector, { planetId: "neptune", selectedStageId: "neptune-2" });
  assert.equal(context.laboratoryOrigin, null);
});

test("mudar de planeta limpa nível selecionado anterior", () => {
  let context = navigationContextReducer(initialNavigationContext, {
    type: "select-stage", planetId: "earth", selectedStageId: "earth-2",
  });
  context = navigationContextReducer(context, { type: "select-stage", planetId: "mars", selectedStageId: null });
  assert.deepEqual(context.selector, { planetId: "mars", selectedStageId: null });
});
