import { getCoinAmount, collectCoins } from "../game/systems/coinManager.js";
import { getCrossedGoals } from "../game/systems/goalSystem.js";

export function createGoldStorage(value) {
  const total = getCoinAmount(value?.total);
  const equippedIds = Array.isArray(value?.equippedIds) ? value.equippedIds : [];
  return {
    total,
    seenTotal: Math.min(total, getCoinAmount(value?.seenTotal)),
    equippedIds: getCrossedGoals(0, total).map(({ id }) => id).filter((id) => equippedIds.includes(id)),
  };
}

export function creditGold(gold, amount) {
  const total = collectCoins(gold.total, amount ?? 0);
  return total === gold.total ? gold : { ...gold, total };
}

export function acknowledgeGold(gold, throughTotal) {
  const seenTotal = Math.min(gold.total, getCoinAmount(throughTotal));
  return seenTotal <= gold.seenTotal ? gold : { ...gold, seenTotal };
}

export function toggleDecoration(gold, id) {
  if (!getCrossedGoals(0, gold.total).some((goal) => goal.id === id)) return gold;
  const equippedIds = gold.equippedIds.includes(id)
    ? gold.equippedIds.filter((equippedId) => equippedId !== id)
    : [...gold.equippedIds, id];
  return { ...gold, equippedIds };
}
