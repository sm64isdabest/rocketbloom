import { PLANETS } from "../game/data/planets.js";
import { getPlanetSelectorModel } from "./planetSelectorModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const PANEL_WIDTH = 472;
const PANEL_HEIGHT = 310;

const STAGE_POSITIONS = {
  earth: [[53, 169], [150, 194], [254, 174], [342, 216], [430, 196]],
  mars: [[55, 181], [151, 223], [252, 197], [341, 224], [431, 198]],
  saturn: [[52, 177], [151, 199], [248, 170], [337, 218], [428, 182]],
  neptune: [[57, 170], [148, 218], [247, 185], [336, 222], [423, 184]],
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
  const planetModels = PLANETS.map((planet) => ({
    planet,
    model: getPlanetSelectorModel(planet, progress),
  }));
  const activeStage = planetModels
    .flatMap(({ planet, model }) => model.stages.map((stage) => ({ planet, stage })))
    .find(({ stage }) => stage.available && !stage.completed)?.stage;

  return (
    <main className="phase-selection-screen">
      <div className="phase-selection-canvas">
        <div className="phase-selection-panels">
          {planetModels.map(({ planet, model }) => (
            <section
              key={planet.id}
              className={`phase-selection-panel phase-selection-panel--${planet.id}`}
              aria-label={`Fases do planeta ${planet.name}`}
            >
              <img
                className="phase-selection-panel__art"
                src={`${APP_BASE}assets/ui/planets/${planet.id}.png`}
                alt=""
                draggable="false"
                aria-hidden="true"
              />

              <ol className="phase-selection-stages" aria-label={`Fases de ${planet.name}`}>
                {model.stages.map((stage, stageIndex) => {
                  const [x, y] = STAGE_POSITIONS[planet.id]?.[stageIndex] ?? [0, 0];
                  const current = activeStage?.id === stage.id;

                  return (
                    <li
                      key={stage.id}
                      className="phase-selection-stages__item"
                      style={{
                        "--stage-x": `${(x / PANEL_WIDTH) * 100}%`,
                        "--stage-y": `${(y / PANEL_HEIGHT) * 100}%`,
                      }}
                    >
                      <button
                        type="button"
                        className="phase-selection-stages__hit-area"
                        disabled={!stage.available}
                        aria-label={`${planet.name}, fase ${stageIndex + 1}, ${stageStatusLabel(stage)}`}
                        onClick={() => onPlay(planet.id, stage.id)}
                      >
                        <span className="visually-hidden">
                          {planet.name}, fase {stageIndex + 1}
                        </span>
                      </button>
                      {current && (
                        <img
                          className="phase-selection-rocket"
                          src={`${APP_BASE}assets/ui/selection-rocket.png`}
                          alt=""
                          draggable="false"
                          aria-hidden="true"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        <div
          className="phase-selection-wallet"
          role="group"
          aria-label={`Saldo: ${coins} moedas e ${diamonds} diamantes`}
        >
          <span className="phase-selection-wallet__currency">
            <span className="phase-selection-wallet__coin" aria-hidden="true" />
            <span>{coins}</span>
          </span>
          <span className="phase-selection-wallet__currency">
            <span className="phase-selection-wallet__diamond" aria-hidden="true" />
            <span>{diamonds}</span>
          </span>
        </div>

        <button
          type="button"
          className="phase-selection-back"
          onClick={onBack}
          aria-label="Voltar ao menu"
        >
          <span className="visually-hidden">← Menu</span>
        </button>
      </div>
    </main>
  );
}
