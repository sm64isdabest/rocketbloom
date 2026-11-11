import SPECIAL_QUESTION_BANK from "./specialQuestions.json" with { type: "json" };

export { SPECIAL_QUESTION_BANK };

export const SPECIAL_QUESTION_EVERY = 3;
export const SPECIAL_CATEGORY_LABELS = {
  geometry: { label: "Geometria", icon: "🔷" },
  nature: { label: "Natureza", icon: "🌱" },
  animals: { label: "Animais", icon: "🐾" },
  body: { label: "Corpo humano", icon: "💛" },
  science: { label: "Ciências", icon: "✨" },
  astronomy: { label: "Astronomia", icon: "🪐" },
  geography: { label: "Geografia", icon: "🌎" },
  everyday: { label: "Cotidiano", icon: "🍎" },
};

export function getSpecialQuestionsByCategory() {
  return SPECIAL_QUESTION_BANK;
}

export function getAllSpecialQuestions() {
  return Object.entries(SPECIAL_QUESTION_BANK).flatMap(([category, questions]) =>
    questions.map((question) => ({ ...question, category })),
  );
}

export function pickSpecialQuestion(bank = getAllSpecialQuestions(), { usedIds = [], rng = Math.random } = {}) {
  if (!bank?.length) return null;
  const unusedQuestions = bank.filter((question) => !usedIds.includes(question.id));
  const candidates = unusedQuestions.length ? unusedQuestions : bank;
  const value = rng();
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0;
  return candidates[Math.floor(normalized * candidates.length)];
}
