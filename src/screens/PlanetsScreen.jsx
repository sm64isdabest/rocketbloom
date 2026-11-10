import { useEffect, useRef, useState } from "react";
import { PLANETS } from "../game/data/planets.js";
import { playGameSound } from "../game/audio/audioManager.js";
import { canNavigateToPlanet, getInitialExpandedPlanetId, getPlanetIdForStage, getPlanetSelectorModel } from "./planetSelectorModel.js";
import { getMenuAssetUrl } from "./menuModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const PANEL_WIDTH = 472;
const PANEL_HEIGHT = 310;

const STAGE_POSITIONS = {
  earth: [[59, 168], [153, 196], [251, 170], [345, 208], [426, 165]],
  mars: [[58, 166], [153, 205], [251, 177], [343, 213], [423, 169]],
  saturn: [[59, 169], [151, 197], [250, 169], [344, 211], [425, 171]],
  neptune: [[59, 168], [151, 197], [250, 170], [342, 213], [425, 168]],
};

const FRAME_BY_PLANET = {
  earth: "blue",
  mars: "orange",
  saturn: "gold",
  neptune: "blue",
};

const stageStatusLabel = (stage) => {
  if (stage.completed) return "concluída";
  if (stage.progressPercent > 0) return `${stage.progressPercent}% concluída, fase atual`;
  return stage.available ? "fase atual, disponível" : "bloqueada";
};

