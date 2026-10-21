import { Answer } from "../entities/Answer.js";
import { SPAWN } from "../config/gameConfig.js";
import { getLaneBounds } from "./lanes.js";

function shuffled(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.floor(Math.max(0, Math.min(0.999999, rng())) * (index + 1)));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createAnswerRound(question, { width, id, rng = Math.random, fallSpeed = SPAWN.answerFallSpeed } = {}) {
  const choices = question?.choices ?? [];
  if (choices.length !== 4 || new Set(choices).size !== 4 || choices.filter((value) => value === question.correctAnswer).length !== 1) {
    throw new Error("A questão precisa ter quatro alternativas distintas e uma única resposta correta.");
  }

  const cardWidth = Math.min(78, Math.max(44, width / 4 - 18));
  const cardHeight = 58;
  const lanes = shuffled([0, 1, 2, 3], rng);
  const answers = choices.map((value, index) => {
    const lane = lanes[index];
    const { left, width: laneWidth } = getLaneBounds(width, lane);
    const centerX = left + laneWidth / 2;
    return new Answer({
      id: `${id}-answer-${index}`,
      value,
      x: Math.max(0, Math.min(width - cardWidth, centerX - cardWidth / 2)),
      y: SPAWN.answerTop,
      width: cardWidth,
      height: cardHeight,
      correct: value === question.correctAnswer,
      speed: fallSpeed,
      lane,
    });
  });

  return { id, question, answers, status: "awaiting-resolution", selectedAnswer: null, result: null };
}

export function resolveAnswerRound(round, answer = null) {
  if (!round || round.status !== "awaiting-resolution") return null;
  if (answer && (!round.answers.includes(answer) || !answer.alive)) return null;

  const result = {
    correct: Boolean(answer?.correct),
    unanswered: answer === null,
    answerId: answer?.id ?? null,
    roundId: round.id,
    lane: answer?.lane ?? null,
  };
  round.status = result.correct ? "animating-correct" : "animating-incorrect";
  round.selectedAnswer = answer;
  round.result = result;
  return result;
}

export function completeAnswerRound(round) {
  if (!round || !["animating-correct", "animating-incorrect", "feedback"].includes(round.status)) return false;
  round.status = "resolved";
  for (const option of round.answers) option.alive = false;
  return true;
}
