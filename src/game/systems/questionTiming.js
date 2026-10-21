import { QUESTION_TIMING } from "../config/gameConfig.js";

export function sampleInterQuestionDelayMs(rng = Math.random) {
  const sample = Math.max(0, Math.min(1, rng()));
  const span = QUESTION_TIMING.interQuestionMaxMs - QUESTION_TIMING.interQuestionMinMs;
  return QUESTION_TIMING.interQuestionMinMs + sample * span;
}
