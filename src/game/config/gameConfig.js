export const STORAGE_KEY = "rocketbloom.progress.v1";
export const PROGRESS_VERSION = 1;

export const VIEW = {
  designWidth: 390,
  designHeight: 844,
  minWidth: 280,
  minHeight: 360,
};

export const ROCKET = {
  width: 42,
  height: 72,
  bottomOffset: 96,
  horizontalSpeed: 520,
  keyboardStep: 280,
};

export const SPEED = {
  start: 120,
  min: 0,
  max: 320,
  correctAnswerBonus: 34,
  wrongAnswerPenalty: 38,
  obstaclePenalty: 44,
  defeatAtOrBelow: 0,
  minProgressMultiplier: 0.35,
  maxProgressMultiplier: 2.2,
};

export const SCORE = {
  correctAnswer: 100,
  incorrectAnswer: -25,
};

export const COMBAT = {
  obstacleDamage: 1,
  maxHitsBeforeDefeat: 3,
};

export const REWARDS = {
  coinValue: 1,
  diamondValue: 1,
  plantMoney: 50,
  stageClearMoney: 20,
};

export const SPAWN = {
  answerFallSpeed: 142,
  answerTop: 148,
  collectibleFallSpeed: 118,
  obstacleFallSpeed: 138,
  obstacleIntervalMs: 4200,
  obstacleMinIntervalMs: 2450,
  obstacleDifficultyIntervalFactor: 0.72,
  obstacleDifficultySpeedFactor: 0.55,
  obstaclePairAfterProgress: 0.62,
  obstacleSafeGap: 30,
  obstacleMinLaneDistance: 104,
  collectibleIntervalMs: 3800,
  maxParticles: 72,
};

export const QUESTION_TIMING = {
  choiceWindowMs: 2800,
  perspectiveAnimationMs: 1450,
  resolutionFeedbackMs: 700,
  interQuestionMinMs: 3000,
  interQuestionMaxMs: 10000,
};

export const QUESTION_DIFFICULTY = {
  1: { operandMax: 10, multiplierMax: 5, divisorMax: 6 },
  2: { operandMax: 16, multiplierMax: 8, divisorMax: 9 },
  3: { operandMax: 24, multiplierMax: 10, divisorMax: 12 },
  4: { operandMax: 40, multiplierMax: 12, divisorMax: 15 },
};

export const DIFFICULTY_BY_PLANET = {
  earth: {
    speedMultiplier: 1,
    spawnRateMultiplier: 1,
    mathTier: 1,
  },
  mars: {
    speedMultiplier: 1.15,
    spawnRateMultiplier: 1.2,
    mathTier: 2,
  },
  saturn: {
    speedMultiplier: 1.3,
    spawnRateMultiplier: 1.4,
    mathTier: 3,
  },
  neptune: {
    speedMultiplier: 1.45,
    spawnRateMultiplier: 1.55,
    mathTier: 4,
  },
};

export const INPUT = {
  pointerDeadZone: 4,
  swipeSensitivity: 1,
};

export function getPlanetDifficulty(planetId) {
  return DIFFICULTY_BY_PLANET[planetId] ?? DIFFICULTY_BY_PLANET.earth;
}
