import { AUDIO } from "../game/config/gameConfig.js";

export function clampAudioVolume(value) {
  return Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, value));
}

export function getAudioVolumeChange(settingName, value) {
  const volume = clampAudioVolume(Number(value));
  const enabledSetting = settingName === "musicVolume" ? "music" : "soundEffects";
  return { [settingName]: volume, [enabledSetting]: volume > AUDIO.minVolume };
}
