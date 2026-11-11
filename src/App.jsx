import { useCallback, useEffect, useRef, useState } from "react";
import { SCREEN } from "./utils/screenStates.js";
import { validateCatalog } from "./game/data/catalog.js";
import { PROJECT_IMAGES } from "./game/data/projectImages.js";
import { getPlanetById } from "./game/data/planets.js";
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
import { hasLoadedAllImages, preloadImages } from "./utils/preloadImages.js";
import { getSettingsReturnPage } from "./screens/menuModel.js";
import { DebugMenu } from "./screens/DebugMenu.jsx";
import { addDebugCurrency, completeDebugStage, isDebugShortcut, unlockAllPlanets, uncompleteDebugStage } from "./utils/debugTools.js";
import { FullscreenButton } from "./components/FullscreenButton.jsx";
import { getOutcomeReturn } from "./utils/outcomeFlow.js";

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
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [completionStageId, setCompletionStageId] = useState(null);
  const hudRef = useRef(null);
  const debugEngineRef = useRef(null);
  const setDebugEngineRef = useCallback((engine) => { debugEngineRef.current = engine; }, []);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugControls, setDebugControls] = useState({ speed: 120, godmode: false, stageDurationMs: null });
  const debugReturnScreen = useRef(SCREEN.MENU);
  const pressedKeys = useRef(new Set());

  useEffect(() => {
    let active = true;
    preloadImages(PROJECT_IMAGE_URLS, {
      onProgress: (nextProgress) => {
        if (active) setAssetProgress(nextProgress);
      },
    }).then((result) => {
      if (!active) return;
      if (!hasLoadedAllImages(result)) {
        setBootError(`${result.failed} imagem(ns) não puderam ser carregadas. Verifique sua conexão e tente novamente.`);
        setScreen(SCREEN.ERROR);
        return;
      }
      setAssetsReady(true);
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
      const snapshot = debugEngineRef.current?.getSnapshot();
      setDebugControls({
        speed: snapshot?.speed ?? 120,
        godmode: snapshot?.godmode ?? false,
        stageDurationMs: snapshot?.stageDurationMs ?? null,
      });
      if (screen === SCREEN.PLAYING) setScreen(SCREEN.PAUSED);
      setDebugOpen(true);
    };
    const onKeyDown = (event) => {
      if (event.repeat || isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key !== "q" && key !== "p") return;
      pressedKeys.current.add(key);
      if (isDebugShortcut(pressedKeys.current) && progress) {
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
    if (screen !== SCREEN.VICTORY) return undefined;
    const timer = window.setTimeout(() => {
      const destination = getOutcomeReturn("victory", outcomeSnapshot);
      setRun(null);
      setMenuPage(destination.menuPage);
      setCompletionStageId(destination.completedStageId);
      setScreen(SCREEN.MENU);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [outcomeSnapshot, screen]);

  useEffect(() => {
    if (!completionStageId) return undefined;
    const timer = window.setTimeout(() => setCompletionStageId(null), 2800);
    return () => window.clearTimeout(timer);
  }, [completionStageId]);

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
    setCompletionStageId(null);
    setDebugOpen(false);
    setPauseSettingsOpen(false);
    setRun({ planetId, stageId });
    setOutcomeSnapshot(null);
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
  const debugUncompleteStage = (planetId, stageId) => {
    try {
      debugUpdateProgress((current) => uncompleteDebugStage(current, planetId, stageId));
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
    setCompletionStageId(null);
    setPauseSettingsOpen(false);
    setRun(null);
    setOutcomeSnapshot(null);
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
    }
    setOutcomeSnapshot(snapshot ?? null);
    setScreen(outcome === "victory" ? SCREEN.VICTORY : SCREEN.DEFEAT);
  }, [persist, progress]);

  const openSettings = () => {
    setSettingsReturnPage(getSettingsReturnPage(menuPage, SCREEN));
    setMenuPage(SCREEN.SETTINGS);
  };

  const closeDebug = () => {
    setDebugOpen(false);
    setScreen(debugReturnScreen.current);
  };

  const navigateDebugScreen = (destination) => {
    setDebugOpen(false);
    setPauseSettingsOpen(false);
    setCompletionStageId(null);
    if ([SCREEN.MENU, SCREEN.PLANETS, SCREEN.COMMAND, SCREEN.SETTINGS].includes(destination)) {
      setRun(null);
      setOutcomeSnapshot(null);
      setMenuPage(destination);
      if (destination === SCREEN.SETTINGS) setSettingsReturnPage(SCREEN.MENU);
      setScreen(SCREEN.MENU);
      return;
    }
    if (destination === SCREEN.PLAYING || destination === SCREEN.PAUSED) {
      const nextRun = run ?? { planetId: "earth", stageId: "earth-1" };
      if (screen === SCREEN.DEFEAT || screen === SCREEN.VICTORY) setRunKey((value) => value + 1);
      setRun(nextRun);
      setOutcomeSnapshot(null);
      setScreen(destination);
      return;
    }
    setRun((current) => current ?? { planetId: "earth", stageId: "earth-1" });
    setOutcomeSnapshot(null);
    setScreen(destination);
  };

  const debugMenu = debugOpen && progress ? (
    <DebugMenu
      progress={progress}
      run={run}
      controls={debugControls}
      onClose={closeDebug}
      onChange={patchSettings}
      onGrant={(currency, amount) => debugUpdateProgress((current) => addDebugCurrency(current, currency, amount))}
      onUnlockAll={() => debugUpdateProgress(unlockAllPlanets)}
      onCompleteStage={debugCompleteStage}
      onUncompleteStage={debugUncompleteStage}
      onStartStage={startStage}
      onSetSpeed={(speed) => { debugEngineRef.current?.setDebugSpeed(speed); setDebugControls((current) => ({ ...current, speed })); }}
      onSetGodmode={(godmode) => { debugEngineRef.current?.setDebugGodmode(godmode); setDebugControls((current) => ({ ...current, godmode })); }}
      onSetDuration={(durationMs) => { debugEngineRef.current?.setDebugDuration(durationMs); setDebugControls((current) => ({ ...current, stageDurationMs: durationMs || Infinity })); }}
      onGrantPowerUp={(power) => debugEngineRef.current?.grantDebugPowerUp(power)}
      onNavigate={navigateDebugScreen}
    />
  ) : null;

  if (fatal || screen === SCREEN.ERROR) {
    return <><FullscreenButton /><ErrorScreen message={fatal || bootError || "Erro ao iniciar o RocketBloom."} onRetry={() => window.location.reload()} />{debugMenu}</>;
  }
  if (!progress || screen === SCREEN.BOOT) return <><FullscreenButton /><BootScreen progress={assetProgress} baseUrl={APP_BASE} />{debugMenu}</>;

  const planet = run ? getPlanetById(run.planetId) : null;
  return (
    <>
    <FullscreenButton hidden={screen === SCREEN.MENU && menuPage === SCREEN.COMMAND} />
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
          completedStageId={completionStageId}
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
        <CommandRoomScreen
          progress={progress}
          onBack={() => setMenuPage(SCREEN.MENU)}
          onSettings={openSettings}
        />
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
          onEngineRef={setDebugEngineRef}
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
        <VictoryScreen />
      ) : null}
      {screen === SCREEN.DEFEAT ? (
        <DefeatScreen
          onRetry={() => {
            if (run) { setRunKey((value) => value + 1); startStage(run.planetId, run.stageId); }
          }}
        />
      ) : null}
      {debugMenu}
    </div>
    </>
  );
}
