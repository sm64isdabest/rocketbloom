import { PLANETS } from "../game/data/planets.js";
import { getPlanetSelectorModel } from "./planetSelectorModel.js";

const STAGE_POSITIONS = [[8, 60], [29, 73], [51, 58], [73, 76], [92, 64]];

const PLANET_TAGLINES = {
  earth: "Explore o nosso planeta!",
  mars: "Desafios em outro mundo!",
  saturn: "O gigante dos anéis!",
  neptune: "O último desafio!",
};

const MAP_ACCENTS = {
  earth: "#39a9ff",
  mars: "#ff4f59",
  saturn: "#f2bd52",
  neptune: "#1daeff",
};

const stageStatusLabel = (stage) => {
  if (stage.completed) return "concluída";
  if (stage.progressPercent > 0) return `${stage.progressPercent}% concluída`;
  return stage.available ? "disponível" : "bloqueada";
};

export function PlanetsScreen({ progress, onBack, onPlay }) {
  const numberFormat = new Intl.NumberFormat("pt-BR");
  const coins = numberFormat.format(progress.coins ?? 0);
  const diamonds = numberFormat.format(progress.diamonds ?? 0);

  return (
    <main className="screen screen--section planet-selector">
      <header className="planet-selector__header">
        <button type="button" className="btn btn--back" onClick={onBack}>← Base</button>
        <div className="planet-selector__heading">
          <p className="eyebrow">Mapa de exploração</p>
          <h1>Escolha uma fase</h1>
        </div>
        <div className="planet-selector__wallet" role="group" aria-label={`Saldo: ${coins} moedas e ${diamonds} diamantes`}>
          <span className="planet-selector__wallet-item"><i className="resource-coin" aria-hidden="true">●</i><b>{coins}</b><small>moedas</small></span>
          <span className="planet-selector__wallet-divider" aria-hidden="true" />
          <span className="planet-selector__wallet-item"><i className="resource-diamond" aria-hidden="true">◆</i><b>{diamonds}</b><small>diamantes</small></span>
        </div>
      </header>

      <div className="planet-map-grid">
        {PLANETS.map((planet) => {
          const model = getPlanetSelectorModel(planet, progress);
          const activeStageId = model.stages.find((stage) => stage.available && !stage.completed)?.id;
          const planetTitleId = `planet-map-title-${planet.id}`;
          const completionLabel = `${model.completedCount}/${model.stages.length} fases`;

          return (
            <article
              key={planet.id}
              className={`planet-map planet-map--${planet.id} ${model.unlocked ? "is-unlocked" : "is-locked"}`}
              style={{ "--planet-accent": MAP_ACCENTS[planet.id] ?? planet.theme.accent }}
              aria-labelledby={planetTitleId}
            >
              <div className="planet-map__scene">
                <span className="planet-map__stars" aria-hidden="true" />
                {planet.id === "saturn" && <span className="planet-map__ring" aria-hidden="true" />}
                <span className="planet-map__planet" aria-hidden="true" />

                <header className="planet-map__title">
                  <span className="planet-map__emblem" aria-hidden="true"><span className="planet-map__emblem-orb" /></span>
                  <span className="planet-map__copy">
                    <h2 id={planetTitleId}>{planet.name.toUpperCase()}</h2>
                    <p>{PLANET_TAGLINES[planet.id] ?? planet.blurb}</p>
                  </span>
                </header>

                <div className="planet-map__progress" aria-label={model.unlocked ? "Planeta desbloqueado" : "Planeta bloqueado"}>
                  <span className={`planet-map__lock ${model.unlocked ? "is-open" : ""}`}>
                    <span aria-hidden="true">{model.unlocked ? "●" : "🔒"}</span>
                    {model.unlocked ? "Desbloqueado" : "Bloqueado"}
                  </span>
                  <span className="planet-map__completion">{completionLabel}</span>
                </div>

                <svg className="planet-map__route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M 8 60 C 17 56, 22 72, 29 73 S 43 59, 51 58 S 66 75, 73 76 S 85 63, 92 64" />
                </svg>

                <ol className="planet-map__stages" aria-label={`Fases de ${planet.name}`}>
                  {model.stages.map((stage, stageIndex) => {
                    const [x, y] = STAGE_POSITIONS[stageIndex] ?? STAGE_POSITIONS.at(-1);
                    const litStars = stage.completed
                      ? 3
                      : stage.progressPercent > 0
                        ? Math.max(1, Math.ceil(stage.progressPercent / 34))
                        : 0;
                    const active = stage.id === activeStageId;

                    return (
                      <li
                        key={stage.id}
                        className="planet-map__stage"
                        style={{ "--stage-x": `${x}%`, "--stage-y": `${y}%` }}
                      >
                        {active && <span className="planet-map__rocket" aria-hidden="true">🚀</span>}
                        <button
                          type="button"
                          className={`planet-map__stage-button planet-map__stage-button--${stage.status}`}
                          disabled={!stage.available}
                          aria-label={`${planet.name}, fase ${stageIndex + 1}, ${stageStatusLabel(stage)}`}
                          onClick={() => onPlay(planet.id, stage.id)}
                        >
                          <span className="planet-map__stage-number">{stageIndex + 1}</span>
                          <span className="planet-map__stage-stars" aria-hidden="true">
                            {Array.from({ length: 3 }, (_, starIndex) => (
                              <span key={starIndex} className={starIndex < litStars ? "is-lit" : ""}>★</span>
                            ))}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
