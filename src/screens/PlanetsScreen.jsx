import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { PLANETS } from "../game/data/planets.js";
import { playGameSound } from "../game/audio/audioManager.js";
import { canNavigateToPlanet, getInitialExpandedPlanetId, getOrbitStage, getPlanetIdForStage, getPlanetSelectorModel, getStageClickAction } from "./planetSelectorModel.js";
import { getMenuAssetUrl } from "./menuModel.js";
import { setOrbitTargetElement } from "./rocketOrbit.js";

const OrbitalRocket = lazy(() => import("./OrbitalRocket.jsx").then((module) => ({ default: module.OrbitalRocket })));

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const PANEL_WIDTH = 472;
const PANEL_HEIGHT = 310;
const LEVEL_ASSET_PLANET = { earth: "terra", mars: "marte", saturn: "saturno", neptune: "netuno" };
const PLANET_SUBTITLES = {
  earth: "Explore o nosso planeta!",
  mars: "Desvende os mistérios do planeta vermelho!",
  saturn: "O gigante dos anéis!",
  neptune: "O último desafio!",
};

const STAGE_POSITIONS = {
  earth: [[59, 168], [153, 196], [251, 170], [345, 208], [426, 165]],
  mars: [[58, 166], [153, 205], [251, 177], [343, 213], [423, 169]],
  saturn: [[59, 169], [151, 197], [250, 169], [344, 211], [425, 171]],
  neptune: [[59, 168], [151, 197], [250, 170], [342, 213], [425, 168]],
};

const stageStatusLabel = (stage) => {
  if (stage.completed) return "concluída";
  if (stage.progressPercent > 0) return `${stage.progressPercent}% concluída, fase atual`;
  return stage.available ? "fase atual, disponível" : "bloqueada";
};

