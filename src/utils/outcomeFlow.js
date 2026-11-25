import { SCREEN } from "./screenStates.js";

export function getOutcomeReturn(outcome, snapshot) {
  if (outcome !== "victory" && snapshot?.mode !== "endless") {
    return { menuPage: SCREEN.MENU, completedStageId: null };
  }

  return {
    menuPage: SCREEN.PLANETS,
    completedStageId: snapshot?.stageId ?? null,
    ...(outcome === "victory" && snapshot?.firstCompletion && snapshot.stageId === "earth-2" ? { guide: "laboratory" } : {}),
  };
}
