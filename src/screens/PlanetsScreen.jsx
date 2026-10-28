import { PLANETS } from "../game/data/planets.js";
import { getPlanetSelectorModel } from "./planetSelectorModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const MAP_WIDTH = 858;
const MAP_HEIGHT = 565;

const STAGE_POSITIONS = {
  earth: [[54, 151], [142, 181], [235, 160], [316, 195], [394, 178]],
  mars: [[482, 155], [566, 203], [657, 180], [740, 207], [817, 181]],
  saturn: [[53, 450], [139, 466], [226, 430], [307, 476], [390, 445]],
  neptune: [[481, 448], [565, 474], [654, 455], [736, 482], [815, 454]],
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
    <main className="phase-selection-screen">
      <div className="phase-selection-canvas">
        <img
          className="phase-selection-art"
          src={`${APP_BASE}assets/ui/planet-stage-selection.png`}
          alt="Mapa de fases dos planetas Terra, Marte, Saturno e Netuno."
          draggable="false"
        />

        <div
          className="phase-selection-wallet"
          role="img"
          aria-label={`Saldo: ${coins} moedas e ${diamonds} diamantes`}
        >
          <span className="phase-selection-wallet__value phase-selection-wallet__value--coins" aria-hidden="true">
            {coins}
          </span>
          <span className="phase-selection-wallet__value phase-selection-wallet__value--diamonds" aria-hidden="true">
            {diamonds}
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

        {PLANETS.map((planet) => {
          const model = getPlanetSelectorModel(planet, progress);
          const positions = STAGE_POSITIONS[planet.id] ?? [];

          return (
            <ol key={planet.id} className="phase-selection-stages" aria-label={`Fases de ${planet.name}`}>
              {model.stages.map((stage, stageIndex) => {
                const [x, y] = positions[stageIndex] ?? [0, 0];
                return (
                  <li
                    key={stage.id}
                    className="phase-selection-stages__item"
                    style={{
                      "--stage-x": `${(x / MAP_WIDTH) * 100}%`,
                      "--stage-y": `${(y / MAP_HEIGHT) * 100}%`,
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
                  </li>
                );
              })}
            </ol>
          );
        })}
      </div>
    </main>
  );
}
