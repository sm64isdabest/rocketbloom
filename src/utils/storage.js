import { AUDIO, PROGRESS_VERSION, STORAGE_KEY } from "../game/config/gameConfig.js";
import { getCampaignUnlocks, PLANETS } from "../game/data/planets.js";
import { PLANTS } from "../game/data/plants.js";
import { LABORATORY_GAME_IDS } from "./laboratoryProgress.js";
import { createGoldStorage } from "./goldStorage.js";
import { ROCKET_COSMETICS } from "../game/config/goldConfig.js";

const campaignStageIds = new Set(PLANETS.flatMap(({ stages }) => stages.map(({ id }) => id)));
const laboratoryStageIds = new Set(PLANETS.flatMap(({ stages }) => stages.slice(1).map(({ id }) => id)));

export function createDefaultProgress() {
  return {
    version: PROGRESS_VERSION,
    coins: 0,
    gold: createGoldStorage(),
    money: 0,
    unlockedPlanetIds: ["earth"],
    seenPlanetIds: [],
    completedStageIds: [],
    stageProgress: {},
    endlessHighScores: {},
    rescuedPlantIds: [],
    plantGrowthStages: {},
    laboratoryNotices: [],
    laboratoryActivities: {},
    sustainabilityPoints: 0,
    processedRunIds: [],
    onboarding: { missionSeen: false, earthTutorialSeen: false },
    settings: {
      music: true,
      soundEffects: true,
      musicVolume: AUDIO.defaultMusicVolume,
      soundEffectsVolume: AUDIO.defaultSoundEffectsVolume,
      interfaceSoundsVolume: AUDIO.defaultInterfaceSoundsVolume,
      interfaceSounds: true,
      muteAll: false,
      reducedMotion: false,
      showHitboxes: false,
      showVaultDecorations: true,
      rocketCosmetics: {},
      controlMode: "pointer",
    },
  };
}

function isValidProgress(value) {
  return (
    value &&
    typeof value === "object" &&
    value.version === PROGRESS_VERSION &&
    Array.isArray(value.unlockedPlanetIds) &&
    Array.isArray(value.completedStageIds) &&
    Array.isArray(value.rescuedPlantIds) &&
    Number.isFinite(value.coins) && value.coins >= 0 &&
    Number.isFinite(value.money) && value.money >= 0
  );
}

function sanitizeProgressMap(value, max = 1) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([, amount]) => Number.isFinite(amount) && amount >= 0)
    .map(([id, amount]) => [id, Math.min(max, amount)]));
}

export function loadProgress(providedStorage) {
  try {
    const storage = providedStorage === undefined ? globalThis.localStorage : providedStorage;
    if (!storage) {
      return { progress: createDefaultProgress(), error: null, source: "memory" };
    }
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return { progress: createDefaultProgress(), error: null, source: "default" };
    }

    const parsed = JSON.parse(raw);
    if (!isValidProgress(parsed)) {
      return {
        progress: createDefaultProgress(),
        error: "Progresso salvo inválido. Um novo perfil foi criado.",
        source: "reset",
      };
    }

    delete parsed.diamonds;
    const storedMusic = typeof parsed.settings?.music === "boolean" ? parsed.settings.music : parsed.settings?.sound !== false;
    const storedEffects = typeof parsed.settings?.soundEffects === "boolean" ? parsed.settings.soundEffects : parsed.settings?.sound !== false;
    const musicVolume = Number.isFinite(parsed.settings?.musicVolume)
      ? Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, parsed.settings.musicVolume))
      : storedMusic ? AUDIO.defaultMusicVolume : AUDIO.minVolume;
    const soundEffectsVolume = Number.isFinite(parsed.settings?.soundEffectsVolume)
      ? Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, parsed.settings.soundEffectsVolume))
      : storedEffects ? AUDIO.defaultSoundEffectsVolume : AUDIO.minVolume;
    const interfaceSoundsVolume = Number.isFinite(parsed.settings?.interfaceSoundsVolume)
      ? Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, parsed.settings.interfaceSoundsVolume))
      : parsed.settings?.interfaceSounds === false ? AUDIO.minVolume : AUDIO.defaultInterfaceSoundsVolume;
    const completedStageIds = [...new Set(parsed.completedStageIds.filter((id) => campaignStageIds.has(id)))];
    const stageProgress = Object.fromEntries(Object.entries(sanitizeProgressMap(parsed.stageProgress))
      .filter(([id]) => campaignStageIds.has(id)));
    const endlessHighScores = Object.fromEntries(Object.entries(sanitizeProgressMap(parsed.endlessHighScores, Number.MAX_SAFE_INTEGER))
      .filter(([id]) => PLANETS.some((planet) => planet.id === id))
      .map(([id, score]) => [id, Math.floor(score)]));
    const processedRunIds = Array.isArray(parsed.processedRunIds)
      ? parsed.processedRunIds.filter((id) => typeof id === "string").slice(-1000) : [];
    const hasFlown = completedStageIds.length > 0 || processedRunIds.length > 0
      || Object.values(stageProgress).some((value) => value > 0) || Object.values(endlessHighScores).some((value) => value > 0);
    const currentLaboratory = Array.isArray(parsed.laboratoryNotices);
    const storedActivities = parsed.laboratoryActivities;
    const laboratoryActivities = storedActivities && typeof storedActivities === "object" && !Array.isArray(storedActivities)
      ? Object.fromEntries(Object.entries(storedActivities)
        .filter(([id, game]) => laboratoryStageIds.has(id) && completedStageIds.includes(id) && LABORATORY_GAME_IDS.includes(game)))
      : {};

    return {
      progress: {
        ...createDefaultProgress(),
        ...parsed,
        gold: createGoldStorage(parsed.gold),
        processedRunIds,
        onboarding: {
          missionSeen: typeof parsed.onboarding?.missionSeen === "boolean" ? parsed.onboarding.missionSeen : hasFlown,
          earthTutorialSeen: typeof parsed.onboarding?.earthTutorialSeen === "boolean" ? parsed.onboarding.earthTutorialSeen : hasFlown,
        },
        completedStageIds,
        unlockedPlanetIds: getCampaignUnlocks(parsed.unlockedPlanetIds, completedStageIds),
        seenPlanetIds: Array.isArray(parsed.seenPlanetIds)
          ? parsed.seenPlanetIds.filter((id) => PLANETS.some((planet) => planet.id === id))
          : [],
        stageProgress,
        endlessHighScores,
        plantGrowthStages: migratePlantGrowth(parsed, currentLaboratory),
        laboratoryNotices: currentLaboratory
          ? [...new Set(parsed.laboratoryNotices.filter((id) => PLANETS.some((planet) => planet.id === id)))]
          : [],
        laboratoryActivities,
        rescuedPlantIds: migrateRescuedPlants(parsed),
        sustainabilityPoints: Number.isFinite(parsed.sustainabilityPoints) && parsed.sustainabilityPoints >= 0
          ? parsed.sustainabilityPoints : 0,
        settings: {
          ...createDefaultProgress().settings,
          ...(parsed.settings ?? {}),
          music: musicVolume > AUDIO.minVolume,
          soundEffects: soundEffectsVolume > AUDIO.minVolume,
          musicVolume,
          soundEffectsVolume,
          interfaceSoundsVolume,
          interfaceSounds: interfaceSoundsVolume > AUDIO.minVolume,
          muteAll: parsed.settings?.muteAll === true,
          reducedMotion: parsed.settings?.reducedMotion === true,
          showHitboxes: parsed.settings?.showHitboxes === true,
          showVaultDecorations: parsed.settings?.showVaultDecorations !== false,
          rocketCosmetics: Object.fromEntries(
            ROCKET_COSMETICS.filter(({ id }) => parsed.settings?.rocketCosmetics?.[id] === true).map(({ id }) => [id, true]),
          ),
          controlMode: parsed.settings?.controlMode === "keyboard" ? "keyboard" : "pointer",
        },
      },
      error: null,
      source: "storage",
    };
  } catch (error) {
    return {
      progress: createDefaultProgress(),
      error: "Não foi possível ler o progresso salvo.",
      source: "error",
      cause: error,
    };
  }
}