export function PlanetsScreen({ progress, completedStageId, preferredPlanetId, preferredStageId, onBack, onPlay, onMarkPlanetSeen, onSettings, onCommandRoom, onSelectionChange }) {
  const validPreferredPlanetId = PLANETS.some(({ id }) => id === preferredPlanetId) ? preferredPlanetId : null;
  const initialPlanetId = validPreferredPlanetId ?? getPlanetIdForStage(completedStageId) ?? getInitialExpandedPlanetId(progress) ?? PLANETS[0]?.id ?? null;
  const initialStageId = PLANETS.find(({ id }) => id === initialPlanetId)?.stages.some(({ id }) => id === preferredStageId)
    ? preferredStageId
    : null;
  const [selectedPlanetId, setSelectedPlanetId] = useState(initialPlanetId);
  const [selectedStageId, setSelectedStageId] = useState(initialStageId);
  const [revealingPlanetId, setRevealingPlanetId] = useState(null);
  const [hoveredSelector, setHoveredSelector] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [selectionPulse, setSelectionPulse] = useState(0);
  const discoveryHandled = useRef(new Set(progress.seenPlanetIds ?? []));
  const activeStageElementRef = useRef(null);
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

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    preference.addEventListener?.("change", updatePreference);
    return () => {
      preference.removeEventListener?.("change", updatePreference);
    };
  }, []);

  const canGoBack = previousPlanet && canNavigateToPlanet(planet.id, previousPlanet.id, progress);
  const canGoForward = nextPlanet && canNavigateToPlanet(planet.id, nextPlanet.id, progress);
  const activeStage = model.stages.find((stage) => stage.available && !stage.completed);
  const orbitStage = getOrbitStage(model.stages, selectedStageId);
  const baseClass = `phase-selection-canvas phase-selection-canvas--${planet.id}${revealingPlanetId === planet.id ? " is-revealing" : ""}`;

  const launchStage = (stageId, targetElement) => {
    setOrbitTargetElement(activeStageElementRef, targetElement);
    if (getStageClickAction(selectedStageId, stageId) === "select") {
      setSelectedStageId(stageId);
      onSelectionChange?.(planet.id, stageId);
      setSelectionPulse((pulse) => pulse + 1);
      return;
    }
    onPlay(planet.id, stageId);
  };
  const selectPlanet = (planetId) => {
    setSelectedStageId(null);
    setSelectedPlanetId(planetId);
    onSelectionChange?.(planetId, null);
  };

  return (
    <main className="phase-selection-screen" aria-label={`Seleção de fases: ${planet.name}`}>
      <div
        className={baseClass}
        onAnimationEnd={() => setRevealingPlanetId(null)}
        onPointerEnter={() => setHoveredSelector(true)}
        onPointerLeave={() => setHoveredSelector(false)}
      >
        <img
          className="phase-selection-background"
          src={`${APP_BASE}assets/ui/planets/${planet.id}.webp`}
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
        {orbitStage && (
          <Suspense fallback={null}>
            <OrbitalRocket
              targetRef={activeStageElementRef}
              hovered={hoveredSelector}
              reducedMotion={reducedMotion}
              selectionPulse={selectionPulse}
            />
          </Suspense>
        )}

        <header className="phase-selection-header" aria-label="Planeta, recursos e navegação">
          <div className="phase-selection-identity">
            <img className="phase-selection-identity__planet" src={`${APP_BASE}assets/ui/planets/${planet.id}-icon.webp`} alt="" aria-hidden="true" />
            <div className="phase-selection-identity__copy">
              <span className="phase-selection-identity__name">{planet.name}</span>
              <span className="phase-selection-identity__subtitle">{PLANET_SUBTITLES[planet.id]}</span>
            </div>
          </div>

          <div className="phase-selection-resources" aria-label="Recursos do jogador">
            <div className="phase-selection-wallet" aria-label={`${numberFormat.format(progress.coins ?? 0)} moedas`}>
              <img src={`${APP_BASE}assets/ui/coin.webp`} alt="" aria-hidden="true" />
              <span>{numberFormat.format(progress.coins ?? 0)}</span>
            </div>
            <div className="phase-selection-wallet" aria-label={`${numberFormat.format(progress.diamonds ?? 0)} diamantes`}>
              <img src={`${APP_BASE}assets/ui/diamond.webp`} alt="" aria-hidden="true" />
              <span>{numberFormat.format(progress.diamonds ?? 0)}</span>
            </div>
          </div>

          <nav className="phase-selection-navigation" aria-label="Navegação do seletor">
            <button type="button" className="phase-selection-back" onClick={onBack} aria-label="Voltar ao menu">Menu</button>
            <button type="button" className="phase-selection-settings" onClick={onSettings} aria-label="Abrir configurações" title="Configurações">
              <img src={getMenuAssetUrl("settings.webp", APP_BASE)} alt="" aria-hidden="true" />
            </button>
            <button type="button" className="phase-selection-laboratory" onClick={() => onCommandRoom(planet.id, selectedStageId)} aria-label="Abrir Laboratório" title="Laboratório">
              <img src={getMenuAssetUrl("laboratory.webp", APP_BASE)} alt="" aria-hidden="true" />
            </button>
          </nav>
        </header>

        <ol className="phase-selection-stages" aria-label={`Fases de ${planet.name}`}>
          {model.stages.map((stage, stageIndex) => {
            const [x, y] = STAGE_POSITIONS[planet.id]?.[stageIndex] ?? [0, 0];
            const current = activeStage?.id === stage.id;
            return (
              <li
                key={stage.id}
                className={`phase-selection-stage${stage.status ? ` is-${stage.status}` : ""}${current ? " is-current" : ""}${selectedStageId === stage.id ? " is-selected" : ""}${completedStageId === stage.id ? " is-completing" : ""}`}
                style={{
                  "--stage-x": `${(x / PANEL_WIDTH) * 100}%`,
                  "--stage-y": `${(y / PANEL_HEIGHT) * 100}%`,
                }}
              >
                <button
                  ref={stage.id === orbitStage?.id ? activeStageElementRef : undefined}
                  type="button"
                  className="phase-selection-stage__button"
                  disabled={!stage.available}
                  aria-current={current ? "step" : undefined}
                  aria-pressed={selectedStageId === stage.id}
                  aria-label={`${planet.name}, fase ${stageIndex + 1}, ${stageStatusLabel(stage)}, ${selectedStageId === stage.id ? "selecionada, clique novamente para entrar" : "clique para selecionar"}`}
                  onClick={(event) => launchStage(stage.id, event.currentTarget)}
                >
                  <img
                    className="phase-selection-stage__frame"
                    src={`${APP_BASE}assets/levels/${LEVEL_ASSET_PLANET[planet.id]}/${LEVEL_ASSET_PLANET[planet.id]}_${stageIndex + 1}.png`}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
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
          onClick={() => previousPlanet && selectPlanet(previousPlanet.id)}
          aria-label={canGoBack ? `Planeta anterior: ${previousPlanet.name}` : "Não há planeta anterior desbloqueado"}
        >
          <img src={`${APP_BASE}assets/ui/level-frames/arrow-left.webp`} alt="" aria-hidden="true" draggable="false" />
        </button>
        <button
          type="button"
          className="phase-selection-arrow phase-selection-arrow--right"
          disabled={!canGoForward}
          onClick={() => nextPlanet && canGoForward && selectPlanet(nextPlanet.id)}
          aria-label={canGoForward ? `Próximo planeta: ${nextPlanet.name}` : "Conclua todas as fases para desbloquear o próximo planeta"}
        >
          <img src={`${APP_BASE}assets/ui/level-frames/arrow-right.webp`} alt="" aria-hidden="true" draggable="false" />
        </button>
        {completedStageId && planet.stages.some((stage) => stage.id === completedStageId) ? (
          <p className="phase-completion-title" role="status" aria-live="polite">FASE CONCLUÍDA</p>
        ) : null}
        <p className="visually-hidden" aria-live="polite">{model.progressLabel}</p>
      </div>
    </main>
  );
}
