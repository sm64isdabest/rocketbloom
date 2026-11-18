const MIN_IMPACT_FACTOR = 0.32;
const HOLD_MS = 2000;
const RECOVERY_MS = 1200;

export function createCollisionImpactState() {
  return { elapsedMs: null, speedFactor: 1 };
}

export function triggerCollisionImpact(speedFactor) {
  return { elapsedMs: 0, speedFactor: Math.max(MIN_IMPACT_FACTOR, Math.min(1, speedFactor)) };
}

export function tickCollisionImpact(state, frameMs, active) {
  if (!active || state.elapsedMs === null) return state;
  return { ...state, elapsedMs: Math.min(HOLD_MS + RECOVERY_MS, state.elapsedMs + frameMs) };
}

export function getCollisionImpactSpeedFactor(state) {
  if (state.elapsedMs === null || state.elapsedMs >= HOLD_MS + RECOVERY_MS) return 1;
  if (state.elapsedMs <= HOLD_MS) return state.speedFactor;

  const recovery = (state.elapsedMs - HOLD_MS) / RECOVERY_MS;
  const easedRecovery = recovery * recovery * (3 - 2 * recovery);
  return state.speedFactor + (1 - state.speedFactor) * easedRecovery;
}