export function PlanetsScreen({ progress, completedStageId, onBack, onPlay, onMarkPlanetSeen, onSettings, onCommandRoom }) {
  const initialPlanetId = getPlanetIdForStage(completedStageId) ?? getInitialExpandedPlanetId(progress) ?? PLANETS[0]?.id ?? null;
  const [selectedPlanetId, setSelectedPlanetId] = useState(initialPlanetId);
  const [revealingPlanetId, setRevealingPlanetId] = useState(null);
  const discoveryHandled = useRef(new Set(progress.seenPlanetIds ?? []));
  const planet = PLANETS.find(({ id }) => id === selectedPlanetId) ?? PLANETS[0];
  const model = getPlanetSelectorModel(planet, progress);
  const planetIndex = PLANETS.findIndex(({ id }) => id === planet.id);
  const previousPlanet = PLANETS[planetIndex - 1];
  const nextPlanet = PLANETS[planetIndex + 1];
  const numberFormat = new Intl.NumberFormat("pt-BR");

  useEffect(() => {
    if (!planet || !model.unlocked || discoveryHandled.current.has(planet.id)) return;
    discoveryHandled.current.add(planet.id);
    setRevealingPlanetId(planet.id);
    onMarkPlanetSeen(planet.id);
    playGameSound("discovery");
  }, [model.unlocked, onMarkPlanetSeen, planet]);

  const canGoBack = previousPlanet && canNavigateToPlanet(planet.id, previousPlanet.id, progress);
  const canGoForward = nextPlanet && canNavigateToPlanet(planet.id, nextPlanet.id, progress);
  const activeStage = model.stages.find((stage) => stage.available && !stage.completed);
  const baseClass = `phase-selection-canvas phase-selection-canvas--${planet.id}${revealingPlanetId === planet.id ? " is-revealing" : ""}`;

  return (
    <main className="phase-selection-screen" aria-label={`Seleção de fases: ${planet.name}`}>
      <div className={baseClass} onAnimationEnd={() => setRevealingPlanetId(null)}>
        <img
          className="phase-selection-background"
          src={`${APP_BASE}assets/ui/planets/${planet.id}.png`}
          alt=""
          draggable="false"
          aria-hidden="true"
        />
        <svg
          className="phase-selection-route"
          viewBox={`0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={STAGE_POSITIONS[planet.id].map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeDasharray="6 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <button type="button" className="phase-selection-back" onClick={onBack} aria-label="Voltar ao menu">
          <span aria-hidden="true">‹</span><span>Menu</span>
        </button>

        <button type="button" className="phase-selection-settings" onClick={onSettings} aria-label="Abrir configurações" title="Configurações">
          <img src={getMenuAssetUrl("settings.png", APP_BASE)} alt="" aria-hidden="true" />
        </button>

        <header className="phase-selection-header" aria-label="Planeta e recursos">
          <div className="phase-selection-wallet" aria-label={`${numberFormat.format(progress.coins ?? 0)} moedas`}>
            <img src={`${APP_BASE}assets/ui/coin.png`} alt="" aria-hidden="true" />
            <span>{numberFormat.format(progress.coins ?? 0)}</span>
          </div>
          <div className="phase-selection-planet-name">
            <img src={`${APP_BASE}assets/ui/planets/${planet.id}-icon.png`} alt="" aria-hidden="true" />
            <span>{planet.name}</span>
          </div>
          <div className="phase-selection-wallet" aria-label={`${numberFormat.format(progress.diamonds ?? 0)} diamantes`}>
            <img src={`${APP_BASE}assets/ui/diamond.png`} alt="" aria-hidden="true" />
            <span>{numberFormat.format(progress.diamonds ?? 0)}</span>
          </div>
        </header>

        <ol className="phase-selection-stages" aria-label={`Fases de ${planet.name}`}>
          {model.stages.map((stage, stageIndex) => {
            const [x, y] = STAGE_POSITIONS[planet.id]?.[stageIndex] ?? [0, 0];
            const current = activeStage?.id === stage.id;
            return (
              <li
                key={stage.id}
                className={`phase-selection-stage${stage.status ? ` is-${stage.status}` : ""}${current ? " is-current" : ""}${completedStageId === stage.id ? " is-completing" : ""}`}
                style={{
                  "--stage-x": `${(x / PANEL_WIDTH) * 100}%`,
                  "--stage-y": `${(y / PANEL_HEIGHT) * 100}%`,
                }}
              >
                <button
                  type="button"
                  className="phase-selection-stage__button"
                  disabled={!stage.available}
                  aria-current={current ? "step" : undefined}
                  aria-label={`${planet.name}, fase ${stageIndex + 1}, ${stageStatusLabel(stage)}`}
                  onClick={() => onPlay(planet.id, stage.id)}
                >
                  <img
                    className="phase-selection-stage__frame"
                    src={`${APP_BASE}assets/ui/level-frames/${FRAME_BY_PLANET[planet.id]}.png`}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
                  <span className="phase-selection-stage__number">{stageIndex + 1}</span>
                  {stage.completed && <span className="phase-selection-stage__check" aria-hidden="true">✓</span>}
                  {stage.progressPercent > 0 && !stage.completed && (
                    <span className="phase-selection-stage__progress" aria-hidden="true">{stage.progressPercent}%</span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          className="phase-selection-arrow phase-selection-arrow--left"
          disabled={!canGoBack}
          onClick={() => previousPlanet && setSelectedPlanetId(previousPlanet.id)}
          aria-label={canGoBack ? `Planeta anterior: ${previousPlanet.name}` : "Não há planeta anterior desbloqueado"}
        >
          <img src={`${APP_BASE}assets/ui/level-frames/arrow-left.png`} alt="" aria-hidden="true" draggable="false" />
        </button>
        <button
          type="button"
          className="phase-selection-arrow phase-selection-arrow--right"
          disabled={!canGoForward}
          onClick={() => nextPlanet && canGoForward && setSelectedPlanetId(nextPlanet.id)}
          aria-label={canGoForward ? `Próximo planeta: ${nextPlanet.name}` : "Conclua todas as fases para desbloquear o próximo planeta"}
        >
          <img src={`${APP_BASE}assets/ui/level-frames/arrow-right.png`} alt="" aria-hidden="true" draggable="false" />
        </button>
        <button type="button" className="phase-selection-laboratory" onClick={onCommandRoom} aria-label="Abrir Laboratório">
          <img src={getMenuAssetUrl("laboratory.png", APP_BASE)} alt="" aria-hidden="true" />
          <span>Laboratório</span>
        </button>
        {completedStageId && planet.stages.some((stage) => stage.id === completedStageId) ? (
          <p className="phase-completion-title" role="status" aria-live="polite">FASE CONCLUÍDA</p>
        ) : null}
        <p className="visually-hidden" aria-live="polite">{model.progressLabel}</p>
      </div>
    </main>
  );
}
