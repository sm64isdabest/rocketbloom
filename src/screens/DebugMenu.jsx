import { useId, useRef, useState } from "react";
import { AUDIO } from "../game/config/gameConfig.js";
import { PLANETS } from "../game/data/planets.js";

const TABS = [
  { id: "settings", label: "Configurações" },
  { id: "progress", label: "Progresso" },
  { id: "stages", label: "Fases" },
];

export function DebugMenu({ progress, run, onClose, onChange, onGrant, onUnlockAll, onCompleteStage, onStartStage }) {
  const ids = useId();
  const [activeTab, setActiveTab] = useState("settings");
  const [planetId, setPlanetId] = useState(run?.planetId ?? "earth");
  const [stageId, setStageId] = useState(run?.stageId ?? "earth-1");
  const tabRefs = useRef([]);
  const planet = PLANETS.find(({ id }) => id === planetId) ?? PLANETS[0];
  const stage = planet.stages.find(({ id }) => id === stageId) ?? planet.stages[0];
  const setting = (key, value, label) => (
    <label className="debug-menu__setting" key={key}>
      <span>{label}</span>
      <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange({ [key]: event.currentTarget.checked })} />
    </label>
  );

  const selectPlanet = (value) => {
    const nextPlanet = PLANETS.find(({ id }) => id === value) ?? PLANETS[0];
    setPlanetId(nextPlanet.id);
    setStageId(nextPlanet.stages[0].id);
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = TABS.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="debug-menu__overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="debug-menu" role="dialog" aria-modal="true" aria-labelledby={`${ids}-title`}>
        <header className="debug-menu__header">
          <div><p className="debug-menu__eyebrow">ROCKETBLOOM · FERRAMENTAS INTERNAS</p><h1 id={`${ids}-title`}>Menu de debug</h1></div>
          <button type="button" className="debug-menu__close" onClick={onClose} autoFocus aria-label="Fechar menu de debug">×</button>
        </header>
        <div className="debug-menu__tabs" role="tablist" aria-label="Seções do menu de debug">
          {TABS.map((tab, index) => (
            <button key={tab.id} ref={(element) => { tabRefs.current[index] = element; }} id={`${ids}-tab-${tab.id}`} type="button" role="tab"
              aria-selected={activeTab === tab.id} aria-controls={`${ids}-panel`} tabIndex={activeTab === tab.id ? 0 : -1}
              className={activeTab === tab.id ? "is-active" : ""} onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}>{tab.label}</button>
          ))}
        </div>
        <div id={`${ids}-panel`} className="debug-menu__body" role="tabpanel" aria-labelledby={`${ids}-tab-${activeTab}`}>
          {activeTab === "settings" && <div className="debug-menu__section">
            <h2>Configurações do jogo</h2>
            <p className="debug-menu__hint">Alterações salvas no perfil atual.</p>
            <label className="debug-menu__setting"><span>Música</span><input type="checkbox" checked={Boolean(progress.settings.music)} onChange={(event) => { const enabled = event.currentTarget.checked; onChange({ music: enabled, musicVolume: enabled ? (progress.settings.musicVolume || AUDIO.defaultMusicVolume) : 0 }); }} /></label>
            <label className="debug-menu__setting debug-menu__setting--range"><span>Volume da música <b>{progress.settings.musicVolume}%</b></span>
              <input type="range" min={AUDIO.minVolume} max={AUDIO.maxVolume} value={progress.settings.musicVolume} onChange={(event) => onChange({ musicVolume: Number(event.currentTarget.value), music: Number(event.currentTarget.value) > 0 })} />
            </label>
            <label className="debug-menu__setting"><span>Efeitos sonoros</span><input type="checkbox" checked={Boolean(progress.settings.soundEffects)} onChange={(event) => { const enabled = event.currentTarget.checked; onChange({ soundEffects: enabled, soundEffectsVolume: enabled ? (progress.settings.soundEffectsVolume || AUDIO.defaultSoundEffectsVolume) : 0 }); }} /></label>
            <label className="debug-menu__setting debug-menu__setting--range"><span>Volume dos efeitos <b>{progress.settings.soundEffectsVolume}%</b></span>
              <input type="range" min={AUDIO.minVolume} max={AUDIO.maxVolume} value={progress.settings.soundEffectsVolume} onChange={(event) => onChange({ soundEffectsVolume: Number(event.currentTarget.value), soundEffects: Number(event.currentTarget.value) > 0 })} />
            </label>
            <label className="debug-menu__setting"><span>Controle principal</span><select value={progress.settings.controlMode} onChange={(event) => onChange({ controlMode: event.currentTarget.value })}><option value="pointer">Toque e mouse</option><option value="keyboard">Teclado</option></select></label>
            {setting("reducedMotion", progress.settings.reducedMotion, "Reduzir animações")}
            {setting("showHitboxes", progress.settings.showHitboxes, "Mostrar áreas de colisão")}
          </div>}

          {activeTab === "progress" && <div className="debug-menu__section">
            <h2>Progresso e recursos</h2>
            <div className="debug-menu__stats">
              <div><span>Moedas</span><b>{progress.coins}</b></div><div><span>Gemas</span><b>{progress.diamonds}</b></div><div><span>Dinheiro</span><b>{progress.money}</b></div>
              <div><span>Fases concluídas</span><b>{progress.completedStageIds.length}/{PLANETS.reduce((sum, item) => sum + item.stages.length, 0)}</b></div>
              <div><span>Planetas liberados</span><b>{progress.unlockedPlanetIds.length}/{PLANETS.length}</b></div>
            </div>
            <div className="debug-menu__grant-grid">
              {[{ key: "coins", label: "Moedas" }, { key: "diamonds", label: "Gemas" }, { key: "money", label: "Dinheiro" }].map(({ key, label }) => (
                <div key={key} className="debug-menu__grant"><span>{label}</span><button type="button" onClick={() => onGrant(key, 100)}>+100</button><button type="button" onClick={() => onGrant(key, 1000)}>+1.000</button></div>
              ))}
            </div>
            <button type="button" className="debug-menu__button" onClick={onUnlockAll}>Desbloquear todos os planetas</button>
          </div>}

          {activeTab === "stages" && <div className="debug-menu__section">
            <h2>Ferramentas de fase</h2>
            <p className="debug-menu__hint">Inicie qualquer fase direto ou marque uma fase como concluída.</p>
            <label className="debug-menu__field">Planeta<select value={planet.id} onChange={(event) => selectPlanet(event.currentTarget.value)}>{PLANETS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="debug-menu__field">Fase<select value={stage.id} onChange={(event) => setStageId(event.currentTarget.value)}>{planet.stages.map((item, index) => <option key={item.id} value={item.id}>Fase {index + 1}{progress.completedStageIds.includes(item.id) ? " · concluída" : ""}</option>)}</select></label>
            <div className="debug-menu__actions"><button type="button" className="debug-menu__button debug-menu__button--primary" onClick={() => onStartStage(planet.id, stage.id)}>Iniciar esta fase</button><button type="button" className="debug-menu__button" onClick={() => onCompleteStage(planet.id, stage.id)}>Marcar fase como concluída</button></div>
            <p className="debug-menu__hint">Fase atual: {run ? `${run.planetId} / ${run.stageId}` : "nenhuma"}</p>
          </div>}
        </div>
        <footer className="debug-menu__footer"><span>Atalho: <kbd>Q</kbd> + <kbd>P</kbd></span><span>Fechar: <kbd>Esc</kbd></span></footer>
      </section>
    </div>
  );
}
