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
