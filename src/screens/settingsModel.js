import { AUDIO } from "../game/config/gameConfig.js";

export function clampAudioVolume(value) {
  return Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, value));
}

export function getAudioVolumeChange(settingName, value) {
  const volume = clampAudioVolume(Number(value));
  const enabledSetting = {
    musicVolume: "music",
    soundEffectsVolume: "soundEffects",
    interfaceSoundsVolume: "interfaceSounds",
  }[settingName];
  return { [settingName]: volume, [enabledSetting]: volume > AUDIO.minVolume };
}
