import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { preloadStorageAssets } from "./assets/storageAssets.js";
import { SCREEN } from "./utils/screenStates.js";
import { validateCatalog } from "./game/data/catalog.js";
import { PROJECT_IMAGES } from "./game/data/projectImages.js";
import { getPlanetById, getStageById } from "./game/data/planets.js";
import { usePersistentProgress } from "./hooks/usePersistentProgress.js";
import { applyRunOutcome } from "./utils/runProgress.js";
import { completeLaboratoryCare, getLaboratoryVisitPlanet, prepareLaboratoryVisit } from "./utils/laboratoryProgress.js";
import { acknowledgeGold, creditGold, creditNextGoldGoal } from "./utils/goldStorage.js";
import { BootScreen } from "./screens/BootScreen.jsx";
import { ErrorScreen } from "./screens/ErrorScreen.jsx";
import { MenuScreen } from "./screens/MenuScreen.jsx";
import { MissionIntroScreen } from "./screens/MissionIntroScreen.jsx";
import { EarthFlightTutorial } from "./screens/EarthFlightTutorial.jsx";
import { EARTH_TUTORIAL_STAGE_ID } from "./game/data/missionIntro.js";
import { PlanetsScreen } from "./screens/PlanetsScreen.jsx";
import { SettingsScreen } from "./screens/SettingsScreen.jsx";
import { CommandRoomScreen } from "./screens/CommandRoomScreen.jsx";
import { StorageScreen } from "./screens/StorageScreen.jsx";
import { PlayScreen } from "./screens/PlayScreen.jsx";
import { PauseOverlay } from "./screens/PauseOverlay.jsx";
import { VictoryScreen } from "./screens/VictoryScreen.jsx";
import { DefeatScreen } from "./screens/DefeatScreen.jsx";
import { configureAudio, finishGameAudio, pauseMenuAudio, playGameSound, playInterfaceSound, startMenuAudio } from "./game/audio/audioManager.js";
import { hasLoadedAllImages, preloadImages } from "./utils/preloadImages.js";
import { canPlayEndless } from "./screens/planetSelectorModel.js";
import { DebugMenu } from "./screens/DebugMenu.jsx";
import { addDebugCoins, completeDebugStage, isDebugShortcut, unlockAllPlanets, uncompleteDebugStage } from "./utils/debugTools.js";
import { FullscreenButton } from "./components/FullscreenButton.jsx";
import { getEquippedRocketCosmetics, ROCKET_COSMETICS } from "./game/config/goldConfig.js";
import { getOutcomeReturn } from "./utils/outcomeFlow.js";
import { initialNavigationContext, navigationContextReducer } from "./utils/navigationContext.js";

const APP_BASE = import.meta.env.BASE_URL;
const PROJECT_IMAGE_URLS = PROJECT_IMAGES.map((image) => `${APP_BASE}${image.slice(1)}`);
const FLIGHT_INTRO_MS = 1500;

