export const SCREEN = {
  BOOT: "boot",
  MENU: "menu",
  PLANETS: "planets",
  SETTINGS: "settings",
  COMMAND: "command",
  FLIGHT_INTRO: "flight-intro",
  PLAYING: "playing",
  PAUSED: "paused",
  VICTORY_LAUNCH: "victory-launch",
  VICTORY: "victory",
  DEFEAT: "defeat",
  ERROR: "error",
};

export function isPlaySession(screen) {
  return screen === SCREEN.PLAYING || screen === SCREEN.PAUSED;
}
