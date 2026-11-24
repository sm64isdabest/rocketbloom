import { getPlanetById, PLANETS } from "../game/data/planets.js";

export const LABORATORY_GAME_IDS = ["water", "bees", "clean"];

export function getLaboratoryGrowthIndex(planet, progress) {
  const growth = progress.plantGrowthStages?.[planet.plantId] ?? 0;
  return Math.max(0, Math.min(planet.stages.length - 1, Math.floor(growth)));
}

export function getPendingLaboratoryStage(planet, progress) {
  if (!progress.completedStageIds.includes(planet.stages[0].id)) return null;
  const nextStage = planet.stages[getLaboratoryGrowthIndex(planet, progress) + 1];
  return nextStage && progress.completedStageIds.includes(nextStage.id) ? nextStage : null;
}

function planetNeedsAttention(planet, progress) {
  return progress.laboratoryNotices?.includes(planet.id) || getPendingLaboratoryStage(planet, progress) !== null;
}

export function hasLaboratoryAttention(progress) {
  return PLANETS.some((planet) => planetNeedsAttention(planet, progress));
}

export function getLaboratoryVisitPlanet(progress, preferredPlanetId) {
  const preferred = getPlanetById(preferredPlanetId);
  if (preferred && planetNeedsAttention(preferred, progress)) return preferred;
  return PLANETS.find((planet) => planetNeedsAttention(planet, progress)) ?? preferred ?? PLANETS[0];
}

export function prepareLaboratoryVisit(progress, planetId, rng = Math.random) {
  const planet = getPlanetById(planetId);
  if (!planet) return progress;

  const notices = progress.laboratoryNotices ?? [];
  const activities = progress.laboratoryActivities ?? {};
  const stage = getPendingLaboratoryStage(planet, progress);
  const needsAttention = notices.includes(planetId);
  if (!needsAttention && (!stage || LABORATORY_GAME_IDS.includes(activities[stage.id]))) return progress;

  let nextActivities = activities;
  if (stage && !LABORATORY_GAME_IDS.includes(activities[stage.id])) {
    const previousStage = planet.stages[getLaboratoryGrowthIndex(planet, progress)];
    const choices = LABORATORY_GAME_IDS.filter((id) => id !== activities[previousStage.id]);
    const index = Math.min(choices.length - 1, Math.max(0, Math.floor(rng() * choices.length)));
    nextActivities = { ...activities, [stage.id]: choices[index] };
  }

  return {
    ...progress,
    laboratoryNotices: notices.filter((id) => id !== planetId),
    laboratoryActivities: nextActivities,
  };
}

export function completeLaboratoryCare(progress, planetId, stageId, gameId) {
  const planet = getPlanetById(planetId);
  if (!planet || getPendingLaboratoryStage(planet, progress)?.id !== stageId
    || !LABORATORY_GAME_IDS.includes(gameId) || progress.laboratoryActivities?.[stageId] !== gameId) {
    return progress;
  }
  return {
    ...progress,
    plantGrowthStages: { ...progress.plantGrowthStages, [planet.plantId]: getLaboratoryGrowthIndex(planet, progress) + 1 },
  };
}
