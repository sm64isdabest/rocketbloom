export const initialNavigationContext = {
  selectorPlanetId: null,
  runOriginPlanetId: null,
  laboratoryOriginPlanetId: null,
};

export function navigationContextReducer(state, action) {
  switch (action.type) {
    case "start-run":
      return {
        ...state,
        selectorPlanetId: action.planetId,
        runOriginPlanetId: action.planetId,
      };
    case "exit-run":
      return {
        ...state,
        selectorPlanetId: state.runOriginPlanetId ?? state.selectorPlanetId,
        runOriginPlanetId: null,
      };
    case "open-laboratory":
      return {
        ...state,
        selectorPlanetId: action.planetId,
        laboratoryOriginPlanetId: action.planetId,
      };
    case "exit-laboratory":
      return {
        ...state,
        selectorPlanetId: state.laboratoryOriginPlanetId ?? state.selectorPlanetId,
        laboratoryOriginPlanetId: null,
      };
    default:
      return state;
  }
}
