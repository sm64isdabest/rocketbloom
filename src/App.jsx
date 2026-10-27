import { useCallback, useEffect, useRef, useState } from "react";
import { SCREEN } from "./utils/screenStates.js";
import { validateCatalog } from "./game/data/catalog.js";
import { PLANETS, getPlanetById, getFirstStage } from "./game/data/planets.js";
import { usePersistentProgress } from "./hooks/usePersistentProgress.js";
import { applyRunOutcome } from "./utils/runProgress.js";
import { BootScreen } from "./screens/BootScreen.jsx";
import { ErrorScreen } from "./screens/ErrorScreen.jsx";
import { MenuScreen } from "./screens/MenuScreen.jsx";
import { PlanetsScreen } from "./screens/PlanetsScreen.jsx";
import { SettingsScreen } from "./screens/SettingsScreen.jsx";
import { CommandRoomScreen } from "./screens/CommandRoomScreen.jsx";
import { PlayScreen } from "./screens/PlayScreen.jsx";
import { PauseOverlay } from "./screens/PauseOverlay.jsx";
import { VictoryScreen } from "./screens/VictoryScreen.jsx";
import { DefeatScreen } from "./screens/DefeatScreen.jsx";
import { configureAudio } from "./game/audio/audioManager.js";

export default function App() {
  const { progress, warning, fatal, patchSettings, persist } = usePersistentProgress();
  const [screen, setScreen] = useState(SCREEN.BOOT);
  const [menuPage, setMenuPage] = useState(SCREEN.MENU);
  const [bootError, setBootError] = useState(null);
  const [run, setRun] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [outcomeSnapshot, setOutcomeSnapshot] = useState(null);
  const [outcomeRewards, setOutcomeRewards] = useState(null);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const hudRef = useRef(null);

  useEffect(() => {
    if (!progress || screen !== SCREEN.BOOT) return undefined;
    const catalogErrors = validateCatalog();
    if (catalogErrors.length) {
      setBootError(catalogErrors.join(" "));
      setScreen(SCREEN.ERROR);
      return undefined;
    }
    const timer = window.setTimeout(() => setScreen(SCREEN.MENU), 450);
    return () => window.clearTimeout(timer);
  }, [progress, screen]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, menuPage, runKey]);

  useEffect(() => {
    if (progress) configureAudio(progress.settings);
  }, [
    progress?.settings?.music,
    progress?.settings?.soundEffects,
    progress?.settings?.musicVolume,
    progress?.settings?.soundEffectsVolume,
  ]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setSystemReducedMotion(preference.matches);
    updateMotionPreference();
    preference.addEventListener?.("change", updateMotionPreference);
    return () => preference.removeEventListener?.("change", updateMotionPreference);
  }, []);

  const startStage = (planetId, stageId) => {
    setRun({ planetId, stageId });
    setOutcomeSnapshot(null);
    setOutcomeRewards(null);
    hudRef.current = null;
    setScreen(SCREEN.PLAYING);
  };

  const goMenu = () => {
    setRun(null);
    setOutcomeSnapshot(null);
    setOutcomeRewards(null);
    setMenuPage(SCREEN.MENU);
    setScreen(SCREEN.MENU);
  };

  const onPause = useCallback(() => {
    setScreen((current) => (current === SCREEN.PLAYING ? SCREEN.PAUSED : current));
  }, []);

  const onOutcome = useCallback((outcome, snapshot) => {
    if (snapshot) {
      const applied = applyRunOutcome(progress, snapshot, outcome);
      if (!applied.alreadyApplied) persist(applied.progress);
      setOutcomeRewards(applied.rewards);
    }
    setOutcomeSnapshot(snapshot ?? null);
    setScreen(outcome === "victory" ? SCREEN.VICTORY : SCREEN.DEFEAT);
  }, [persist, progress]);

  if (fatal || screen === SCREEN.ERROR) {
    return <ErrorScreen message={fatal || bootError || "Erro ao iniciar o RocketBloom."} onRetry={() => window.location.reload()} />;
  }
  if (!progress || screen === SCREEN.BOOT) return <BootScreen />;

  const planet = run ? getPlanetById(run.planetId) : null;
  return (
    <div className={`app-shell ${progress.settings.reducedMotion || systemReducedMotion ? "motion-reduced" : ""}`}>
      {screen === SCREEN.MENU && (menuPage === SCREEN.MENU || menuPage === SCREEN.SETTINGS) ? (
        <MenuScreen
          progress={progress}
          warning={warning}
          onPlay={() => setMenuPage(SCREEN.PLANETS)}
          onSettings={() => setMenuPage(SCREEN.SETTINGS)}
          onCommandRoom={() => setMenuPage(SCREEN.COMMAND)}
        />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.PLANETS ? (
        <PlanetsScreen progress={progress} onBack={() => setMenuPage(SCREEN.MENU)} onPlay={startStage} />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.SETTINGS ? (
        <SettingsScreen progress={progress} onBack={() => setMenuPage(SCREEN.MENU)} onChange={patchSettings} />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.COMMAND ? (
        <CommandRoomScreen progress={progress} onBack={() => setMenuPage(SCREEN.MENU)} />
      ) : null}

      {run && (screen === SCREEN.PLAYING || screen === SCREEN.PAUSED) ? (
        <PlayScreen
          key={runKey}
          planetId={run.planetId}
          stageId={run.stageId}
          controlMode={progress.settings.controlMode}
          reducedMotion={progress.settings.reducedMotion || systemReducedMotion}
          paused={screen === SCREEN.PAUSED}
          onPause={onPause}
          onHudRef={hudRef}
          onOutcome={onOutcome}
        />
      ) : null}
      {screen === SCREEN.PAUSED ? (
        <PauseOverlay
          onResume={() => setScreen(SCREEN.PLAYING)}
          onRestart={() => { setRunKey((value) => value + 1); startStage(run.planetId, run.stageId); }}
          onQuit={goMenu}
        />
      ) : null}
      {screen === SCREEN.VICTORY ? (
        <VictoryScreen
          planetName={planet?.name ?? "o planeta"}
          snapshot={outcomeSnapshot}
          rewards={outcomeRewards}
          onMenu={goMenu}
          onNext={() => {
            const nextStageIndex = planet?.stages.findIndex((stage) => stage.id === run?.stageId) + 1;
            const nextStage = planet?.stages[nextStageIndex];
            const currentIndex = PLANETS.findIndex((candidate) => candidate.id === planet?.id);
            const nextPlanet = PLANETS[currentIndex + 1];
            const firstStage = getFirstStage(nextPlanet);
            if (planet && nextStage) startStage(planet.id, nextStage.id);
            else if (nextPlanet && progress.unlockedPlanetIds.includes(nextPlanet.id) && firstStage) startStage(nextPlanet.id, firstStage.id);
            else if (nextPlanet) {
              setRun(null);
              setOutcomeSnapshot(null);
              setOutcomeRewards(null);
              setMenuPage(SCREEN.PLANETS);
              setScreen(SCREEN.MENU);
            } else goMenu();
          }}
        />
      ) : null}
      {screen === SCREEN.DEFEAT ? (
        <DefeatScreen
          snapshot={outcomeSnapshot}
          rewards={outcomeRewards}
          onRetry={() => {
            if (run) { setRunKey((value) => value + 1); startStage(run.planetId, run.stageId); }
          }}
          onMenu={goMenu}
        />
      ) : null}
    </div>
  );
}
