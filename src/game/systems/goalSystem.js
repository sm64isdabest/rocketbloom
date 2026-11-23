import { GOLD_GOALS } from "../config/goldConfig.js";

export function getNextGoldGoal(total) {
  return GOLD_GOALS.find(({ amount }) => total < amount) ?? null;
}

export function getHighestGoldGoal(total) {
  return GOLD_GOALS.findLast(({ amount }) => total >= amount) ?? null;
}

export function getCrossedGoals(previous, total) {
  return GOLD_GOALS.filter(({ amount }) => previous < amount && total >= amount);
}

export function getGoalProgress(total, amount) {
  return Math.max(0, Math.min(1, total / amount));
}

export function getGoldMeterProgress(total) {
  const next = GOLD_GOALS.findIndex(({ amount }) => total < amount);
  if (next === -1) return 1;
  const previousAmount = GOLD_GOALS[next - 1]?.amount ?? 0;
  const progress = getGoalProgress(total - previousAmount, GOLD_GOALS[next].amount - previousAmount);
  return (next + progress) / GOLD_GOALS.length;
}
