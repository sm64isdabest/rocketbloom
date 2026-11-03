import { MYSTERY_BOX, POWER_UPS } from "../config/gameConfig.js";

export function createPowerUpState() {
  return { turboMs: 0, starMs: 0, bubble: false, rouletteMs: 0, rouletteElapsedMs: 0 };
}

export function getRandomPowerUp(rng = Math.random) {
  const index = Math.min(3, Math.floor(Math.max(0, rng()) * 4));
  return Object.keys(POWER_UPS)[index];
}

export function getNextMysteryBoxDelay(rng = Math.random) {
  const range = MYSTERY_BOX.maxIntervalMs - MYSTERY_BOX.minIntervalMs;
  return MYSTERY_BOX.minIntervalMs + Math.max(0, Math.min(1, rng())) * range;
}

export function activatePowerUp(state, power) {
  if (power === "turbo") return { ...state, turboMs: POWER_UPS.turbo.durationMs };
  if (power === "star") return { ...state, starMs: POWER_UPS.star.durationMs };
  if (power === "bubble") return { ...state, bubble: true };
  if (power === "consume-bubble") return { ...state, bubble: false };
  return state;
}

export function tickPowerUps(state, dtMs, { paused = false } = {}) {
  if (paused) return state;
  const elapsed = Math.max(0, dtMs);
  return {
    ...state,
    turboMs: Math.max(0, state.turboMs - elapsed),
    starMs: Math.max(0, state.starMs - elapsed),
    rouletteMs: Math.max(0, state.rouletteMs - elapsed),
    rouletteElapsedMs: state.rouletteMs > 0 ? state.rouletteElapsedMs + elapsed : 0,
  };
}
