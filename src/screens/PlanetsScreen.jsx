import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { GameIcon } from "../components/GameIcon.jsx";
import { MuteButton } from "../components/MuteButton.jsx";
import { PLANETS } from "../game/data/planets.js";
import { EARTH_TUTORIAL_STAGE_ID } from "../game/data/missionIntro.js";
import { playGameSound } from "../game/audio/audioManager.js";
import { getPendingLaboratoryStage, hasLaboratoryAttention } from "../utils/laboratoryProgress.js";
import { canNavigateToPlanet, getInitialExpandedPlanetId, getOrbitStage, getPlanetIdForStage, getPlanetSelectorModel, getStageClickAction } from "./planetSelectorModel.js";
import { getMenuAssetUrl } from "./menuModel.js";
import { getPauseAssetUrl, RETURN_ICON_FILE } from "./pauseModel.js";
import { setOrbitTargetElement } from "./rocketOrbit.js";
import { StorageEntryButton } from "./StorageEntryButton.jsx";
import { PhaseSelectionGuide } from "./PhaseSelectionGuide.jsx";

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
  earth: [[99, 156], [236, 183], [373, 158]],
  mars: [[99, 160], [236, 182], [373, 154]],
  saturn: [[99, 162], [236, 184], [373, 157]],
  neptune: [[99, 151], [236, 183], [373, 162]],
};

const stageStatusLabel = (stage) => {
  if (stage.completed) return "concluída";
  if (stage.progressPercent > 0) return `${stage.progressPercent}% concluída, fase atual`;
  return stage.available ? "fase atual, disponível" : "bloqueada";
};

