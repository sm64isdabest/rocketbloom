export const QUESTION_POOLS = {
  earth: [
    {
      id: "earth-q1",
      prompt: "Quanto é 6 + 7?",
      choices: [13, 14, 12, 16],
      correct: 13,
    },
    {
      id: "earth-q2",
      prompt: "Quanto é 9 − 4?",
      choices: [5, 6, 4, 3],
      correct: 5,
    },
  ],
  mars: [
    {
      id: "mars-q1",
      prompt: "Quanto é 8 × 3?",
      choices: [24, 21, 26, 18],
      correct: 24,
    },
  ],
  saturn: [
    {
      id: "saturn-q1",
      prompt: "Quanto é 48 ÷ 6?",
      choices: [8, 6, 9, 7],
      correct: 8,
    },
  ],
  neptune: [
    {
      id: "neptune-q1",
      prompt: "Quanto é 15 × 4 − 20?",
      choices: [40, 35, 45, 30],
      correct: 40,
    },
  ],
};

export function getQuestionPool(poolId) {
  return QUESTION_POOLS[poolId] ?? [];
}
