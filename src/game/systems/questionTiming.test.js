import assert from "node:assert/strict";
import test from "node:test";
import { QUESTION_TIMING } from "../config/gameConfig.js";
import { sampleInterQuestionDelayMs } from "./questionTiming.js";

test("intervalos aleatórios ficam entre 3 e 10 segundos com distribuição uniforme", () => {
  assert.equal(sampleInterQuestionDelayMs(() => 0), 3000);
  assert.equal(sampleInterQuestionDelayMs(() => 1), 10000);
  const samples = Array.from({ length: 1000 }, (_, index) => sampleInterQuestionDelayMs(() => (index + 0.5) / 1000));
  assert.ok(samples.every((value) => value >= QUESTION_TIMING.interQuestionMinMs && value <= QUESTION_TIMING.interQuestionMaxMs));
  const mean = samples.reduce((total, value) => total + value, 0) / samples.length;
  assert.ok(Math.abs(mean - 6500) < 1);
});

test("janela de escolha é independente do intervalo entre questões", () => {
  assert.equal(QUESTION_TIMING.choiceWindowMs, 2800);
  assert.equal(QUESTION_TIMING.interQuestionMinMs, 3000);
  assert.equal(QUESTION_TIMING.interQuestionMaxMs, 10000);
});
