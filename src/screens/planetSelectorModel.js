import { PLANETS } from "../game/data/planets.js";

export function getInitialExpandedPlanetId(progress, planets = PLANETS) {
  const unlocked = planets.filter((planet) => progress.unlockedPlanetIds.includes(planet.id));
  const nextPlanet = unlocked.find((planet) => planet.stages.some((stage) => !progress.completedStageIds.includes(stage.id)));
  return nextPlanet?.id ?? unlocked.at(-1)?.id ?? planets[0]?.id ?? null;
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
    completedCount,
    progressPercent: Math.round((accumulated / stages.length) * 100),
    progressLabel: `${completedCount}/${stages.length} fases concluídas`,
  };
}