export function PlanetsScreen({ progress, completedStageId, preferredPlanetId, preferredStageId, onBack, onPlay, onPlayEndless,
  onMarkPlanetSeen, onSettings, muted, onToggleMute, onCommandRoom, onSelectionChange, reducedMotion, selectionGuide, storageButtonRef, onStorage }) {
  const validPreferredPlanetId = PLANETS.some(({ id }) => id === preferredPlanetId) ? preferredPlanetId : null;
  const initialPlanetId = validPreferredPlanetId ?? getPlanetIdForStage(completedStageId) ?? getInitialExpandedPlanetId(progress) ?? PLANETS[0]?.id ?? null;
  const initialStageId = PLANETS.find(({ id }) => id === initialPlanetId)?.stages.some(({ id }) => id === preferredStageId)
    ? preferredStageId
    : null;
  const [selectedPlanetId, setSelectedPlanetId] = useState(initialPlanetId);
  const [selectedStageId, setSelectedStageId] = useState(initialStageId);
  const [endlessSelected, setEndlessSelected] = useState(false);
  const [revealingPlanetId, setRevealingPlanetId] = useState(null);
  const [hoveredSelector, setHoveredSelector] = useState(false);
  const [selectionPulse, setSelectionPulse] = useState(0);
  const discoveryHandled = useRef(new Set(progress.seenPlanetIds ?? []));
  const activeStageElementRef = useRef(null);
  const firstStageRef = useRef(null);
  const laboratoryButtonRef = useRef(null);
  const planet = PLANETS.find(({ id }) => id === selectedPlanetId) ?? PLANETS[0];
  const model = getPlanetSelectorModel(planet, progress);
  const laboratoryAttention = hasLaboratoryAttention(progress);
  const planetIndex = PLANETS.findIndex(({ id }) => id === planet.id);
  const previousPlanet = PLANETS[planetIndex - 1];
  const nextPlanet = PLANETS[planetIndex + 1];
  const numberFormat = new Intl.NumberFormat("pt-BR");
  const endlessRecord = `Recorde: ${numberFormat.format(model.endless.highScore)} pts`;
  const endlessLabel = model.endless.unlocked
    ? `${endlessRecord}. ${endlessSelected ? "Ative novamente para jogar." : "Ative para selecionar."}`
    : `${endlessRecord}. Conclua as três fases para desbloquear.`;

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
  const orbitStage = getOrbitStage(model.stages, selectedStageId);
  const showFirstStageHint = selectionGuide === "first-flight" && planet.id === "earth" && !progress.onboarding?.earthTutorialSeen;
  const showLaboratoryGuide = selectionGuide === "laboratory" && planet.id === "earth" && getPendingLaboratoryStage(planet, progress) !== null;
  const baseClass = `phase-selection-canvas phase-selection-canvas--${planet.id}${revealingPlanetId === planet.id ? " is-revealing" : ""}`;

  const launchStage = (stageId, targetElement) => {
    setEndlessSelected(false);
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
    setRevealingPlanetId(null);
    setEndlessSelected(false);
    setSelectedStageId(null);
    setSelectedPlanetId(planetId);
    onSelectionChange?.(planetId, null);
  };

  const selectEndless = () => {
    if (endlessSelected) {
      onPlayEndless(planet.id);
      return;
    }
    setSelectedStageId(null);
    setEndlessSelected(true);
    onSelectionChange?.(planet.id, null);
    setSelectionPulse((pulse) => pulse + 1);
  };

  return (
    <main className="phase-selection-screen" aria-label={`Seleção de fases: ${planet.name}`}>
      <div
        className={baseClass}
        onAnimationEnd={(event) => {
          if (event.animationName === "planet-discovery-color") setRevealingPlanetId(null);
        }}
        onPointerEnter={() => setHoveredSelector(true)}
        onPointerLeave={() => setHoveredSelector(false)}
      >
        <img
          key={planet.id}
          className="phase-selection-background"
          src={`${APP_BASE}assets/ui/planets/${planet.id}.webp`}
          alt=""
          draggable="false"
          aria-hidden="true"
        />
        <img
          className="phase-selection-route"
          src={`${APP_BASE}assets/ui/planets/${planet.id}-route.webp`}
          alt=""
          draggable="false"
        />
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
            <div className="phase-selection-wallet" aria-label={`${numberFormat.format(progress.gold.total)} moedas de ouro`}>
              <img src={`${APP_BASE}assets/ui/coin.webp`} alt="" aria-hidden="true" />
              <span>{numberFormat.format(progress.gold.total)}</span>
            </div>
            <StorageEntryButton gold={progress.gold} buttonRef={storageButtonRef} onClick={() => onStorage(planet.id, selectedStageId)} />
          </div>

          <nav className="phase-selection-navigation" aria-label="Navegação do seletor">
            <button type="button" className="phase-selection-back" onClick={onBack} aria-label="Voltar ao menu" title="Voltar ao menu">
              <img src={getPauseAssetUrl(RETURN_ICON_FILE, APP_BASE)} alt="" />
            </button>
            <MuteButton muted={muted} onToggle={onToggleMute} />
            <button type="button" className="phase-selection-settings" onClick={onSettings} aria-label="Abrir configurações" title="Configurações">
              <img src={getMenuAssetUrl("settings.webp", APP_BASE)} alt="" aria-hidden="true" />
            </button>
            <button type="button" className="phase-selection-laboratory" onClick={() => onCommandRoom(planet.id, selectedStageId)}
              ref={laboratoryButtonRef} autoFocus={showLaboratoryGuide} aria-label="Abrir Laboratório"
              aria-describedby={showLaboratoryGuide ? "phase-selection-guide-hint" : laboratoryAttention ? "laboratory-attention" : undefined} title="Laboratório">
              <img src={getMenuAssetUrl("laboratory.webp", APP_BASE)} alt="" aria-hidden="true" />
              {laboratoryAttention ? (
                <>
                  <img className="phase-selection-laboratory__notice" src={`${APP_BASE}assets/ui/laboratory-notice.webp`} alt="" />
                  <span id="laboratory-attention" className="visually-hidden">Há novidades ou cuidados no laboratório.</span>
                </>
              ) : null}
            </button>
          </nav>
        </header>

        <ol className="phase-selection-stages" aria-label={`Fases de ${planet.name}`}>
          {model.stages.map((stage, stageIndex) => {
            const [x, y] = STAGE_POSITIONS[planet.id]?.[stageIndex] ?? [0, 0];
            const current = activeStage?.id === stage.id;
            const guided = showFirstStageHint && stage.id === EARTH_TUTORIAL_STAGE_ID;
            return (
              <li
                key={stage.id}
                ref={guided ? firstStageRef : undefined}
                className={`phase-selection-stage${stage.status ? ` is-${stage.status}` : ""}${current ? " is-current" : ""}${selectedStageId === stage.id ? " is-selected" : ""}${completedStageId === stage.id ? " is-completing" : ""}`}
                style={{
                  "--stage-x": `${(x / PANEL_WIDTH) * 100}%`,
                  "--stage-y": `${(y / PANEL_HEIGHT) * 100}%`,
                }}
              >
                <button
                  ref={!endlessSelected && stage.id === orbitStage?.id ? activeStageElementRef : undefined}
                  type="button"
                  className="phase-selection-stage__button"
                  disabled={!stage.available}
                  autoFocus={guided}
                  aria-current={current ? "step" : undefined}
                  aria-describedby={guided ? "phase-selection-guide-hint" : undefined}
                  aria-pressed={selectedStageId === stage.id}
                  aria-label={`${planet.name}, fase ${stageIndex + 1}, ${stageStatusLabel(stage)}, ${selectedStageId === stage.id ? "selecionada, clique novamente para entrar" : "clique para selecionar"}`}
                  onClick={(event) => launchStage(stage.id, event.currentTarget)}
                >
                  <img
                    className="phase-selection-stage__frame"
                    src={`${APP_BASE}assets/levels/${LEVEL_ASSET_PLANET[planet.id]}/${LEVEL_ASSET_PLANET[planet.id]}_${stageIndex + 1}.webp`}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
                  {stage.completed && <GameIcon name="check" className="phase-selection-stage__check" />}
                  {stage.progressPercent > 0 && !stage.completed && (
                    <span className="phase-selection-stage__progress" aria-hidden="true">{stage.progressPercent}%</span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="phase-selection-endless-slot"
          style={{ "--endless-anchor": `${STAGE_POSITIONS[planet.id][1][1] / PANEL_HEIGHT * 100}%` }}>
          <button
            type="button"
            className="phase-selection-endless"
            ref={endlessSelected ? activeStageElementRef : undefined}
            disabled={!model.endless.unlocked}
            aria-pressed={endlessSelected}
            aria-describedby="endless-description"
            onClick={selectEndless}
          >
            <img src={`${APP_BASE}assets/ui/${planet.endlessIcon}`} alt="" draggable="false" />
            <span>Modo infinito</span>
            <span className="phase-selection-endless-score" aria-hidden="true">{endlessRecord}</span>
          </button>
          <span id="endless-description" className="visually-hidden">{endlessLabel}</span>
        </div>

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
        <p className="visually-hidden" aria-live="polite">{model.progressLabel}</p>
        {showFirstStageHint ? (
          <PhaseSelectionGuide kind="stage" targetRef={firstStageRef} message={selectedStageId === EARTH_TUTORIAL_STAGE_ID
            ? "Selecione de novo para decolar!" : "Selecione o Nível 1 da Terra!"} />
        ) : null}
        {showLaboratoryGuide ? (
          <PhaseSelectionGuide kind="laboratory" targetRef={laboratoryButtonRef} message="Abra o Laboratório para cuidar da planta!" />
        ) : null}
      </div>
    </main>
  );
}
