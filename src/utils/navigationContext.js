function createSelectorState(planetId = null, selectedStageId = null) {
  return { planetId, selectedStageId };
}

export const initialNavigationContext = {
  selector: createSelectorState(),
  runOrigin: null,
  laboratoryOrigin: null,
};

export function navigationContextReducer(state, action) {
  switch (action.type) {
    case "reset":
      return initialNavigationContext;
    case "select-stage": {
      const selector = createSelectorState(action.planetId, action.selectedStageId ?? null);
      return { ...state, selector };
    }
    case "start-run": {
      const runOrigin = createSelectorState(action.planetId, action.stageId);
      return { ...state, selector: runOrigin, runOrigin };
    }
    case "exit-run":
      return {
        ...state,
        selector: state.runOrigin ?? state.selector,
        runOrigin: null,
      };
    case "open-laboratory": {
      const laboratoryOrigin = createSelectorState(action.planetId, action.selectedStageId ?? null);
      return { ...state, selector: laboratoryOrigin, laboratoryOrigin };
    }
    case "exit-laboratory":
      return {
        ...state,
        selector: state.laboratoryOrigin ?? state.selector,
        laboratoryOrigin: null,
      };
    default:
      return state;
  }
}
