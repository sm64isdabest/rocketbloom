import { REWARDS } from "../config/gameConfig.js";

// Edit this value to rebalance campaign length without changing planet content.
export const CAMPAIGN_CONFIG = {
  stagesPerPlanet: 5,
  baseStageDurationMs: 58_000,
  durationIncreasePerStageMs: 8_000,
  stageClearMoney: REWARDS.stageClearMoney,
};

export const MATH_OPERATIONS_BY_PLANET = {
  earth: [["addition"], ["addition"], ["addition"], ["addition"], ["addition"]],
  mars: [["subtraction"], ["subtraction"], ["subtraction"], ["addition", "subtraction"], ["addition", "subtraction"]],
  saturn: [["multiplication"], ["multiplication"], ["multiplication"], ["addition", "subtraction", "multiplication"], ["addition", "subtraction", "multiplication"]],
  neptune: [["division"], ["division"], ["division"], ["addition", "subtraction", "multiplication", "division"], ["addition", "subtraction", "multiplication", "division"]],
};

const PLANET_CONFIG = [
  {
    id: "earth", name: "Terra", order: 1,
    blurb: "Explore a Amazônia, entre copas, rios e rotas de pesquisa. Desvie de aviões, helicópteros e balões.",
    biome: "amazon",
    theme: { skyTop: "#071a12", skyBottom: "#1c5a38", accent: "#3dcc7a", starAlpha: 0.22 },
    obstacleIds: ["plane", "helicopter", "balloon"], questionPoolId: "earth", plantId: "victoria-amazonica",
    difficulty: 1, speedMultiplier: 1, obstacleIntervalMs: 4600, obstacleSpeedMultiplier: 1,
    questionLimits: { operandMax: 10, multiplierMax: 5, divisorMax: 6 },
  },
  {
    id: "mars", name: "Marte", order: 2,
    blurb: "Atravesse desertos de ferro e cânions marcianos. Asteroides cruzam a rota.",
    biome: "mars",
    theme: { skyTop: "#140806", skyBottom: "#8a3a22", accent: "#e07a4a", starAlpha: 0.5 },
    obstacleIds: ["asteroid"], questionPoolId: "mars", plantId: "mars-lichen",
    difficulty: 2, speedMultiplier: 1.12, obstacleIntervalMs: 4050, obstacleSpeedMultiplier: 1.08,
    questionLimits: { operandMax: 16, multiplierMax: 8, divisorMax: 9 },
  },
  {
    id: "saturn", name: "Saturno", order: 3,
    blurb: "Navegue pelo sistema de anéis, entre asteroides e cometas.",
    biome: "saturn",
    theme: { skyTop: "#0b0a18", skyBottom: "#3a2f6b", accent: "#d6c27a", starAlpha: 0.76 },
    obstacleIds: ["asteroid", "comet"], questionPoolId: "saturn", plantId: "ring-fern",
    difficulty: 3, speedMultiplier: 1.25, obstacleIntervalMs: 3600, obstacleSpeedMultiplier: 1.16,
    questionLimits: { operandMax: 24, multiplierMax: 10, divisorMax: 12 },
  },
  {
    id: "neptune", name: "Netuno", order: 4,
    blurb: "Explore o brilho azul de Netuno, entre cometas e cristais de diamante.",
    biome: "neptune",
    theme: { skyTop: "#030716", skyBottom: "#123a7a", accent: "#7ad4ff", starAlpha: 0.94 },
    obstacleIds: ["comet", "diamond-shard"], questionPoolId: "neptune", plantId: "ice-orchid",
    difficulty: 4, speedMultiplier: 1.38, obstacleIntervalMs: 3200, obstacleSpeedMultiplier: 1.24,
    questionLimits: { operandMax: 40, multiplierMax: 12, divisorMax: 15 },
  },
];

function buildStages(planet) {
  return Array.from({ length: CAMPAIGN_CONFIG.stagesPerPlanet }, (_, index) => {
    const stageNumber = index + 1;
    const difficulty = Math.min(4, planet.difficulty + index);
    const progression = index / Math.max(1, CAMPAIGN_CONFIG.stagesPerPlanet - 1);
    return {
      id: `${planet.id}-${stageNumber}`,
      planetId: planet.id,
      name: `Fase ${stageNumber}`,
      difficulty,
      durationMs: CAMPAIGN_CONFIG.baseStageDurationMs + index * CAMPAIGN_CONFIG.durationIncreasePerStageMs,
      speedMultiplier: planet.speedMultiplier * (1 + progression * 0.06),
      speedLossMultiplier: 1 + progression * 0.12,
      obstacleIntervalMs: planet.obstacleIntervalMs * (1 - progression * 0.14),
      obstacleSpeedMultiplier: planet.obstacleSpeedMultiplier * (1 + progression * 0.08),
      questionCategories: [...(MATH_OPERATIONS_BY_PLANET[planet.id]?.[index] ?? [])],
      questionLimits: {
        operandMax: planet.questionLimits.operandMax + index * 2,
        multiplierMax: Math.min(12, planet.questionLimits.multiplierMax + index),
        divisorMax: Math.min(18, planet.questionLimits.divisorMax + index),
      },
      rewards: { money: CAMPAIGN_CONFIG.stageClearMoney },
      completion: { type: "progress", targetMs: CAMPAIGN_CONFIG.baseStageDurationMs + index * CAMPAIGN_CONFIG.durationIncreasePerStageMs },
    };
  });
}

export const PLANETS = PLANET_CONFIG.map((planet) => ({ ...planet, stages: buildStages(planet) }));

export function getPlanetById(planetId) {
  return PLANETS.find((planet) => planet.id === planetId) ?? null;
}

export function getStageById(planet, stageId) {
  return planet?.stages.find((stage) => stage.id === stageId) ?? null;
}

export function getFirstStage(planet) {
  return planet?.stages[0] ?? null;
}
