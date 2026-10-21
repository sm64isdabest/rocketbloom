import assert from "node:assert/strict";
import test from "node:test";
import { generateQuestion } from "./questions.js";
import { PLANETS } from "../data/planets.js";

const EXPECTED_OPERATIONS = {
  earth: [["addition"], ["addition"], ["addition"], ["addition"], ["addition"]],
  mars: [["subtraction"], ["subtraction"], ["subtraction"], ["addition", "subtraction"], ["addition", "subtraction"]],
  saturn: [["multiplication"], ["multiplication"], ["multiplication"], ["addition", "subtraction", "multiplication"], ["addition", "subtraction", "multiplication"]],
  neptune: [["division"], ["division"], ["division"], ["addition", "subtraction", "multiplication", "division"], ["addition", "subtraction", "multiplication", "division"]],
};

function makeSequenceRng() {
  let value = 0;
  return () => ((value++ * 0.61803398875) % 1);
}

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

test("cada fase usa somente as operações previstas na matriz de campanha", () => {
  for (const planet of PLANETS) {
    assert.equal(planet.stages.length, 5);
    for (const [index, stage] of planet.stages.entries()) {
      assert.deepEqual(stage.questionCategories, EXPECTED_OPERATIONS[planet.id][index], `${planet.name} ${stage.name}`);
      const rng = makeSequenceRng();
      for (let round = 0; round < 120; round += 1) {
        const question = generateQuestion({
          difficulty: stage.difficulty,
          categories: stage.questionCategories,
          limits: stage.questionLimits,
          rng,
        });
        assert.ok(stage.questionCategories.includes(question.category));
        assertValidSingleOperatorQuestion(question);
      }
    }
  }
});

test("questões consecutivas não repetem a mesma expressão quando há alternativas", () => {
  const first = generateQuestion({ category: "addition", difficulty: 2, rng: () => 0.37 });
  const next = generateQuestion({ category: "addition", difficulty: 2, rng: () => 0.37, previousPrompt: first.prompt });
  assert.notEqual(next.prompt, first.prompt);
  assertValidSingleOperatorQuestion(next);
});

function assertValidSingleOperatorQuestion(question) {
  const numbers = question.prompt.match(/\d+/g)?.map(Number) ?? [];
  const operators = question.prompt.match(/[+−×÷]/g) ?? [];
  assert.equal(numbers.length, 2, question.prompt);
  assert.equal(operators.length, 1, question.prompt);
  const [a, b] = numbers;
  const expected = {
    "+": a + b,
    "−": a - b,
    "×": a * b,
    "÷": a / b,
  }[operators[0]];
  assert.ok(Number.isFinite(expected));
  assert.ok(expected >= 0);
  assert.equal(question.correctAnswer, expected, question.prompt);
  assert.equal(question.choices.length, 4);
  assert.equal(new Set(question.choices).size, 4);
  assert.equal(question.choices.filter((choice) => choice === expected).length, 1);
  assert.deepEqual([...question.incorrectAnswers].sort((x, y) => x - y),
    question.choices.filter((choice) => choice !== expected).sort((x, y) => x - y));
  if (operators[0] === "÷") assert.equal(a % b, 0);
}
