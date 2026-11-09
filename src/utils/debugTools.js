import { PLANETS } from "../game/data/planets.js";

const CURRENCIES = new Set(["coins", "diamonds", "money"]);

export function isDebugShortcut(pressedKeys) {
  const keys = new Set([...pressedKeys].map((key) => String(key).toLowerCase()));
  return keys.has("q") && keys.has("p");
}

export function addDebugCurrency(progress, currency, amount) {
  if (!CURRENCIES.has(currency)) throw new Error("Recurso de debug inválido.");
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return { ...progress, [currency]: Math.max(0, (progress[currency] ?? 0) + safeAmount) };
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
  const unlockedPlanetIds = [...new Set([...progress.unlockedPlanetIds, ...PLANETS.slice(0, planetIndex + 1).map(({ id }) => id)])];
  if (stageIndex === planet.stages.length - 1 && planet.stages.every(({ id }) => completedStageIds.includes(id))) {
    const nextPlanet = PLANETS[planetIndex + 1];
    if (nextPlanet && !unlockedPlanetIds.includes(nextPlanet.id)) unlockedPlanetIds.push(nextPlanet.id);
  }

  return {
    ...progress,
    completedStageIds,
    unlockedPlanetIds,
    stageProgress: { ...(progress.stageProgress ?? {}), [stageId]: 1 },
  };
}
