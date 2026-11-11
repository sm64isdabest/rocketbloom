import { SPECIAL_QUESTION_EVERY } from "../data/specialQuestions.js";

export function isSpecialQuestionDue(mathQuestionCount) {
  return mathQuestionCount > 0 && mathQuestionCount % SPECIAL_QUESTION_EVERY === 0;
}

export function resolveSpecialAnswer(question, answer) {
  const correct = answer === question.correctAnswer;
  return {
    correct,
    message: correct ? "Muito bem, explorador!" : "Quase lá! Continue explorando!",
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? "Cada descoberta nos ensina algo novo!",
  };
}
