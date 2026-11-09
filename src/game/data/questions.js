import QUESTION_BANK from "./questions.json" with { type: "json" };

export { QUESTION_BANK };

export function getQuestionsForStage(stageId) {
  const questions = QUESTION_BANK[stageId];
  return Array.isArray(questions) ? questions : [];
}

export function pickQuestion(questions, { rng = Math.random, previousId = null } = {}) {
  if (!questions?.length) return null;

  const filteredQuestions = questions.length > 1
    ? questions.filter((question) => question.id !== previousId)
    : questions;
  const candidates = filteredQuestions.length ? filteredQuestions : questions;
  const randomValue = rng();
  const normalizedRandomValue = Number.isFinite(randomValue) ? Math.max(0, Math.min(0.999999, randomValue)) : 0;
  const index = Math.min(candidates.length - 1,
    Math.floor(normalizedRandomValue * candidates.length));
  return candidates[index];
}
