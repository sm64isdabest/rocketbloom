import { useEffect, useId } from "react";
import { AUDIO } from "../game/config/gameConfig.js";
import { getMenuAssetUrl } from "./menuModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";

function clampVolume(value) {
  return Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, value));
}

export function SettingsScreen({ progress, onBack, onChange }) {
  const ids = useId();
  const controlMode = progress.settings.controlMode ?? "pointer";
  const fallbackMusic = progress.settings.music === false ? AUDIO.minVolume : AUDIO.defaultMusicVolume;
  const fallbackEffects = progress.settings.soundEffects === false ? AUDIO.minVolume : AUDIO.defaultSoundEffectsVolume;
  const musicVolume = clampVolume(progress.settings.musicVolume ?? fallbackMusic);
  const soundEffectsVolume = clampVolume(progress.settings.soundEffectsVolume ?? fallbackEffects);
  const reducedMotion = progress.settings.reducedMotion === true;
  const showHitboxes = progress.settings.showHitboxes === true;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onBack();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onBack]);

  const changeVolume = (settingName, value) => {
    const volume = clampVolume(Number(value));
    const isMusic = settingName === "musicVolume";
    onChange({ [settingName]: volume, [isMusic ? "music" : "soundEffects"]: volume > AUDIO.minVolume });
  };

  return (
    <div className="settings-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onBack();
    }}>
      <section className="settings-popup" role="dialog" aria-modal="true" aria-labelledby={`${ids}-title`}>
        <h1 id={`${ids}-title`} className="sr-only">Configurações</h1>
        <button type="button" className="settings-popup__close" onClick={onBack} aria-label="Fechar configurações" autoFocus>
          <img src={getMenuAssetUrl("close.png", APP_BASE)} alt="" />
        </button>

        <div className="settings-popup__content">
          <fieldset className="settings-popup__audio" aria-label="Áudio">
            <label className="settings-popup__volume-label" htmlFor={`${ids}-music`}>Música</label>
            <input
              id={`${ids}-music`}
              className="settings-popup__range"
              type="range"
              min={AUDIO.minVolume}
              max={AUDIO.maxVolume}
              step="1"
              value={musicVolume}
              style={{ "--range-progress": `${musicVolume}%` }}
              aria-label="Volume da música"
              aria-valuetext={`${musicVolume}%`}
              onChange={(event) => changeVolume("musicVolume", event.currentTarget.value)}
            />

            <label className="settings-popup__volume-label" htmlFor={`${ids}-effects`}>Efeitos sonoros</label>
            <input
              id={`${ids}-effects`}
              className="settings-popup__range"
              type="range"
              min={AUDIO.minVolume}
              max={AUDIO.maxVolume}
              step="1"
              value={soundEffectsVolume}
              style={{ "--range-progress": `${soundEffectsVolume}%` }}
              aria-label="Volume dos efeitos sonoros"
              aria-valuetext={`${soundEffectsVolume}%`}
              onChange={(event) => changeVolume("soundEffectsVolume", event.currentTarget.value)}
            />
          </fieldset>

          <section className="settings-popup__group" aria-labelledby={`${ids}-controls`}>
            <p className="settings-popup__section-label">CONTROLES</p>
            <h2 id={`${ids}-controls`}>Como pilotar</h2>
            <p className="settings-popup__description">As setas do teclado continuam disponíveis em qualquer modo.</p>
            <div className="control-options settings-popup__control-options" role="group" aria-label="Controle principal">
              <button type="button" className={`control-option ${controlMode === "pointer" ? "is-selected" : ""}`} aria-pressed={controlMode === "pointer"} onClick={() => onChange({ controlMode: "pointer" })}>
                <span aria-hidden="true">☝</span><b>Toque e mouse</b><small>Arraste o foguete para os lados</small>
              </button>
              <button type="button" className={`control-option ${controlMode === "keyboard" ? "is-selected" : ""}`} aria-pressed={controlMode === "keyboard"} onClick={() => onChange({ controlMode: "keyboard" })}>
                <span aria-hidden="true">⌨</span><b>Teclado</b><small>Use ← → ou A e D para pilotar</small>
              </button>
            </div>
            <p className="settings-popup__note">Pausar a missão: Esc ou P.</p>
          </section>

          <section className="settings-popup__accessibility" aria-labelledby={`${ids}-motion`}>
            <div>
              <p className="settings-popup__section-label">ACESSIBILIDADE</p>
              <h2 id={`${ids}-motion`}>Reduzir animações</h2>
              <p className="settings-popup__description">Diminui os movimentos decorativos e as partículas.</p>
            </div>
            <button type="button" role="switch" aria-checked={reducedMotion} className={`toggle ${reducedMotion ? "is-on" : ""}`} onClick={() => onChange({ reducedMotion: !reducedMotion })}>
              <span />{reducedMotion ? "Ligado" : "Desligado"}
            </button>
          </section>

          <section className="settings-popup__accessibility" aria-labelledby={`${ids}-hitboxes`}>
            <div>
              <p className="settings-popup__section-label">VISUALIZAÇÃO</p>
              <h2 id={`${ids}-hitboxes`}>Áreas de colisão</h2>
              <p className="settings-popup__description">Mostra os limites de colisão do foguete, itens e obstáculos nas fases.</p>
            </div>
            <button type="button" role="switch" aria-checked={showHitboxes} aria-labelledby={`${ids}-hitboxes`} className={`toggle ${showHitboxes ? "is-on" : ""}`} onClick={() => onChange({ showHitboxes: !showHitboxes })}>
              <span />{showHitboxes ? "Ligado" : "Desligado"}
            </button>
          </section>
        </div>
      </section>
    </div>
  );
}
