import { useCallback, useEffect, useRef, useState } from "react";
import { SCREEN } from "./utils/screenStates.js";
import { validateCatalog } from "./game/data/catalog.js";
import { PROJECT_IMAGES } from "./game/data/projectImages.js";
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
import { configureAudio, pauseMenuAudio, playGameSound, startMenuAudio } from "./game/audio/audioManager.js";
import { preloadImages } from "./utils/preloadImages.js";
import { getSettingsReturnPage } from "./screens/menuModel.js";
import { DebugMenu } from "./screens/DebugMenu.jsx";
import { addDebugCurrency, completeDebugStage, isDebugShortcut, unlockAllPlanets } from "./utils/debugTools.js";
import { FullscreenButton } from "./components/FullscreenButton.jsx";

const APP_BASE = import.meta.env.BASE_URL;
const PROJECT_IMAGE_URLS = PROJECT_IMAGES.map((image) => `${APP_BASE}${image.slice(1)}`);

export default function App() {
  const { progress, warning, fatal, patchSettings, persist } = usePersistentProgress();
  const [screen, setScreen] = useState(SCREEN.BOOT);
  const [menuPage, setMenuPage] = useState(SCREEN.MENU);
  const [settingsReturnPage, setSettingsReturnPage] = useState(SCREEN.MENU);
  const [bootError, setBootError] = useState(null);
  const [assetProgress, setAssetProgress] = useState({ total: PROJECT_IMAGE_URLS.length, loaded: 0, failed: 0, completed: 0 });
  const [assetsReady, setAssetsReady] = useState(false);
  const [run, setRun] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [pauseSettingsOpen, setPauseSettingsOpen] = useState(false);
  const [outcomeSnapshot, setOutcomeSnapshot] = useState(null);
  const [outcomeRewards, setOutcomeRewards] = useState(null);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const hudRef = useRef(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const debugReturnScreen = useRef(SCREEN.MENU);
  const pressedKeys = useRef(new Set());

  useEffect(() => {
    let active = true;
    preloadImages(PROJECT_IMAGE_URLS, {
      onProgress: (nextProgress) => {
        if (active) setAssetProgress(nextProgress);
      },
    }).then(() => {
      if (active) setAssetsReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const isEditableTarget = (target) => target instanceof HTMLElement
      && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    const openDebug = () => {
      if (debugOpen) {
        setDebugOpen(false);
        setScreen(debugReturnScreen.current);
        return;
      }
      debugReturnScreen.current = screen;
      if (screen === SCREEN.PLAYING) setScreen(SCREEN.PAUSED);
      setDebugOpen(true);
    };
    const onKeyDown = (event) => {
      if (event.repeat || isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key !== "q" && key !== "p") return;
      pressedKeys.current.add(key);
      if (isDebugShortcut(pressedKeys.current) && progress && screen !== SCREEN.BOOT && screen !== SCREEN.ERROR) {
        event.preventDefault();
        openDebug();
      }
    };
    const onKeyUp = (event) => pressedKeys.current.delete(event.key.toLowerCase());
    const onBlur = () => pressedKeys.current.clear();
    const onEscape = (event) => {
      if (event.key !== "Escape" || !debugOpen) return;
      event.preventDefault();
      setDebugOpen(false);
      setScreen(debugReturnScreen.current);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onEscape);
    };
  }, [debugOpen, progress, screen]);

  useEffect(() => {
    if (!progress || !assetsReady || screen !== SCREEN.BOOT) return undefined;
    const catalogErrors = validateCatalog();
    if (catalogErrors.length) {
      setBootError(catalogErrors.join(" "));
      setScreen(SCREEN.ERROR);
      return undefined;
    }
    const timer = window.setTimeout(() => setScreen(SCREEN.MENU), 250);
    return () => window.clearTimeout(timer);
  }, [assetsReady, progress, screen]);

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
    if (!progress || screen === SCREEN.BOOT || screen === SCREEN.PLAYING || screen === SCREEN.ERROR) {
      pauseMenuAudio();
      return undefined;
    }
    startMenuAudio();
    return pauseMenuAudio;
  }, [screen, Boolean(progress)]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setSystemReducedMotion(preference.matches);
    updateMotionPreference();
    preference.addEventListener?.("change", updateMotionPreference);
    return () => preference.removeEventListener?.("change", updateMotionPreference);
  }, []);

  const startStage = (planetId, stageId) => {
    setDebugOpen(false);
    setPauseSettingsOpen(false);
    setRun({ planetId, stageId });
    setOutcomeSnapshot(null);
    setOutcomeRewards(null);
    hudRef.current = null;
    setScreen(SCREEN.PLAYING);
  };

  const debugUpdateProgress = (update) => persist(update(progress));
  const debugCompleteStage = (planetId, stageId) => {
    try {
      debugUpdateProgress((current) => completeDebugStage(current, planetId, stageId));
    } catch (error) {
      console.error(error);
    }
  };

  const markPlanetSeen = useCallback((planetId) => {
    if (!progress || progress.seenPlanetIds?.includes(planetId)) return;
    persist({
      ...progress,
      seenPlanetIds: [...(progress.seenPlanetIds ?? []), planetId],
    });
  }, [persist, progress]);

  const goMenu = () => {
    setPauseSettingsOpen(false);
    setRun(null);
    setOutcomeSnapshot(null);
    setOutcomeRewards(null);
    setMenuPage(SCREEN.MENU);
    setScreen(SCREEN.MENU);
  };

  const onPause = useCallback(() => {
    setPauseSettingsOpen(false);
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

  const openSettings = () => {
    setSettingsReturnPage(getSettingsReturnPage(menuPage, SCREEN));
    setMenuPage(SCREEN.SETTINGS);
  };

  if (fatal || screen === SCREEN.ERROR) {
    return <><FullscreenButton /><ErrorScreen message={fatal || bootError || "Erro ao iniciar o RocketBloom."} onRetry={() => window.location.reload()} /></>;
  }
  if (!progress || screen === SCREEN.BOOT) return <><FullscreenButton /><BootScreen progress={assetProgress} baseUrl={APP_BASE} /></>;

  const planet = run ? getPlanetById(run.planetId) : null;
  return (
    <>
    <FullscreenButton />
    <div className={`app-shell ${progress.settings.reducedMotion || systemReducedMotion ? "motion-reduced" : ""}`}>
      {screen === SCREEN.MENU && (menuPage === SCREEN.MENU || menuPage === SCREEN.SETTINGS) ? (
        <MenuScreen
          progress={progress}
          warning={warning}
          onPlay={() => setMenuPage(SCREEN.PLANETS)}
          onSettings={openSettings}
        />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.PLANETS ? (
        <PlanetsScreen
          progress={progress}
          onBack={() => setMenuPage(SCREEN.MENU)}
          onPlay={startStage}
          onMarkPlanetSeen={markPlanetSeen}
          onSettings={openSettings}
          onCommandRoom={() => setMenuPage(SCREEN.COMMAND)}
        />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.SETTINGS ? (
        <SettingsScreen progress={progress} onBack={() => setMenuPage(settingsReturnPage)} onChange={patchSettings} />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.COMMAND ? (
        <CommandRoomScreen progress={progress} onBack={() => setMenuPage(SCREEN.MENU)} />
      ) : null}

      {run && (screen === SCREEN.PLAYING || screen === SCREEN.PAUSED || screen === SCREEN.DEFEAT) ? (
        <PlayScreen
          key={runKey}
          planetId={run.planetId}
          stageId={run.stageId}
          controlMode={progress.settings.controlMode}
          reducedMotion={progress.settings.reducedMotion || systemReducedMotion}
          showHitboxes={progress.settings.showHitboxes}
          paused={screen !== SCREEN.PLAYING}
          showHud={screen !== SCREEN.DEFEAT}
          onPause={onPause}
          onHudRef={hudRef}
          onOutcome={onOutcome}
        />
      ) : null}
      {screen === SCREEN.PAUSED ? (
        <PauseOverlay
          onResume={() => { setPauseSettingsOpen(false); setScreen(SCREEN.PLAYING); }}
          onQuit={goMenu}
          onSettings={() => setPauseSettingsOpen(true)}
          onTapRocket={() => playGameSound("angryTouch")}
          reducedMotion={progress.settings.reducedMotion || systemReducedMotion}
          settingsOpen={pauseSettingsOpen}
        />
      ) : null}
      {screen === SCREEN.PAUSED && pauseSettingsOpen ? (
        <SettingsScreen progress={progress} onBack={() => setPauseSettingsOpen(false)} onChange={patchSettings} />
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
          onRetry={() => {
            if (run) { setRunKey((value) => value + 1); startStage(run.planetId, run.stageId); }
          }}
        />
      ) : null}
      {debugOpen ? (
        <DebugMenu
          progress={progress}
          run={run}
          onClose={() => { setDebugOpen(false); setScreen(debugReturnScreen.current); }}
          onChange={patchSettings}
          onGrant={(currency, amount) => debugUpdateProgress((current) => addDebugCurrency(current, currency, amount))}
          onUnlockAll={() => debugUpdateProgress(unlockAllPlanets)}
          onCompleteStage={debugCompleteStage}
          onStartStage={startStage}
        />
      ) : null}
    </div>
    </>
  );
}
