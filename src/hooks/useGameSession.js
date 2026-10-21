import { useMemo } from "react";
import { getPlanetById, getStageById } from "../game/data/planets.js";
import { getQuestionPool } from "../game/data/questions.js";
import { getObstaclesForPlanet } from "../game/data/obstacles.js";
import { getPlantForPlanet } from "../game/data/plants.js";
import { getPlanetDifficulty } from "../game/config/gameConfig.js";

export function useGameSession(planetId, stageId) {
  return useMemo(() => {
    const planet = getPlanetById(planetId);
    if (!planet) {
      return { error: `Planeta não encontrado: ${planetId}` };
    }
    const stage = getStageById(planet, stageId);
    if (!stage) {
      return { error: `Fase não encontrada: ${stageId}` };
    }
    return {
      planet,
      stage,
      questions: getQuestionPool(planet.questionPoolId),
      obstacles: getObstaclesForPlanet(planet.id),
      plant: getPlantForPlanet(planet.id),
      difficulty: {
        ...getPlanetDifficulty(planet.id),
        mathTier: stage.difficulty,
      },
    };
  }, [planetId, stageId]);
}
