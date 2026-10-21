import assert from "node:assert/strict";
import test from "node:test";
import { generateQuestion } from "./questions.js";

test("gera quatro operações com resposta correta e três distratores únicos", () => {
  const categories = ["addition", "subtraction", "multiplication", "division"];
  for (const category of categories) {
    const question = generateQuestion({ category, difficulty: 2, rng: () => 0.37 });
    assert.equal(question.category, category);
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices).size, 4);
    assert.equal(question.incorrectAnswers.length, 3);
    assert.ok(question.incorrectAnswers.every((answer) => answer !== question.correctAnswer));
    assert.ok(question.choices.includes(question.correctAnswer));
    if (category === "division") {
      const [dividend, divisor] = question.prompt.match(/\d+/g).map(Number);
      assert.equal(dividend % divisor, 0);
    }
  }
});

test("a dificuldade aumenta os intervalos configurados", () => {
  const low = generateQuestion({ category: "addition", difficulty: 1, rng: () => 0.999 });
  const high = generateQuestion({ category: "addition", difficulty: 4, rng: () => 0.999 });
  assert.ok(high.correctAnswer > low.correctAnswer);
});
