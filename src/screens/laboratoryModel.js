import { getPlantForPlanet } from "../game/data/plants.js";

const PLANT_STAGE_SCALES = [0.6, 0.68, 0.82];

export function getLaboratoryPlantImage(planetId, growthStage = 0, baseUrl = "/") {
  const stages = getPlantForPlanet(planetId)?.growthArt;
  if (!stages) return null;

  const stage = Math.max(0, Math.min(stages.length - 1, Math.floor(Number(growthStage) || 0)));
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}assets/laboratory/plant-${String(stages[stage]).padStart(2, "0")}.png`;
}

export function getLaboratoryPlantScale(growthStage = 0) {
  const stage = Math.max(0, Math.min(PLANT_STAGE_SCALES.length - 1, Math.floor(Number(growthStage) || 0)));
  return PLANT_STAGE_SCALES[stage];
}

export function getNextPlanetIndex(currentIndex, direction, planetCount) {
  if (!planetCount) return 0;
  return (currentIndex + direction + planetCount) % planetCount;
}

export function shouldShowLaboratoryPlant(planet, completedStageIds = []) {
  const firstStageId = planet?.stages?.[0]?.id;
  return Boolean(firstStageId && completedStageIds.includes(firstStageId));
}
