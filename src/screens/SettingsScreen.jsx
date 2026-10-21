export function SettingsScreen({ progress, onBack, onChange }) {
  const controlMode = progress.settings.controlMode ?? "pointer";
  const music = progress.settings.music ?? progress.settings.sound !== false;
  const soundEffects = progress.settings.soundEffects ?? progress.settings.sound !== false;
  const reducedMotion = progress.settings.reducedMotion === true;
  return (
    <main className="screen screen--section">
      <header className="section-head"><button type="button" className="btn btn--back" onClick={onBack}>← Base</button><div><p className="eyebrow">Ajustes de voo</p><h1>Configurações</h1><p className="muted">Ajuste a cabine para sua expedição.</p></div></header>
      <div className="settings-layout">
        <section className="panel settings-panel settings-panel--audio"><span className="panel-icon">♫</span><div className="settings-panel__intro"><p className="eyebrow">Áudio</p><h2>Sons da missão</h2><p className="muted">Trilha e efeitos sintetizados são placeholders configuráveis, sem arquivos de áudio externos.</p></div>
          <div className="audio-options">
            <button type="button" role="switch" aria-checked={music} className={`toggle ${music ? "is-on" : ""}`} onClick={() => onChange({ music: !music })}><span />Música {music ? "ligada" : "desligada"}</button>
            <button type="button" role="switch" aria-checked={soundEffects} className={`toggle ${soundEffects ? "is-on" : ""}`} onClick={() => onChange({ soundEffects: !soundEffects })}><span />Efeitos {soundEffects ? "ligados" : "desligados"}</button>
          </div>
        </section>
        <section className="panel settings-panel settings-panel--controls"><span className="panel-icon">⌖</span><div className="settings-panel__intro"><p className="eyebrow">Controles</p><h2>Como pilotar</h2><p className="muted">Escolha seu controle principal. As setas do teclado continuam disponíveis.</p></div>
          <div className="control-options" role="group" aria-label="Controle principal">
            <button type="button" className={`control-option ${controlMode === "pointer" ? "is-selected" : ""}`} aria-pressed={controlMode === "pointer"} onClick={() => onChange({ controlMode: "pointer" })}><span>☝</span><b>Toque e mouse</b><small>Arraste o foguete para os lados</small></button>
            <button type="button" className={`control-option ${controlMode === "keyboard" ? "is-selected" : ""}`} aria-pressed={controlMode === "keyboard"} onClick={() => onChange({ controlMode: "keyboard" })}><span>⌨</span><b>Teclado</b><small>Use ← → ou A e D para pilotar</small></button>
          </div>
          <p className="settings-note">Pausar: tecla Esc ou P. Sua preferência fica salva neste dispositivo.</p>
        </section>
        <section className="panel settings-panel settings-panel--motion"><span className="panel-icon">◌</span><div><p className="eyebrow">Acessibilidade</p><h2>Reduzir animações</h2><p className="muted">Diminui movimentos decorativos e efeitos de partículas.</p></div><button type="button" role="switch" aria-checked={reducedMotion} className={`toggle ${reducedMotion ? "is-on" : ""}`} onClick={() => onChange({ reducedMotion: !reducedMotion })}><span />{reducedMotion ? "Ligado" : "Desligado"}</button></section>
      </div>
    </main>
  );
}
