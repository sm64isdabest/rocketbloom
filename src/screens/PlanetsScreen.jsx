import { PLANETS } from "../game/data/planets.js";

export function PlanetsScreen({ progress, onBack, onPlay }) {
  return (
    <main className="screen screen--section">
      <header className="section-head">
        <button type="button" className="btn btn--back" onClick={onBack}>← Base</button>
        <div><p className="eyebrow">Mapa de exploração</p><h1>Escolha seu destino</h1><p className="muted">Cada mundo guarda um ecossistema único para estudar.</p></div>
        <span className="section-head__count">{progress.unlockedPlanetIds.length} / {PLANETS.length} desbloqueados</span>
      </header>
      <div className="planet-grid planet-grid--select">
        {PLANETS.map((planet, index) => {
          const unlocked = progress.unlockedPlanetIds.includes(planet.id);
          const complete = planet.stages.filter((stage) => progress.completedStageIds.includes(stage.id)).length;
          const accumulated = planet.stages.reduce((total, stage) => total + (progress.completedStageIds.includes(stage.id)
            ? 1 : Math.min(1, progress.stageProgress?.[stage.id] ?? 0)), 0);
          const pct = Math.round((accumulated / planet.stages.length) * 100);
          return (
            <article key={planet.id} className={`planet-card planet-card--${planet.id} ${unlocked ? "is-unlocked" : "is-locked"}`} style={{ "--planet-accent": planet.theme.accent }}>
              <div className="planet-card__visual"><span className="planet-orb" /><span className="planet-orbit" /><span className="planet-card__index">0{index + 1}</span></div>
              <div className="planet-card__body">
                <div className="planet-card__title"><div><span className="eyebrow">{unlocked ? "Rota disponível" : "Sinal não identificado"}</span><h2>{planet.name}</h2></div><span className={`status-badge ${unlocked ? "status-badge--open" : "status-badge--locked"}`}>{unlocked ? "● Aberto" : "⌑ Bloqueado"}</span></div>
                <p>{unlocked ? planet.blurb : "Complete as fases anteriores para revelar este destino."}</p>
                <div className="planet-card__progress"><div><span>Progresso</span><b>{complete}/{planet.stages.length} fases</b></div><div className="progress-track"><span style={{ width: `${pct}%` }} /></div></div>
                <div className="stage-list" aria-label={`Fases de ${planet.name}`}>
                  {planet.stages.map((stage, stageIndex) => {
                    const stageComplete = progress.completedStageIds.includes(stage.id);
                    const stagePct = stageComplete ? 100 : Math.round((progress.stageProgress?.[stage.id] ?? 0) * 100);
                    const stageUnlocked = unlocked && (stageIndex === 0 || progress.completedStageIds.includes(planet.stages[stageIndex - 1].id));
                    const progressLabel = stageComplete ? "concluída" : stagePct > 0 ? `${stagePct}%` : stageUnlocked ? "disponível" : "bloqueada";
                    return <button key={stage.id} type="button" className="stage-button" disabled={!stageUnlocked} aria-label={`${stage.name}, ${progressLabel}`} onClick={() => onPlay(planet.id, stage.id)}><span className="stage-button__number">{stageComplete ? "✓" : `0${stageIndex + 1}`}</span><span>{stage.name}</span><span>{stagePct > 0 && !stageComplete ? `${stagePct}%` : stageUnlocked ? "↗" : "⌑"}</span></button>;
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
