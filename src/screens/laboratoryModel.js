const PLANT_STAGE_ASSETS = {
  earth: [10, 14, 3, 1],
  mars: [12, 18, 19, 4],
  saturn: [13, 16, 17, 5],
  neptune: [11, 15, 20, 2],
};

export function getLaboratoryPlantImage(planetId, growthStage = 0, baseUrl = "/") {
  const stages = PLANT_STAGE_ASSETS[planetId];
  if (!stages) return null;

  const stage = Math.max(0, Math.min(stages.length - 1, Math.floor(Number(growthStage) || 0)));
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}assets/laboratory/plant-${String(stages[stage]).padStart(2, "0")}.png`;
}

export function getNextPlanetIndex(currentIndex, direction, planetCount) {
  if (!planetCount) return 0;
  return (currentIndex + direction + planetCount) % planetCount;
}
