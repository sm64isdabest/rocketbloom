import { getCoinAmount, collectCoins } from "../game/systems/coinManager.js";
import { getCrossedGoals, getNextGoldGoal } from "../game/systems/goalSystem.js";

export function createGoldStorage(value) {
  const total = getCoinAmount(value?.total);
  const seenTotal = Math.min(total, getCoinAmount(value?.seenTotal));
  const reached = getCrossedGoals(0, total);
  const seenGoalIds = Array.isArray(value?.seenGoalIds)
    ? reached.filter(({ id }) => value.seenGoalIds.includes(id)).map(({ id }) => id)
    : getCrossedGoals(0, seenTotal).map(({ id }) => id);
  return {
    total,
    seenTotal,
    seenGoalIds,
  };
}

export function creditGold(gold, amount) {
  const total = collectCoins(gold.total, amount ?? 0);
  return total === gold.total ? gold : { ...gold, total };
}

export function creditNextGoldGoal(gold) {
  const next = getNextGoldGoal(gold.total);
  return next ? creditGold(gold, next.amount - gold.total) : gold;
}

export function hasUnseenGoldGoals(gold) {
  return getCrossedGoals(0, gold.total).some(({ id }) => !gold.seenGoalIds.includes(id));
}

export function acknowledgeGold(gold, throughTotal) {
  const through = Math.min(gold.total, getCoinAmount(throughTotal));
  const seenTotal = Math.max(gold.seenTotal, through);
  const newlySeen = getCrossedGoals(0, through).filter(({ id }) => !gold.seenGoalIds.includes(id));
  if (seenTotal === gold.seenTotal && !newlySeen.length) return gold;
  return { ...gold, seenTotal, seenGoalIds: [...gold.seenGoalIds, ...newlySeen.map(({ id }) => id)] };
}
