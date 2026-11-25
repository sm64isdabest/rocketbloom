import { isPlanetComplete, PLANETS } from "../game/data/planets.js";

export function getPlanetIdForStage(stageId, planets = PLANETS) {
  return planets.find((planet) => planet.stages.some((stage) => stage.id === stageId))?.id ?? null;
}

export function getStageClickAction(selectedStageId, clickedStageId) {
  return selectedStageId === clickedStageId ? "enter" : "select";
}

export function getOrbitStage(stages, selectedStageId) {
  const available = stages.filter((stage) => stage.available);
  return available.find((stage) => stage.id === selectedStageId)
    ?? available.find((stage) => !stage.completed)
    ?? available.at(-1);
}

export function getInitialExpandedPlanetId(progress, planets = PLANETS) {
  const unlocked = planets.filter((planet) => progress.unlockedPlanetIds.includes(planet.id));
  const nextPlanet = unlocked.find((planet) => planet.stages.some((stage) => !progress.completedStageIds.includes(stage.id)));
  return nextPlanet?.id ?? unlocked.at(-1)?.id ?? planets[0]?.id ?? null;
}

export function getAdjacentPlanets(planetId, planets = PLANETS) {
  const index = planets.findIndex((planet) => planet.id === planetId);
  if (index < 0) return { previousPlanet: null, nextPlanet: null };
  return {
    previousPlanet: planets.at(index - 1),
    nextPlanet: planets[(index + 1) % planets.length],
  };
}

export function canPlayEndless(planet, progress) {
  return Boolean(planet && progress.unlockedPlanetIds.includes(planet.id)
    && isPlanetComplete(planet, progress.completedStageIds));
}

export function getPlanetSelectorModel(planet, progress) {
  const unlocked = progress.unlockedPlanetIds.includes(planet.id);
  const stages = planet.stages.map((stage, stageIndex) => {
    const completed = progress.completedStageIds.includes(stage.id);
    const progressPercent = completed ? 100 : Math.round((progress.stageProgress?.[stage.id] ?? 0) * 100);
    const available = unlocked && (stageIndex === 0 || progress.completedStageIds.includes(planet.stages[stageIndex - 1].id));
    return {
      ...stage,
      completed,
      progressPercent,
      available,
      status: completed ? "completed" : progressPercent > 0 ? "in-progress" : available ? "available" : "locked",
    };
  });
  const completedCount = stages.filter((stage) => stage.completed).length;
  const accumulated = stages.reduce((total, stage) => total + (stage.completed ? 1 : Math.min(1, (progress.stageProgress?.[stage.id] ?? 0))), 0);

  return {
    unlocked,
    stages,
    endless: {
      unlocked: canPlayEndless(planet, progress),
      highScore: progress.endlessHighScores?.[planet.id] ?? 0,
    },
    completedCount,
    progressPercent: Math.round((accumulated / stages.length) * 100),
    progressLabel: `${completedCount}/${stages.length} fases concluídas`,
  };
}
