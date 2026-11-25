import { useEffect, useId, useRef, useState } from "react";
import { GameIcon } from "../components/GameIcon.jsx";
import { AUDIO } from "../game/config/gameConfig.js";
import { getMenuAssetUrl } from "./menuModel.js";
import { clampAudioVolume, getAudioVolumeChange } from "./settingsModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";

export function SettingsScreen({ progress, onBack, onChange, onResetProgress }) {
  const ids = useId();
  const [activeTab, setActiveTab] = useState("audio");
  const tabRefs = useRef([]);
  const resetDialog = useRef(null);
  const [resetError, setResetError] = useState(null);
  const controlMode = progress.settings.controlMode ?? "pointer";
  const fallbackMusic = progress.settings.music === false ? AUDIO.minVolume : AUDIO.defaultMusicVolume;
  const fallbackEffects = progress.settings.soundEffects === false ? AUDIO.minVolume : AUDIO.defaultSoundEffectsVolume;
  const musicVolume = clampAudioVolume(progress.settings.musicVolume ?? fallbackMusic);
  const soundEffectsVolume = clampAudioVolume(progress.settings.soundEffectsVolume ?? fallbackEffects);
  const fallbackInterfaceSounds = progress.settings.interfaceSounds === false ? AUDIO.minVolume : AUDIO.defaultInterfaceSoundsVolume;
  const interfaceSoundsVolume = clampAudioVolume(progress.settings.interfaceSoundsVolume ?? fallbackInterfaceSounds);
  const muteAll = progress.settings.muteAll === true;
  const reducedMotion = progress.settings.reducedMotion === true;
  const showHitboxes = progress.settings.showHitboxes === true;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !resetDialog.current?.open) onBack();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onBack]);

  const changeVolume = (settingName, value) => {
    onChange(getAudioVolumeChange(settingName, value));
  };

  const openResetDialog = () => {
    setResetError(null);
    resetDialog.current.showModal();
  };

  const confirmReset = () => {
    const result = onResetProgress();
    if (!result.ok) setResetError(result.error);
  };

  const tabs = [
    { id: "audio", label: "Áudio" },
    { id: "gameplay", label: "Jogabilidade" },
    { id: "accessibility", label: "Acessibilidade" },
    { id: "information", label: "Informações" },
    { id: "about", label: "Sobre nós" },
  ];

  const handleTabKeyDown = (event, index) => {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="settings-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onBack();
    }}>
      <section className="settings-popup" role="dialog" aria-modal="true" aria-labelledby={`${ids}-title`}>
        <h1 id={`${ids}-title`} className="sr-only">Configurações</h1>
        <button type="button" className="settings-popup__close" onClick={onBack} aria-label="Fechar configurações" autoFocus>
          <img src={getMenuAssetUrl("close.webp", APP_BASE)} alt="" />
        </button>

        <div className={`settings-popup__content settings-popup__content--${activeTab}`}>
          <div className="settings-popup__tabs" role="tablist" aria-label="Seções das configurações">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(element) => { tabRefs.current[index] = element; }}
                id={`${ids}-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${ids}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                className={`settings-popup__tab ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div id={`${ids}-panel`} className={`settings-popup__tab-panel settings-popup__tab-panel--${activeTab}`} role="tabpanel" aria-labelledby={`${ids}-tab-${activeTab}`} tabIndex={0}>
          {activeTab === "audio" ? <fieldset className="settings-popup__audio" aria-label="Áudio">
            <section className="settings-popup__audio-card" aria-labelledby={`${ids}-music-title`}>
              <span className="settings-popup__audio-icon"><GameIcon name="music" /></span>
              <div className="settings-popup__audio-body">
                <h2 id={`${ids}-music-title`} className="settings-popup__volume-label">
                  <span id={`${ids}-music-label`}>Música</span> <output htmlFor={`${ids}-music`}>{musicVolume}%</output>
                </h2>
                <p id={`${ids}-music-description`} className="settings-popup__description">Trilha ambiente das suas viagens espaciais.</p>
                <input
                  id={`${ids}-music`}
                  className="settings-popup__range"
                  type="range"
                  min={AUDIO.minVolume}
                  max={AUDIO.maxVolume}
                  step="1"
                  value={musicVolume}
                  style={{ "--range-progress": `${musicVolume}%` }}
                  aria-labelledby={`${ids}-music-label`}
                  aria-describedby={`${ids}-music-description`}
                  aria-valuetext={`${musicVolume}%`}
                  onChange={(event) => changeVolume("musicVolume", event.currentTarget.value)}
                />
              </div>
            </section>

            <section className="settings-popup__audio-card" aria-labelledby={`${ids}-effects-title`}>
              <span className="settings-popup__audio-icon"><GameIcon name="effects" /></span>
              <div className="settings-popup__audio-body">
                <h2 id={`${ids}-effects-title`} className="settings-popup__volume-label">
                  <span id={`${ids}-effects-label`}>Efeitos sonoros</span> <output htmlFor={`${ids}-effects`}>{soundEffectsVolume}%</output>
                </h2>
                <p id={`${ids}-effects-description`} className="settings-popup__description">Moedas, obstáculos, poderes e conquistas.</p>
                <input
                  id={`${ids}-effects`}
                  className="settings-popup__range"
                  type="range"
                  min={AUDIO.minVolume}
                  max={AUDIO.maxVolume}
                  step="1"
                  value={soundEffectsVolume}
                  style={{ "--range-progress": `${soundEffectsVolume}%` }}
                  aria-labelledby={`${ids}-effects-label`}
                  aria-describedby={`${ids}-effects-description`}
                  aria-valuetext={`${soundEffectsVolume}%`}
                  onChange={(event) => changeVolume("soundEffectsVolume", event.currentTarget.value)}
                />
              </div>
            </section>

            <section className="settings-popup__audio-card" aria-labelledby={`${ids}-interface-title`}>
              <span className="settings-popup__audio-icon"><GameIcon name="mouse" /></span>
              <div className="settings-popup__audio-body">
                <h2 id={`${ids}-interface-title`} className="settings-popup__volume-label">
                  <span id={`${ids}-interface-label`}>Sons da interface</span> <output htmlFor={`${ids}-interface`}>{interfaceSoundsVolume}%</output>
                </h2>
                <p id={`${ids}-interface-description`} className="settings-popup__description">Cliques, seleções e botões do jogo.</p>
                <input
                  id={`${ids}-interface`}
                  className="settings-popup__range"
                  type="range"
                  min={AUDIO.minVolume}
                  max={AUDIO.maxVolume}
                  step="1"
                  value={interfaceSoundsVolume}
                  style={{ "--range-progress": `${interfaceSoundsVolume}%` }}
                  aria-labelledby={`${ids}-interface-label`}
                  aria-describedby={`${ids}-interface-description`}
                  aria-valuetext={`${interfaceSoundsVolume}%`}
                  onChange={(event) => changeVolume("interfaceSoundsVolume", event.currentTarget.value)}
                />
              </div>
            </section>

            <section className="settings-popup__audio-card settings-popup__audio-card--switch" aria-labelledby={`${ids}-mute-title`}>
              <span className="settings-popup__audio-icon"><GameIcon name={muteAll ? "sound-off" : "sound-on"} /></span>
              <div className="settings-popup__audio-body">
                <h2 id={`${ids}-mute-title`} className="settings-popup__volume-label">Silenciar todos</h2>
                <p id={`${ids}-mute-description`} className="settings-popup__description">Pausa todos os sons sem perder seus volumes.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={muteAll}
                aria-labelledby={`${ids}-mute-title`}
                aria-describedby={`${ids}-mute-description`}
                className={`settings-popup__audio-switch ${muteAll ? "is-on" : ""}`}
                onClick={() => onChange({ muteAll: !muteAll })}
              >
                <span aria-hidden="true" />{muteAll ? "Ligado" : "Desligado"}
              </button>
            </section>
          </fieldset> : null}

          {activeTab === "gameplay" ? <section className="settings-popup__group" aria-labelledby={`${ids}-controls`}>
            <p className="settings-popup__section-label">CONTROLES</p>
            <h2 id={`${ids}-controls`}>Como pilotar</h2>
            <p className="settings-popup__description">As setas do teclado continuam disponíveis em qualquer modo.</p>
            <div className="control-options settings-popup__control-options" role="group" aria-label="Controle principal">
              <button type="button" className={`control-option ${controlMode === "pointer" ? "is-selected" : ""}`} aria-pressed={controlMode === "pointer"} onClick={() => onChange({ controlMode: "pointer" })}>
                <GameIcon name="mouse" className="control-option__icon" /><b>Toque e mouse</b><small>Arraste o foguete para os lados</small>
              </button>
              <button type="button" className={`control-option ${controlMode === "keyboard" ? "is-selected" : ""}`} aria-pressed={controlMode === "keyboard"} onClick={() => onChange({ controlMode: "keyboard" })}>
                <GameIcon name="keyboard" className="control-option__icon" /><b>Teclado</b><small>Use as setas esquerda e direita ou A e D para pilotar</small>
              </button>
            </div>
            <p className="settings-popup__note">Pausar a missão: Esc ou P.</p>
          </section> : null}

          {activeTab === "accessibility" ? <>
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
          </> : null}

          {activeTab === "information" ? <section className="settings-popup__group" aria-labelledby={`${ids}-information`}>
            <p className="settings-popup__section-label">SOBRE A MISSÃO</p>
            <h2 id={`${ids}-information`}>Ajude a flora a florescer</h2>
            <p className="settings-popup__description">Pilote o foguete pelas fases e alcance as respostas corretas para ganhar velocidade e resgatar as espécies de cada planeta.</p>
            <p className="settings-popup__description">Acompanhe as plantas resgatadas no Laboratório e avance pela campanha para explorar novos planetas.</p>
            <p className="settings-popup__description">Explore Terra, Marte, Saturno e Netuno: conduza o foguete entre obstáculos, resolva desafios e use poderes especiais. Colete moedas, avance pelos níveis e acompanhe no laboratório o crescimento das plantas resgatadas. Cada planeta traz novas descobertas.</p>
            <button type="button" className="btn settings-reset-button" onClick={openResetDialog}>Resetar progresso</button>
          </section> : null}

          {activeTab === "about" ? <section className="settings-popup__about" aria-labelledby={`${ids}-about`}>
            <header className="settings-popup__about-intro">
              <p className="settings-popup__section-label">EQUIPE E PROJETO</p>
              <h2 id={`${ids}-about`}>Quem somos?</h2>
              <p>Criar o RocketBloom foi uma experiência cheia de ideias, descobertas e aprendizado. Trabalhamos juntos para transformar o que aprendemos em uma aventura que aproxima educação e diversão. Ver o projeto ganhar forma em cada etapa tornou essa jornada ainda mais especial.</p>
            </header>
            <div className="settings-popup__team" aria-label="Desenvolvedores">
              {["Luiz Neto", "Isaac Pessoa", "Ricardo Santos", "Thiago Pinheiro"].map((name) => (
                <article className="settings-popup__team-card" key={name}>
                  <span aria-hidden="true">✦</span><h3>{name}</h3><p>Desenvolvedor</p>
                </article>
              ))}
            </div>
            <div className="settings-popup__about-footer">
              <section className="settings-popup__advisor" aria-labelledby={`${ids}-advisor`}>
                <p className="settings-popup__section-label">PROFESSOR ORIENTADOR</p>
                <h3 id={`${ids}-advisor`}>Peterson Lobato</h3>
              </section>
              <section className="settings-popup__institution" aria-label="UNEB — Universidade do Estado da Bahia">
                <img src={`${APP_BASE}assets/ui/uneb-logo.webp`} alt="UNEB — Universidade do Estado da Bahia" />
                <p>UNEB <span>Universidade do Estado da Bahia</span></p>
              </section>
            </div>
          </section> : null}
          </div>
        </div>
        <dialog ref={resetDialog} className="settings-reset-dialog"
          aria-labelledby={`${ids}-reset-title`} aria-describedby={`${ids}-reset-description`}>
          <h2 id={`${ids}-reset-title`}>Resetar progresso?</h2>
          <p id={`${ids}-reset-description`}>A campanha voltará ao início. Fases concluídas, recursos, plantas resgatadas e recordes do Modo Infinito serão apagados deste navegador.</p>
          {resetError ? <p className="settings-reset-dialog__error" role="alert">{resetError}</p> : null}
          <div className="settings-reset-dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={() => resetDialog.current.close()}>Cancelar</button>
            <button type="button" className="btn settings-reset-button" onClick={confirmReset}>Apagar progresso</button>
          </div>
        </dialog>
      </section>
    </div>
  );
}
