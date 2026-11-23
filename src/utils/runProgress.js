import { REWARDS } from "../game/config/gameConfig.js";
import { getCampaignUnlocks, getPlanetById } from "../game/data/planets.js";
import { getPlantById, getPlantGrowthIndex } from "../game/data/plants.js";
import { createGoldStorage, creditGold } from "./goldStorage.js";

const NO_REWARDS = { coins: 0, diamonds: 0, money: 0, plantMoney: 0, sustainabilityPoints: 0, plantName: null, stageCompleted: false };

function unique(values) {
  return [...new Set(values)];
}

export function applyRunOutcome(progress, snapshot, outcome) {
  const runId = snapshot?.runId;
  if (runId && progress.processedRunIds?.includes(runId)) {
    return {
      progress,
      rewards: { ...NO_REWARDS },
      alreadyApplied: true,
    };
  }
  const processedRunIds = [...(progress.processedRunIds ?? []), ...(runId ? [runId] : [])].slice(-1000);
  const gold = creditGold(progress.gold ?? createGoldStorage(), snapshot?.coins);
  if (snapshot?.mode === "endless") {
    const { planetId, endlessScore } = snapshot;
    const endlessHighScores = progress.endlessHighScores ?? {};
    const highScore = endlessHighScores[planetId] ?? 0;
    const improved = getPlanetById(planetId) && Number.isFinite(endlessScore) && endlessScore > highScore;
    return {
      progress: {
        ...progress,
        gold,
        processedRunIds,
        endlessHighScores: improved ? { ...endlessHighScores, [planetId]: Math.floor(endlessScore) } : endlessHighScores,
      },
      rewards: { ...NO_REWARDS },
      alreadyApplied: false,
    };
  }

  if (outcome === "exit") {
    return {
      progress: gold === progress.gold ? progress : { ...progress, gold, processedRunIds },
      rewards: { ...NO_REWARDS },
      alreadyApplied: false,
    };
  }

  const replayingCompletedStage = Boolean(snapshot?.stageId && progress.completedStageIds.includes(snapshot.stageId));
  const earnedCoins = replayingCompletedStage ? 0 : (snapshot?.coins ?? 0) * REWARDS.coinValue;
  const earnedDiamonds = replayingCompletedStage ? 0 : (snapshot?.diamonds ?? 0) * REWARDS.diamondValue;
  const next = {
    ...progress,
    gold,
    coins: progress.coins + earnedCoins,
    diamonds: progress.diamonds + earnedDiamonds,
    unlockedPlanetIds: [...progress.unlockedPlanetIds],
    completedStageIds: [...progress.completedStageIds],
    stageProgress: { ...(progress.stageProgress ?? {}) },
    rescuedPlantIds: [...progress.rescuedPlantIds],
    plantGrowthStages: { ...(progress.plantGrowthStages ?? {}) },
    sustainabilityPoints: progress.sustainabilityPoints ?? 0,
    processedRunIds,
  };
  const rewards = {
    ...NO_REWARDS,
    coins: earnedCoins,
    diamonds: earnedDiamonds,
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

  const plant = getPlantById(planet.plantId);
  if (plant) {
    const firstRescue = !next.rescuedPlantIds.includes(plant.id);
    next.rescuedPlantIds = unique([...next.rescuedPlantIds, plant.id]);
    next.plantGrowthStages[plant.id] = Math.max(
      next.plantGrowthStages[plant.id] ?? 0,
      getPlantGrowthIndex(plant, stageIndex, planet.stages.length),
    );
    if (firstRescue) {
      rewards.money += plant.moneyReward;
      rewards.plantMoney += plant.moneyReward;
      rewards.sustainabilityPoints += plant.sustainabilityPoints;
      next.sustainabilityPoints += plant.sustainabilityPoints;
      rewards.plantName = plant.id;
    }
  }

  next.unlockedPlanetIds = getCampaignUnlocks(next.unlockedPlanetIds, next.completedStageIds);
  next.money += rewards.money;
  return { progress: next, rewards, alreadyApplied: false };
}
