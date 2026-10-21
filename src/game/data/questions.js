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
      prompt: "Quanto é 8 + 5?",
      choices: [13, 12, 14, 11],
      correct: 13,
    },
  ],
  mars: [
    {
      id: "mars-q1",
      prompt: "Quanto é 15 − 8?",
      choices: [7, 6, 8, 5],
      correct: 7,
    },
  ],
  saturn: [
    {
      id: "saturn-q1",
      prompt: "Quanto é 4 × 6?",
      choices: [24, 20, 18, 28],
      correct: 24,
    },
  ],
  neptune: [
    {
      id: "neptune-q1",
      prompt: "Quanto é 24 ÷ 6?",
      choices: [4, 3, 5, 6],
      correct: 4,
    },
  ],
};

export function getQuestionPool(poolId) {
  return QUESTION_POOLS[poolId] ?? [];
}
