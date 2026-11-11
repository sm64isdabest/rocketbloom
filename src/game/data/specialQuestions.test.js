import assert from "node:assert/strict";
import test from "node:test";
import { SPECIAL_QUESTION_EVERY, getSpecialQuestionsByCategory, pickSpecialQuestion, SPECIAL_QUESTION_BANK } from "./specialQuestions.js";

const bank = [
  { id: "one", category: "nature", prompt: "Qual precisa de água?", choices: ["Flor", "Pedra", "Nuvem"], correctAnswer: "Flor" },
  { id: "two", category: "animals", prompt: "Onde vive o peixe?", choices: ["Água", "Árvore", "Ninho"], correctAnswer: "Água" },
  { id: "three", category: "space", prompt: "O que ilumina o dia?", choices: ["Sol", "Lua", "Cometa"], correctAnswer: "Sol" },
];

test("pergunta especial aparece no intervalo configurado de perguntas matemáticas", () => {
  assert.equal(SPECIAL_QUESTION_EVERY, 3);
});

test("seleção especial respeita a categoria e evita ids já usados", () => {
  const selected = pickSpecialQuestion(bank, { usedIds: ["one", "two"], rng: () => 0 });
  assert.equal(selected.id, "three");
});

test("pergunta especial oferece três alternativas distintas e uma resposta correta", () => {
  const selected = pickSpecialQuestion(bank, { rng: () => 0.5 });
  assert.equal(selected.choices.length, 3);
  assert.equal(new Set(selected.choices).size, 3);
  assert.equal(selected.choices.filter((choice) => choice === selected.correctAnswer).length, 1);
});

test("seleção especial retorna null quando o banco está vazio", () => {
  assert.equal(pickSpecialQuestion([], { rng: () => 0 }), null);
});
test("banco especial cobre as oito categorias sem operações matemáticas", () => {
  const categories = getSpecialQuestionsByCategory();
  assert.deepEqual(Object.keys(categories).sort(), ["animals", "astronomy", "body", "everyday", "geography", "geometry", "nature", "science"]);
  const questions = Object.values(categories).flat();
  assert.equal(questions.length, 32);
  assert.equal(new Set(questions.map(({ id }) => id)).size, questions.length);
  for (const question of questions) {
    assert.equal(question.choices.length, 3, question.id);
    assert.equal(new Set(question.choices).size, 3, question.id);
    assert.equal(question.choices.filter((choice) => choice === question.correctAnswer).length, 1, question.id);
    assert.ok(question.explanation, question.id);
    assert.doesNotMatch(question.prompt, /\d|[+÷×]/, question.id);
  }
  assert.equal(Object.keys(SPECIAL_QUESTION_BANK).some((category) => ["addition", "subtraction", "multiplication", "division"].includes(category)), false);
});
