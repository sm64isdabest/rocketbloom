import { getCampaignUnlocks, PLANETS } from "../game/data/planets.js";

export function isDebugShortcut(pressedKeys) {
  const keys = new Set([...pressedKeys].map((key) => String(key).toLowerCase()));
  return keys.has("q") && keys.has("p");
}

export function addDebugCoins(progress, amount) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return { ...progress, coins: Math.max(0, (progress.coins ?? 0) + safeAmount) };
}

export function unlockAllPlanets(progress) {
  return { ...progress, unlockedPlanetIds: PLANETS.map(({ id }) => id) };
}

export function completeDebugStage(progress, planetId, stageId) {
  const planet = PLANETS.find(({ id }) => id === planetId);
  const stageIndex = planet?.stages.findIndex(({ id }) => id === stageId) ?? -1;
  if (stageIndex < 0) throw new Error("Fase de debug inválida.");
  const completedStageIds = [...new Set([...progress.completedStageIds, stageId])];
  const planetIndex = PLANETS.findIndex(({ id }) => id === planetId);
  const unlockedPlanetIds = getCampaignUnlocks([
    ...progress.unlockedPlanetIds,
    ...PLANETS.slice(0, planetIndex + 1).map(({ id }) => id),
  ], completedStageIds);

  return {
    ...progress,
    completedStageIds,
    unlockedPlanetIds,
    stageProgress: { ...(progress.stageProgress ?? {}), [stageId]: 1 },
  };
}

export function uncompleteDebugStage(progress, planetId, stageId) {
  const planet = PLANETS.find(({ id }) => id === planetId);
  if (!planet?.stages.some(({ id }) => id === stageId)) throw new Error("Fase de debug inválida.");
  return {
    ...progress,
    completedStageIds: progress.completedStageIds.filter((id) => id !== stageId),
    stageProgress: { ...(progress.stageProgress ?? {}), [stageId]: 0 },
  };
}
