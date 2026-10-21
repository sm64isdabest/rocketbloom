import { REWARDS } from "../game/config/gameConfig.js";
import { PLANETS, getPlanetById } from "../game/data/planets.js";
import { PLANTS, getPlantById } from "../game/data/plants.js";

function unique(values) {
  return [...new Set(values)];
}

export function applyRunOutcome(progress, snapshot, outcome) {
  const runId = snapshot?.runId;
  if (runId && progress.processedRunIds?.includes(runId)) {
    return {
      progress,
      rewards: { coins: 0, diamonds: 0, money: 0, plantMoney: 0, sustainabilityPoints: 0, plantName: null, stageCompleted: false },
      alreadyApplied: true,
    };
  }

  const replayingCompletedStage = Boolean(snapshot?.stageId && progress.completedStageIds.includes(snapshot.stageId));
  const earnedCoins = replayingCompletedStage ? 0 : (snapshot?.coins ?? 0) * REWARDS.coinValue;
  const earnedDiamonds = replayingCompletedStage ? 0 : (snapshot?.diamonds ?? 0) * REWARDS.diamondValue;
  const next = {
    ...progress,
    coins: progress.coins + earnedCoins,
    diamonds: progress.diamonds + earnedDiamonds,
    unlockedPlanetIds: [...progress.unlockedPlanetIds],
    completedStageIds: [...progress.completedStageIds],
    stageProgress: { ...(progress.stageProgress ?? {}) },
    rescuedPlantIds: [...progress.rescuedPlantIds],
    plantGrowthStages: { ...(progress.plantGrowthStages ?? {}) },
    sustainabilityPoints: progress.sustainabilityPoints ?? 0,
    processedRunIds: [...(progress.processedRunIds ?? []), ...(runId ? [runId] : [])].slice(-1000),
  };
  const rewards = {
    coins: earnedCoins,
    diamonds: earnedDiamonds,
    money: 0,
    plantMoney: 0,
    sustainabilityPoints: 0,
    plantName: null,
    stageCompleted: false,
    replayedStage: replayingCompletedStage,
  };

  if (snapshot?.stageId && !replayingCompletedStage) {
    next.stageProgress[snapshot.stageId] = Math.max(
      next.stageProgress[snapshot.stageId] ?? 0,
      Math.min(1, Math.max(0, snapshot.stageProgress ?? 0)),
    );
  }

  if (outcome !== "victory" || !snapshot?.stageId || next.completedStageIds.includes(snapshot.stageId)) {
    return { progress: next, rewards, alreadyApplied: false };
  }

  const planet = getPlanetById(snapshot.planetId);
  const stageIndex = planet?.stages.findIndex((stage) => stage.id === snapshot.stageId) ?? -1;
  if (!planet || stageIndex < 0) return { progress: next, rewards, alreadyApplied: false };

  const stage = planet.stages[stageIndex];
  next.completedStageIds = unique([...next.completedStageIds, snapshot.stageId]);
  next.stageProgress[snapshot.stageId] = 1;
  rewards.stageCompleted = true;
  rewards.money += stage.rewards?.money ?? REWARDS.stageClearMoney;

  for (const rescuedId of next.rescuedPlantIds) {
    const rescuedPlant = getPlantById(rescuedId);
    const maxStage = Math.max(0, (rescuedPlant?.growthStages?.length ?? 1) - 1);
    next.plantGrowthStages[rescuedId] = Math.min(maxStage, (next.plantGrowthStages[rescuedId] ?? 0) + 1);
  }

  const nextStage = planet.stages[stageIndex + 1];
  if (!nextStage) {
    const planetIndex = PLANETS.findIndex((candidate) => candidate.id === planet.id);
    const nextPlanet = PLANETS[planetIndex + 1];
    if (nextPlanet) next.unlockedPlanetIds = unique([...next.unlockedPlanetIds, nextPlanet.id]);

    if (!next.rescuedPlantIds.includes(planet.plantId)) {
      next.rescuedPlantIds = unique([...next.rescuedPlantIds, planet.plantId]);
      const plantReward = getPlantById(planet.plantId)?.moneyReward ?? 0;
      const rescuedPlant = getPlantById(planet.plantId);
      rewards.money += plantReward;
      rewards.plantMoney += plantReward;
      rewards.sustainabilityPoints += rescuedPlant?.sustainabilityPoints ?? 0;
      next.sustainabilityPoints += rescuedPlant?.sustainabilityPoints ?? 0;
      next.plantGrowthStages[planet.plantId] = Math.min(1, (rescuedPlant?.growthStages?.length ?? 1) - 1);
      rewards.plantName = planet.plantId;
    }
  }

  next.money += rewards.money;
  return { progress: next, rewards, alreadyApplied: false };
}