export default function App() {
  const { progress, warning, fatal, patchSettings, persist, resetProgress } = usePersistentProgress();
  const [screen, setScreen] = useState(SCREEN.BOOT);
  const [menuPage, setMenuPage] = useState(SCREEN.MENU);
  const selectorStorageButton = useRef(null);
  const selectorGoldBalance = useRef(null);
  const [navigationContext, dispatchNavigationContext] = useReducer(navigationContextReducer, initialNavigationContext);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTrigger = useRef(null);
  const [bootError, setBootError] = useState(null);
  const [assetProgress, setAssetProgress] = useState({ total: PROJECT_IMAGE_URLS.length, loaded: 0, failed: 0, completed: 0 });
  const [assetsReady, setAssetsReady] = useState(false);
  const [run, setRun] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [outcomeSnapshot, setOutcomeSnapshot] = useState(null);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const reducedMotion = Boolean(progress?.settings.reducedMotion || systemReducedMotion);
  const muted = progress?.settings.muteAll === true;
  const [completionStageId, setCompletionStageId] = useState(null);
  const [laboratoryPlanetId, setLaboratoryPlanetId] = useState(null);
  const hudRef = useRef(null);
  const debugEngineRef = useRef(null);
  const setDebugEngineRef = useCallback((engine) => { debugEngineRef.current = engine; }, []);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugControls, setDebugControls] = useState({ speed: 120, godmode: false, stageDurationMs: null });
  const debugReturnScreen = useRef(SCREEN.MENU);
  const pressedKeys = useRef(new Set());

  useEffect(() => {
    let active = true;
    Promise.all([
      preloadImages(PROJECT_IMAGE_URLS, {
        onProgress: (nextProgress) => {
          if (active) setAssetProgress(nextProgress);
        },
      }),
      preloadStorageAssets().catch(() => null),
    ]).then(([result]) => {
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
      if (settingsOpen || document.querySelector("dialog[open]") || screen === SCREEN.FLIGHT_INTRO || screen === SCREEN.VICTORY_LAUNCH
        || event.repeat || isEditableTarget(event.target)) return;
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
  }, [debugOpen, progress, screen, settingsOpen]);

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
    if (screen !== SCREEN.FLIGHT_INTRO) return undefined;
    const finishIntro = () => {
      const destination = document.visibilityState === "hidden" ? SCREEN.PAUSED : SCREEN.PLAYING;
      setScreen((current) => current === SCREEN.FLIGHT_INTRO ? destination : current);
    };
    if (reducedMotion) {
      finishIntro();
      return undefined;
    }
    const timer = window.setTimeout(finishIntro, FLIGHT_INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, runKey, screen]);

  useEffect(() => {
    if (!completionStageId || screen !== SCREEN.MENU || menuPage !== SCREEN.PLANETS) return undefined;
    const timer = window.setTimeout(() => setCompletionStageId(null), 2800);
    return () => window.clearTimeout(timer);
  }, [completionStageId, menuPage, screen]);

  useEffect(() => {
    if (progress) configureAudio(progress.settings);
  }, [
    progress?.settings?.music,
    progress?.settings?.soundEffects,
    progress?.settings?.musicVolume,
    progress?.settings?.soundEffectsVolume,
    progress?.settings?.interfaceSounds,
    progress?.settings?.interfaceSoundsVolume,
    progress?.settings?.muteAll,
  ]);

  useEffect(() => {
    if (!progress || [SCREEN.BOOT, SCREEN.FLIGHT_TUTORIAL, SCREEN.FLIGHT_INTRO, SCREEN.PLAYING, SCREEN.VICTORY_LAUNCH, SCREEN.VICTORY, SCREEN.ERROR].includes(screen)) {
      pauseMenuAudio();
      return undefined;
    }
    startMenuAudio();
    return pauseMenuAudio;
  }, [screen, Boolean(progress)]);

  const victoryRunId = screen === SCREEN.VICTORY ? outcomeSnapshot?.runId : null;
  useEffect(() => {
    if (!victoryRunId) return undefined;
    const playVictory = () => finishGameAudio("victory");
    if (document.visibilityState !== "hidden") {
      playVictory();
      return undefined;
    }
    document.addEventListener("visibilitychange", playVictory, { once: true });
    return () => document.removeEventListener("visibilitychange", playVictory);
  }, [victoryRunId]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setSystemReducedMotion(preference.matches);
    updateMotionPreference();
    preference.addEventListener?.("change", updateMotionPreference);
    return () => preference.removeEventListener?.("change", updateMotionPreference);
  }, []);

  const startStage = (planetId, stageId, mode = "campaign") => {
    if (mode === "endless" && !canPlayEndless(getPlanetById(planetId), progress)) return;
    dispatchNavigationContext({ type: "start-run", planetId, stageId });
    setCompletionStageId(null);
    setDebugOpen(false);
    setSettingsOpen(false);
    setRun({ planetId, stageId, mode });
    setRunKey((value) => value + 1);
    setOutcomeSnapshot(null);
    hudRef.current = null;
    if (mode === "campaign" && stageId === EARTH_TUTORIAL_STAGE_ID && !progress.onboarding.earthTutorialSeen) {
      setScreen(SCREEN.FLIGHT_TUTORIAL);
      return;
    }
    setScreen(reducedMotion ? SCREEN.PLAYING : SCREEN.FLIGHT_INTRO);
  };

  const completeMissionIntro = () => {
    persist((current) => ({ ...current, onboarding: { ...current.onboarding, missionSeen: true } }));
    dispatchNavigationContext({ type: "select-stage", planetId: "earth", selectedStageId: null });
    setMenuPage(SCREEN.PLANETS);
  };

  const startTutorialFlight = (controlMode) => {
    persist((current) => ({
      ...current,
      onboarding: { ...current.onboarding, earthTutorialSeen: true },
      settings: { ...current.settings, controlMode },
    }));
    setScreen(reducedMotion ? SCREEN.PLAYING : SCREEN.FLIGHT_INTRO);
  };

  const exitTutorial = () => {
    dispatchNavigationContext({ type: "exit-run" });
    setRun(null);
    setMenuPage(SCREEN.PLANETS);
    setScreen(SCREEN.MENU);
  };

  const debugCompleteStage = (planetId, stageId) => {
    try {
      persist((current) => completeDebugStage(current, planetId, stageId));
    } catch (error) {
      console.error(error);
    }
  };
  const debugUncompleteStage = (planetId, stageId) => {
    try {
      persist((current) => uncompleteDebugStage(current, planetId, stageId));
    } catch (error) {
      console.error(error);
    }
  };

  const markPlanetSeen = useCallback((planetId) => {
    persist((current) => {
      if (current.seenPlanetIds.includes(planetId)) return current;
      return { ...current, seenPlanetIds: [...current.seenPlanetIds, planetId] };
    });
  }, [persist]);

  const updateGold = useCallback((update) => {
    persist((current) => {
      const gold = update(current.gold);
      return gold === current.gold ? current : { ...current, gold };
    });
  }, [persist]);

  const acknowledgeGoldDeposit = useCallback((total) => {
    updateGold((gold) => acknowledgeGold(gold, total));
  }, [updateGold]);

  const enterStorageFromSelector = (planetId, selectedStageId) => {
    dispatchNavigationContext({ type: "select-stage", planetId, selectedStageId });
    setMenuPage(SCREEN.STORAGE);
  };

  const closeStorage = () => {
    setMenuPage(SCREEN.PLANETS);
    window.requestAnimationFrame(() => selectorStorageButton.current?.focus({ preventScroll: true }));
  };

  const recordOutcome = useCallback((outcome, snapshot) => {
    if (!snapshot) return;
    persist((current) => applyRunOutcome(current, snapshot, outcome).progress);
  }, [persist]);

  const exitLevel = () => {
    recordOutcome("exit", debugEngineRef.current?.getSnapshot());
    dispatchNavigationContext({ type: "exit-run" });
    setCompletionStageId(null);
    setSettingsOpen(false);
    setRun(null);
    setOutcomeSnapshot(null);
    setMenuPage(SCREEN.PLANETS);
    setScreen(SCREEN.MENU);
  };

  const visitLaboratoryPlant = (planetId) => {
    persist((current) => prepareLaboratoryVisit(current, planetId));
  };

  const enterLaboratory = (planetId, selectedStageId) => {
    dispatchNavigationContext({ type: "open-laboratory", planetId, selectedStageId });
    const visitPlanet = getLaboratoryVisitPlanet(progress, planetId);
    setLaboratoryPlanetId(visitPlanet.id);
    visitLaboratoryPlant(visitPlanet.id);
    setMenuPage(SCREEN.COMMAND);
  };

  const finishLaboratoryCare = (planetId, stageId, gameId) => {
    persist((current) => completeLaboratoryCare(current, planetId, stageId, gameId));
    playGameSound("discovery");
  };

  const exitLaboratory = () => {
    dispatchNavigationContext({ type: "exit-laboratory" });
    setMenuPage(SCREEN.PLANETS);
  };

  const onPause = useCallback(() => {
    setScreen((current) => (current === SCREEN.PLAYING ? SCREEN.PAUSED : current));
  }, []);

  const onOutcome = useCallback((outcome, snapshot, { launching = false } = {}) => {
    recordOutcome(outcome, snapshot);
    setOutcomeSnapshot(snapshot ?? null);
    if (outcome === "victory") {
      setScreen(launching ? SCREEN.VICTORY_LAUNCH : SCREEN.VICTORY);
    } else {
      setScreen(SCREEN.DEFEAT);
    }
  }, [recordOutcome]);

  const finishVictoryLaunch = useCallback(() => {
    setScreen((current) => current === SCREEN.VICTORY_LAUNCH ? SCREEN.VICTORY : current);
  }, []);

  const returnFromResult = () => {
    const destination = getOutcomeReturn(screen === SCREEN.VICTORY ? "victory" : "defeat", outcomeSnapshot);
    dispatchNavigationContext({ type: "exit-run" });
    setRun(null);
    setOutcomeSnapshot(null);
    setMenuPage(destination.menuPage);
    setCompletionStageId(destination.completedStageId);
    setScreen(SCREEN.MENU);
  };

  const retryStage = () => {
    if (run) startStage(run.planetId, run.stageId, run.mode);
  };

  const openSettings = (event) => {
    settingsTrigger.current = event?.currentTarget ?? null;
    setSettingsOpen(true);
  };

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    window.requestAnimationFrame(() => settingsTrigger.current?.focus());
  }, []);

  const toggleMute = () => patchSettings({ muteAll: !muted });

  const resetCampaign = () => {
    const result = resetProgress();
    if (!result.ok) return result;
    selectorGoldBalance.current = null;
    debugEngineRef.current?.stop();
    hudRef.current = null;
    settingsTrigger.current = null;
    dispatchNavigationContext({ type: "reset" });
    setRun(null);
    setOutcomeSnapshot(null);
    setCompletionStageId(null);
    setDebugOpen(false);
    setSettingsOpen(false);
    setMenuPage(SCREEN.MISSION_INTRO);
    setScreen(SCREEN.MENU);
    return result;
  };

  const closeDebug = () => {
    setDebugOpen(false);
    setScreen(debugReturnScreen.current);
  };

  const navigateDebugScreen = (destination) => {
    setDebugOpen(false);
    if (destination === SCREEN.SETTINGS) {
      openSettings();
      return;
    }
    setSettingsOpen(false);
    setCompletionStageId(null);
    if (destination === SCREEN.STORAGE) {
      if (screen === SCREEN.PAUSED || screen === SCREEN.PLAYING) {
        recordOutcome("exit", debugEngineRef.current?.getSnapshot());
      }
      dispatchNavigationContext({ type: "exit-run" });
      setRun(null);
      setOutcomeSnapshot(null);
      setMenuPage(SCREEN.STORAGE);
      setScreen(SCREEN.MENU);
      return;
    }
    if ([SCREEN.MENU, SCREEN.PLANETS, SCREEN.COMMAND].includes(destination)) {
      setRun(null);
      setOutcomeSnapshot(null);
      setMenuPage(destination);
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
      canGrantRunCoins={Boolean(run && [SCREEN.PLAYING, SCREEN.PAUSED].includes(screen))}
      onClose={closeDebug}
      onChange={patchSettings}
      onGrantCoins={(amount) => persist((current) => addDebugCoins(current, amount))}
      onGrantRunCoins={(amount) => debugEngineRef.current?.grantDebugCoins(amount)}
      onGrantGold={(amount) => updateGold((gold) => creditGold(gold, amount))}
      onGrantNextGoldGoal={() => updateGold(creditNextGoldGoal)}
      onUnlockAll={() => persist(unlockAllPlanets)}
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
  const endlessResult = screen === SCREEN.DEFEAT && outcomeSnapshot?.mode === "endless";
  const stage = run?.mode === "endless" ? planet?.endlessStage : getStageById(planet, run?.stageId);
  const showFlight = run && (screen === SCREEN.PLAYING || screen === SCREEN.PAUSED
    || screen === SCREEN.FLIGHT_TUTORIAL || screen === SCREEN.FLIGHT_INTRO || screen === SCREEN.VICTORY_LAUNCH
    || (screen === SCREEN.DEFEAT && !endlessResult));
  const equippedCosmetics = getEquippedRocketCosmetics(progress.gold.total, progress.settings.rocketCosmetics);

  const toggleRocketCosmetic = (id) => persist((current) => {
    const cosmetic = ROCKET_COSMETICS.find((item) => item.id === id);
    if (!cosmetic || current.gold.total < cosmetic.amount) return current;
    const rocketCosmetics = { ...current.settings.rocketCosmetics };
    if (rocketCosmetics[id]) delete rocketCosmetics[id];
    else rocketCosmetics[id] = true;
    return { ...current, settings: { ...current.settings, rocketCosmetics } };
  });
  return (
    <>
    <FullscreenButton
      hidden={settingsOpen || [SCREEN.FLIGHT_TUTORIAL, SCREEN.FLIGHT_INTRO, SCREEN.PLAYING, SCREEN.VICTORY_LAUNCH].includes(screen)
      || (screen === SCREEN.MENU && menuPage === SCREEN.COMMAND)} />
    <div
      className={`app-shell ${reducedMotion ? "motion-reduced" : ""}`}
      onClickCapture={(event) => {
        const button = event.target.closest?.("button");
        if (button && !button.classList.contains("mute-button")) playInterfaceSound("menuClick");
      }}
    >
      <div inert={settingsOpen || (debugOpen && screen === SCREEN.MENU && menuPage === SCREEN.STORAGE)}>
      {screen === SCREEN.MENU && menuPage === SCREEN.MENU ? (
        <MenuScreen
          progress={progress}
          warning={warning}
          muted={muted}
          onToggleMute={toggleMute}
          onPlay={() => setMenuPage(progress.onboarding.missionSeen ? SCREEN.PLANETS : SCREEN.MISSION_INTRO)}
          onSettings={openSettings}
        />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.MISSION_INTRO ? (
        <MissionIntroScreen onComplete={completeMissionIntro} />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.STORAGE ? (
        <StorageScreen
          key={progress.gold.total}
          gold={progress.gold}
          equippedCosmetics={equippedCosmetics}
          onToggleCosmetic={toggleRocketCosmetic}
          showDecorations={progress.settings.showVaultDecorations}
          onToggleDecorations={() => patchSettings({ showVaultDecorations: !progress.settings.showVaultDecorations })}
          reducedMotion={reducedMotion}
          inputBlocked={debugOpen || settingsOpen}
          onBack={closeStorage}
          onSettings={openSettings}
          onAcknowledge={acknowledgeGoldDeposit}
        />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.PLANETS ? (
        <PlanetsScreen
          progress={progress}
          completedStageId={completionStageId}
          preferredPlanetId={navigationContext.selector.planetId}
          preferredStageId={navigationContext.selector.selectedStageId}
          storageButtonRef={selectorStorageButton}
          previousGoldBalance={selectorGoldBalance}
          goldCountPaused={debugOpen || settingsOpen}
          onStorage={enterStorageFromSelector}
          onBack={() => setMenuPage(SCREEN.MENU)}
          onPlay={startStage}
          onPlayEndless={(planetId) => startStage(planetId, null, "endless")}
          reducedMotion={reducedMotion}
          onMarkPlanetSeen={markPlanetSeen}
          onSettings={openSettings}
          muted={muted}
          onToggleMute={toggleMute}
          onCommandRoom={enterLaboratory}
          onSelectionChange={(planetId, selectedStageId) => dispatchNavigationContext({ type: "select-stage", planetId, selectedStageId })}
        />
      ) : null}
      {screen === SCREEN.MENU && menuPage === SCREEN.COMMAND ? (
        <CommandRoomScreen
          progress={progress}
          initialPlanetId={laboratoryPlanetId}
          onVisitPlanet={visitLaboratoryPlant}
          onCareComplete={finishLaboratoryCare}
          onBack={exitLaboratory}
          onSettings={openSettings}
        />
      ) : null}

      {showFlight ? (
        <PlayScreen
          key={runKey}
          planetId={run.planetId}
          stageId={run.stageId}
          mode={run.mode}
          cosmetics={equippedCosmetics}
          controlMode={progress.settings.controlMode}
          reducedMotion={reducedMotion}
          muted={muted}
          onToggleMute={toggleMute}
          introducing={screen === SCREEN.FLIGHT_INTRO}
          launching={screen === SCREEN.VICTORY_LAUNCH}
          showHitboxes={progress.settings.showHitboxes}
          paused={screen !== SCREEN.PLAYING}
          showHud={screen === SCREEN.PLAYING || screen === SCREEN.PAUSED}
          onPause={onPause}
          onHudRef={hudRef}
          onOutcome={onOutcome}
          onVictoryLaunchComplete={finishVictoryLaunch}
          onEngineRef={setDebugEngineRef}
        />
      ) : null}
      {screen === SCREEN.PAUSED ? (
        <PauseOverlay
          onResume={() => setScreen(SCREEN.PLAYING)}
          onQuit={exitLevel}
          onSettings={openSettings}
          onTapRocket={() => playGameSound("angryTouch")}
          reducedMotion={reducedMotion}
        />
      ) : null}
      {screen === SCREEN.FLIGHT_TUTORIAL ? (
        <EarthFlightTutorial controlMode={progress.settings.controlMode} onStart={startTutorialFlight} onBack={exitTutorial} />
      ) : null}
      {screen === SCREEN.VICTORY || endlessResult ? (
        <VictoryScreen
          planet={planet}
          stage={stage}
          snapshot={outcomeSnapshot}
          bestScore={progress.endlessHighScores?.[planet?.id] ?? 0}
          onContinue={returnFromResult}
          onRetry={endlessResult ? retryStage : undefined}
        />
      ) : null}
      {screen === SCREEN.DEFEAT && !endlessResult ? (
        <DefeatScreen onRetry={retryStage} />
      ) : null}
      </div>
      {settingsOpen ? (
        <SettingsScreen progress={progress} onBack={closeSettings} onChange={patchSettings} onResetProgress={resetCampaign} />
      ) : null}
      {debugMenu}
    </div>
    </>
  );
}
