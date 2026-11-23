export function getCoinAmount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function collectCoins(total, amount = 1) {
  return Math.min(Number.MAX_SAFE_INTEGER, total + getCoinAmount(amount));
}
