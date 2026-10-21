import { QUESTION_DIFFICULTY } from "../config/gameConfig.js";

export const MATH_CATEGORIES = ["addition", "subtraction", "multiplication", "division"];

const CATEGORY_LABELS = {
  addition: "Adição",
  subtraction: "Subtração",
  multiplication: "Multiplicação",
  division: "Divisão exata",
};

function randomIndex(length, rng) {
  return Math.min(length - 1, Math.floor(Math.max(0, Math.min(0.999999, rng())) * length));
}

function randomInt(min, max, rng) {
  return min + randomIndex(max - min + 1, rng);
}

function shuffled(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, rng);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createOperands(category, limits, rng) {
  const { operandMax, multiplierMax, divisorMax } = limits;
  if (category === "addition") {
    const a = randomInt(2, operandMax, rng);
    const b = randomInt(2, operandMax, rng);
    return { a, b, answer: a + b, prompt: `Quanto é ${a} + ${b}?` };
  }
  if (category === "subtraction") {
    const a = randomInt(3, operandMax, rng);
    const b = randomInt(2, a, rng);
    return { a, b, answer: a - b, prompt: `Quanto é ${a} − ${b}?` };
  }
  if (category === "multiplication") {
    const a = randomInt(2, multiplierMax, rng);
    const b = randomInt(2, multiplierMax, rng);
    return { a, b, answer: a * b, prompt: `Quanto é ${a} × ${b}?` };
  }

  const divisor = randomInt(2, divisorMax, rng);
  const quotient = randomInt(2, divisorMax, rng);
  const dividend = divisor * quotient;
  return { a: dividend, b: divisor, answer: quotient, prompt: `Quanto é ${dividend} ÷ ${divisor}?` };
}

function createDistractors(answer, rng) {
  const candidates = new Set();
  let attempts = 0;
  while (candidates.size < 3 && attempts < 100) {
    const magnitude = randomInt(1, Math.max(4, Math.ceil(answer * 0.35)), rng);
    const sign = rng() < 0.5 ? -1 : 1;
    const candidate = Math.max(0, answer + sign * magnitude);
    if (candidate !== answer) candidates.add(candidate);
    attempts += 1;
  }

  // Answers near zero need nearby positive alternatives; this deterministic tail
  // also guarantees three distinct distractors for every generated question.
  let fallback = 1;
  while (candidates.size < 3) {
    const candidate = answer + fallback;
    if (candidate !== answer) candidates.add(candidate);
    fallback += 1;
  }
  return [...candidates];
}

export function generateQuestion({ difficulty = 1, category, categories, limits, rng = Math.random, id = "question", previousPrompt } = {}) {
  const tier = Math.max(1, Math.min(4, Math.round(difficulty)));
  const availableCategories = categories?.filter((value) => MATH_CATEGORIES.includes(value)) ?? MATH_CATEGORIES;
  const categoryPool = availableCategories.length ? availableCategories : MATH_CATEGORIES;
  const build = (random) => {
    const selectedCategory = categoryPool.includes(category)
      ? category
      : categoryPool[randomIndex(categoryPool.length, random)];
    const operands = createOperands(selectedCategory, { ...QUESTION_DIFFICULTY[tier], ...limits }, random);
    const incorrectAnswers = createDistractors(operands.answer, random);
    return {
      id,
      prompt: operands.prompt,
      correctAnswer: operands.answer,
      incorrectAnswers,
      choices: shuffled([operands.answer, ...incorrectAnswers], random),
      correct: operands.answer,
      difficulty: tier,
      category: selectedCategory,
      categoryLabel: CATEGORY_LABELS[selectedCategory],
    };
  };

  let question = build(rng);
  if (question.prompt === previousPrompt) {
    for (let attempt = 1; attempt <= 12 && question.prompt === previousPrompt; attempt += 1) {
      question = build(rng);
    }
    // Degenerate deterministic RNGs (for example, test fixtures) still get a
    // different valid question whenever the configured range allows one.
    for (let attempt = 1; attempt <= 24 && question.prompt === previousPrompt; attempt += 1) {
      const alternateRandom = () => (attempt * 0.173 + 0.071) % 1;
      question = build(alternateRandom);
    }
  }
  return question;
}
