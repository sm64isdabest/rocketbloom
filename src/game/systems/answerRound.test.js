import assert from "node:assert/strict";
import test from "node:test";
import { createAnswerRound, resolveAnswerRound } from "./answerRound.js";

const question = {
  id: "test-q1",
  prompt: "Quanto é 2 + 2?",
  correctAnswer: 4,
  choices: [1, 4, 3, 5],
};

test("alternativas ocupam quatro faixas e há somente uma correta", () => {
  const round = createAnswerRound(question, { width: 320, id: "test-round", rng: Math.random });
  assert.equal(round.answers.length, 4);
  assert.equal(new Set(round.answers.map((answer) => answer.lane)).size, 4);
  assert.equal(round.answers.filter((answer) => answer.correct).length, 1);
  assert.ok(round.answers.every((answer) => answer.x >= 0 && answer.x + answer.width <= 320));
});

test("a mesma rodada não pode registrar duas respostas", () => {
  const round = createAnswerRound(question, { width: 320, id: "one-shot", rng: () => 0.4 });
  const selected = round.answers.find((answer) => answer.correct);
  const first = resolveAnswerRound(round, selected);
  const second = resolveAnswerRound(round, selected);
  assert.equal(first.correct, true);
  assert.equal(second, null);
  assert.equal(round.answers.filter((answer) => answer.alive).length, 0);
});

test("cada alternativa correta aparece em diferentes faixas ao longo de novas rodadas", () => {
  const correctLanes = new Set();
  let state = 1;
  const rng = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
  for (let seed = 1; seed <= 80; seed += 1) {
    const round = createAnswerRound(question, { width: 320, id: `round-${seed}`, rng });
    correctLanes.add(round.answers.find((answer) => answer.correct).lane);
  }
  assert.equal(correctLanes.size, 4);
});
