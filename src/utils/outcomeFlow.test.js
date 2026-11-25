import assert from "node:assert/strict";
import test from "node:test";
import { SCREEN } from "./screenStates.js";
import { getOutcomeReturn } from "./outcomeFlow.js";

test("vitória retorna à seleção de fases e destaca a fase concluída", () => {
  assert.deepEqual(getOutcomeReturn("victory", { stageId: "earth-3" }), {
    menuPage: SCREEN.PLANETS,
    completedStageId: "earth-3",
  });
});

test("derrota retorna ao menu sem destacar uma fase", () => {
  assert.deepEqual(getOutcomeReturn("defeat", { stageId: "earth-3" }), {
    menuPage: SCREEN.MENU,
    completedStageId: null,
  });
});

test("fim do modo infinito retorna ao seletor sem destacar uma fase de campanha", () => {
  assert.deepEqual(getOutcomeReturn("defeat", { mode: "endless", planetId: "earth", stageId: null }), {
    menuPage: SCREEN.PLANETS,
    completedStageId: null,
  });
});

test("o guia do Laboratório aparece só ao voltar da primeira vitória no Nível 2 da Terra", () => {
  assert.equal(getOutcomeReturn("victory", { stageId: "earth-2", firstCompletion: true }).guide, "laboratory");
  assert.equal(getOutcomeReturn("victory", { stageId: "earth-2", firstCompletion: false }).guide, undefined);
  assert.equal(getOutcomeReturn("victory", { stageId: "mars-2", firstCompletion: true }).guide, undefined);
  assert.equal(getOutcomeReturn("defeat", { stageId: "earth-2", firstCompletion: true }).guide, undefined);
});
