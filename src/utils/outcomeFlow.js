import { SCREEN } from "./screenStates.js";

export function getOutcomeReturn(outcome, snapshot) {
  if (outcome !== "victory") {
    return { menuPage: SCREEN.MENU, completedStageId: null };
  }

  return {
    menuPage: SCREEN.PLANETS,
    completedStageId: snapshot?.stageId ?? null,
  };
}
