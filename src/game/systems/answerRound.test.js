import assert from "node:assert/strict";
import test from "node:test";
import { completeAnswerRound, createAnswerRound, resolveAnswerRound } from "./answerRound.js";
import { Answer } from "../entities/Answer.js";

const question = {
  id: "test-q1",
  prompt: "Quanto é 2 + 2?",
  correctAnswer: 4,
  choices: [1, 4, 3, 5],
};

test("alternativas ficam fixas em quatro colunas com somente uma correta", () => {
  const round = createAnswerRound(question, { width: 320, id: "test-round", rng: Math.random });
  assert.equal(round.answers.length, 4);
  assert.equal(new Set(round.answers.map((answer) => answer.lane)).size, 4);
  assert.equal(round.answers.filter((answer) => answer.correct).length, 1);
  assert.equal(round.status, "awaiting-resolution");
  assert.ok(round.answers.every((answer) => answer.x >= 0 && answer.x + answer.width <= 320));
  assert.equal(new Set(round.answers.map((answer) => answer.y)).size, 1);
});

test("uma resolução inicia uma única animação e só então encerra a rodada", () => {
  const round = createAnswerRound(question, { width: 320, id: "one-shot", rng: () => 0.4 });
  const selected = round.answers.find((answer) => answer.correct);
  const first = resolveAnswerRound(round, selected);
  const second = resolveAnswerRound(round, selected);
  assert.equal(first.correct, true);
  assert.equal(second, null);
  assert.equal(round.status, "animating-correct");
  assert.equal(round.answers.filter((answer) => answer.alive).length, 4);
  assert.equal(completeAnswerRound(round), true);
  assert.equal(round.status, "waiting-next-question");
  assert.equal(round.answers.filter((answer) => answer.alive).length, 0);
  assert.equal(completeAnswerRound(round), false);
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

test("animação de perspectiva leva o número para além da borda inferior", () => {
  const answer = new Answer({ id: "perspective", value: 42, x: 20, y: 148, width: 60, height: 58 });
  const transforms = [];
  const ctx = new Proxy({}, { get: (_target, key) => (...args) => { if (key === "translate" || key === "scale") transforms.push([key, ...args]); } });
  answer.renderPerspective(ctx, 1, 640);
  assert.ok(transforms.find(([name]) => name === "translate")[2] > 640);
  assert.deepEqual(transforms.find(([name]) => name === "scale"), ["scale", 6.5, 6.5]);
});
