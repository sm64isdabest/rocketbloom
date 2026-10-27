import { AUDIO, PROGRESS_VERSION, STORAGE_KEY } from "../game/config/gameConfig.js";
import { PLANETS } from "../game/data/planets.js";
import { PLANTS } from "../game/data/plants.js";

export function createDefaultProgress() {
  return {
    version: PROGRESS_VERSION,
    coins: 0,
    diamonds: 0,
    money: 0,
    unlockedPlanetIds: ["earth"],
    completedStageIds: [],
    stageProgress: {},
    rescuedPlantIds: [],
    plantGrowthStages: {},
    sustainabilityPoints: 0,
    processedRunIds: [],
    settings: {
      music: true,
      soundEffects: true,
      musicVolume: AUDIO.defaultMusicVolume,
      soundEffectsVolume: AUDIO.defaultSoundEffectsVolume,
      reducedMotion: false,
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
    Number.isFinite(value.diamonds) && value.diamonds >= 0 &&
    Number.isFinite(value.money) && value.money >= 0
  );
}

function sanitizeProgressMap(value, max = 1) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([, amount]) => Number.isFinite(amount) && amount >= 0)
    .map(([id, amount]) => [id, Math.min(max, amount)]));
}

export function loadProgress(storage = globalThis.localStorage) {
  if (!storage) {
    return { progress: createDefaultProgress(), error: null, source: "memory" };
  }

  try {
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

    const storedMusic = typeof parsed.settings?.music === "boolean" ? parsed.settings.music : parsed.settings?.sound !== false;
    const storedEffects = typeof parsed.settings?.soundEffects === "boolean" ? parsed.settings.soundEffects : parsed.settings?.sound !== false;
    const musicVolume = Number.isFinite(parsed.settings?.musicVolume)
      ? Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, parsed.settings.musicVolume))
      : storedMusic ? AUDIO.defaultMusicVolume : AUDIO.minVolume;
    const soundEffectsVolume = Number.isFinite(parsed.settings?.soundEffectsVolume)
      ? Math.max(AUDIO.minVolume, Math.min(AUDIO.maxVolume, parsed.settings.soundEffectsVolume))
      : storedEffects ? AUDIO.defaultSoundEffectsVolume : AUDIO.minVolume;

    return {
      progress: {
        ...createDefaultProgress(),
        ...parsed,
        stageProgress: sanitizeProgressMap(parsed.stageProgress),
        plantGrowthStages: migratePlantGrowth(parsed),
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
          reducedMotion: parsed.settings?.reducedMotion === true,
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

function migratePlantGrowth(progress) {
  const stored = sanitizeProgressMap(progress.plantGrowthStages, 4);
  for (const planet of PLANETS) {
    const plant = PLANTS.find((entry) => entry.id === planet.plantId);
    const completed = planet.stages.filter((stage) => progress.completedStageIds.includes(stage.id));
    if (!plant || !completed.length) continue;
    const earnedStage = Math.min(plant.growthStages.length - 1, completed.length - 1);
    stored[plant.id] = Math.max(stored[plant.id] ?? 0, earnedStage);
  }
  return stored;
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  if (!storage) {
    return { ok: false, error: "Armazenamento local indisponível." };
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: "Não foi possível salvar o progresso.", cause: error };
  }
}
