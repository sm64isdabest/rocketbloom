export const SCREEN = {
  BOOT: "boot",
  MENU: "menu",
  PLANETS: "planets",
  SETTINGS: "settings",
  COMMAND: "command",
  PLAYING: "playing",
  PAUSED: "paused",
  VICTORY: "victory",
  DEFEAT: "defeat",
  ERROR: "error",
};

export function isPlaySession(screen) {
  return screen === SCREEN.PLAYING || screen === SCREEN.PAUSED;
}