// Saves from earlier versions could only record a rescued plant at a planet's
// final phase. Reconstruct the highest earned growth from the completed stages.
function migrateRescuedPlants(progress) {
  const rescued = new Set(Array.isArray(progress.rescuedPlantIds) ? progress.rescuedPlantIds : []);
  for (const planet of PLANETS) {
    const completed = planet.stages.filter((stage) => progress.completedStageIds.includes(stage.id));
    if (completed.length) rescued.add(planet.plantId);
  }
  return [...rescued].filter((id) => PLANTS.some((plant) => plant.id === id));
}

function migratePlantGrowth(progress, currentLaboratory) {
  const saved = sanitizeProgressMap(progress.plantGrowthStages, currentLaboratory ? 2 : 4);
  const stored = {};
  for (const planet of PLANETS) {
    const id = planet.plantId;
    if (currentLaboratory) {
      if (Object.hasOwn(saved, id)) stored[id] = Math.floor(saved[id]);
      continue;
    }
    // O laboratório anterior tinha cinco artes e avançava a planta após cada voo.
    const legacyGrowth = Math.round((saved[id] ?? 0) / 2);
    const stageIndex = planet.stages.findLastIndex((stage) => progress.completedStageIds.includes(stage.id));
    if (stageIndex >= 0 || Object.hasOwn(saved, id)) stored[id] = Math.max(legacyGrowth, stageIndex);
  }
  return stored;
}

function readResetId(raw) {
  try {
    const resetId = JSON.parse(raw)?.resetId;
    return typeof resetId === "string" ? resetId : null;
  } catch {
    return null;
  }
}

function staleProgress() {
  return { ok: false, stale: true, error: "O progresso foi reiniciado em outra aba. Recarregue o jogo." };
}

function writeProgress(progress, expectedResetId, providedStorage) {
  try {
    const storage = providedStorage === undefined ? globalThis.localStorage : providedStorage;
    if (!storage) return { ok: false, error: "Armazenamento local indisponível." };
    const currentResetId = typeof expectedResetId === "string" ? expectedResetId : null;
    if (readResetId(storage.getItem?.(STORAGE_KEY)) !== currentResetId) {
      return staleProgress();
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: "Não foi possível salvar o progresso.", cause: error };
  }
}

export function saveProgress(progress, storage) {
  return writeProgress(progress, progress.resetId ?? null, storage);
}

export function updateSavedProgress(current, update, { storage, preferMemory = false } = {}) {
  const saved = preferMemory ? null : loadProgress(storage);
  const base = saved?.source === "storage" ? saved.progress : current;
  if ((base.resetId ?? null) !== (current.resetId ?? null)) return staleProgress();
  const progress = update(base);
  if (progress === base) return { ok: true, error: null, progress };
  return { ...saveProgress(progress, storage), progress };
}

export function resetSavedProgress(current, storage) {
  const progress = createDefaultProgress();
  progress.resetId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  progress.settings = { ...progress.settings, ...current.settings };
  const result = writeProgress(progress, current.resetId ?? null, storage);
  return result.ok ? { ...result, progress } : result;
}
