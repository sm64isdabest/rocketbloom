import { SCREEN } from "./screenStates.js";

export function getOutcomeReturn(outcome, snapshot) {
  const completedStageId = outcome === "victory" && snapshot?.firstCompletion ? snapshot.stageId ?? null : null;
  const guide = { "earth-2": "laboratory", "earth-3": "storage" }[completedStageId];

  return {
    menuPage: SCREEN.PLANETS,
    completedStageId,
    ...(guide ? { guide } : {}),
  };
}
