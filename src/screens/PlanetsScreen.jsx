import { useState } from "react";
import { PLANETS } from "../game/data/planets.js";
import { getInitialExpandedPlanetId, getPlanetSelectorModel } from "./planetSelectorModel.js";

export function PlanetsScreen({ progress, onBack, onPlay }) {
  const [expandedPlanetId, setExpandedPlanetId] = useState(() => getInitialExpandedPlanetId(progress));

  return (
    <main className="screen screen--section planet-selector">
      <header className="section-head">
        <button type="button" className="btn btn--back" onClick={onBack}>← Base</button>
        <div><p className="eyebrow">Mapa de exploração</p><h1>Escolha seu destino</h1><p className="muted">Selecione um planeta para ver suas fases.</p></div>
        <span className="section-head__count">{progress.unlockedPlanetIds.length} / {PLANETS.length} desbloqueados</span>
      </header>
      <div className="planet-grid planet-grid--select">
        {PLANETS.map((planet, index) => {
          const model = getPlanetSelectorModel(planet, progress);
          const expanded = expandedPlanetId === planet.id;
          const nextStage = model.stages.find((stage) => stage.available && !stage.completed);
          const detailsId = `planet-stages-${planet.id}`;

          return (
            <article key={planet.id} className={`planet-card planet-card--${planet.id} ${model.unlocked ? "is-unlocked" : "is-locked"} ${expanded ? "is-expanded" : ""}`} style={{ "--planet-accent": planet.theme.accent }}>
              <button
                type="button"
                className="planet-card__toggle"
                aria-expanded={expanded}
                aria-controls={detailsId}
                onClick={() => setExpandedPlanetId(expanded ? null : planet.id)}
              >
                <span className="planet-card__visual" aria-hidden="true"><span className="planet-orb" /><span className="planet-orbit" /><span className="planet-card__index">0{index + 1}</span></span>
                <div className="planet-card__body">
                  <span className="planet-card__title">
                    <span><span className="eyebrow">{model.unlocked ? "Rota disponível" : "Destino bloqueado"}</span><span className="planet-card__name">{planet.name}</span></span>
                    <span className={`status-badge ${model.unlocked ? "status-badge--open" : "status-badge--locked"}`}>{model.unlocked ? "● Aberto" : "⌑ Bloqueado"}</span>
                  </span>
                  <span className="planet-card__progress">
                    <span className="planet-card__progress-label"><span>{model.progressLabel}</span><span>{model.progressPercent}%</span></span>
                    <span className="progress-track"><span style={{ width: `${model.progressPercent}%` }} /></span>
                  </span>
                  <span className="planet-card__continue">{model.unlocked ? (nextStage ? `Continuar · ${nextStage.name}` : "Todas as fases concluídas") : "Complete as fases anteriores"}<span className="planet-card__chevron" aria-hidden="true">{expanded ? "−" : "+"}</span></span>
                </div>
              </button>
              {expanded && (
                <div className="planet-card__details" id={detailsId}>
                  <p className="planet-card__blurb">{planet.blurb}</p>
                  <div className="stage-list" aria-label={`Fases de ${planet.name}`}>
                    {model.stages.map((stage, stageIndex) => {
                      const progressLabel = stage.completed ? "concluída" : stage.progressPercent > 0 ? `${stage.progressPercent}% concluída` : stage.available ? "disponível" : "bloqueada";
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          className={`stage-button stage-button--${stage.status}`}
                          disabled={!stage.available}
                          aria-label={`${stage.name}, ${progressLabel}`}
                          onClick={() => onPlay(planet.id, stage.id)}
                        >
                          <span className="stage-button__number">{stage.completed ? "✓" : `0${stageIndex + 1}`}</span>
                          <span className="stage-button__name">{stage.name}</span>
                          <span className="stage-button__status">{stage.completed ? "Concluída" : stage.progressPercent > 0 ? `${stage.progressPercent}%` : stage.available ? "Iniciar" : "Bloqueada"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
