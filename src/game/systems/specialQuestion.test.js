import assert from "node:assert/strict";
import test from "node:test";
import { isSpecialQuestionDue, resolveSpecialAnswer } from "./specialQuestion.js";

const question = {
  correctAnswer: "Triângulo",
  explanation: "O triângulo tem três lados.",
};

test("desafio especial é adicional após cada três perguntas matemáticas", () => {
  assert.equal(isSpecialQuestionDue(2), false);
  assert.equal(isSpecialQuestionDue(3), true);
  assert.equal(isSpecialQuestionDue(6), true);
  assert.equal(isSpecialQuestionDue(4), false);
});

test("resposta especial correta retorna incentivo sem penalidade", () => {
  assert.deepEqual(resolveSpecialAnswer(question, "Triângulo"), {
    correct: true,
    message: "Muito bem, explorador!",
    correctAnswer: "Triângulo",
    explanation: "O triângulo tem três lados.",
  });
});

test("resposta especial errada revela a resposta e explica com incentivo", () => {
  assert.deepEqual(resolveSpecialAnswer(question, "Círculo"), {
    correct: false,
    message: "Quase lá! Continue explorando!",
    correctAnswer: "Triângulo",
    explanation: "O triângulo tem três lados.",
  });
});
