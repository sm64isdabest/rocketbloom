import { MYSTERY_BOX, POWER_UPS } from "../config/gameConfig.js";

export function createPowerUpState() {
  return { turboMs: 0, bubble: false, magnetMs: 0, doublerMs: 0, freezeMs: 0, rouletteMs: 0, rouletteElapsedMs: 0 };
}

export function getRandomPowerUp(rng = Math.random) {
  const powerUps = Object.keys(POWER_UPS);
  const index = Math.min(powerUps.length - 1, Math.floor(Math.max(0, rng()) * powerUps.length));
  return powerUps[index];
}

export function getNextMysteryBoxDelay(rng = Math.random) {
  const range = MYSTERY_BOX.maxIntervalMs - MYSTERY_BOX.minIntervalMs;
  return MYSTERY_BOX.minIntervalMs + Math.max(0, Math.min(1, rng())) * range;
}

export function activatePowerUp(state, power) {
  if (power === "turbo") return { ...state, turboMs: POWER_UPS.turbo.durationMs };
  if (power === "bubble") return { ...state, bubble: true };
  if (power === "magnet") return { ...state, magnetMs: POWER_UPS.magnet.durationMs };
  if (power === "doubler") return { ...state, doublerMs: POWER_UPS.doubler.durationMs };
  if (power === "freeze") return { ...state, freezeMs: POWER_UPS.freeze.durationMs };
  if (power === "consume-bubble") return { ...state, bubble: false };
  return state;
}

export function tickPowerUps(state, dtMs, { paused = false } = {}) {
  if (paused) return state;
  const elapsed = Math.max(0, dtMs);
  return {
    ...state,
    turboMs: Math.max(0, state.turboMs - elapsed),
    magnetMs: Math.max(0, state.magnetMs - elapsed),
    doublerMs: Math.max(0, state.doublerMs - elapsed),
    freezeMs: Math.max(0, state.freezeMs - elapsed),
    rouletteMs: Math.max(0, state.rouletteMs - elapsed),
    rouletteElapsedMs: state.rouletteMs > 0 ? state.rouletteElapsedMs + elapsed : 0,
  };
}
