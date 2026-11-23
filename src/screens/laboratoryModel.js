const PLANT_STAGE_ASSETS = {
  earth: [1, 2, 3, 4, 5],
  mars: [6, 7, 8, 9, 10],
  neptune: [11, 12, 13, 14, 15],
  saturn: [16, 17, 18, 19, 20],
};

const DEFAULT_PLANT_STAGE_SCALES = [0.5, 0.6, 0.68, 0.76, 0.82];
const SATURN_PLANT_STAGE_SCALES = [0.46, 0.54, 0.62, 0.68, 0.7];

export function getLaboratoryPlantImage(planetId, growthStage = 0, baseUrl = "/") {
  const stages = PLANT_STAGE_ASSETS[planetId];
  if (!stages) return null;

  const stage = Math.max(0, Math.min(stages.length - 1, Math.floor(Number(growthStage) || 0)));
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}assets/laboratory/plant-${String(stages[stage]).padStart(2, "0")}.png`;
}

export function getLaboratoryPlantScale(planetId, growthStage = 0) {
  const scales = planetId === "saturn" ? SATURN_PLANT_STAGE_SCALES : DEFAULT_PLANT_STAGE_SCALES;
  const stage = Math.max(0, Math.min(scales.length - 1, Math.floor(Number(growthStage) || 0)));
  return scales[stage];
}

export function getNextPlanetIndex(currentIndex, direction, planetCount) {
  if (!planetCount) return 0;
  return (currentIndex + direction + planetCount) % planetCount;
}

export function shouldShowLaboratoryPlant(planet, completedStageIds = []) {
  const firstStageId = planet?.stages?.[0]?.id;
  return Boolean(firstStageId && completedStageIds.includes(firstStageId));
}
