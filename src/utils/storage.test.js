import assert from "node:assert/strict";
import test from "node:test";
import { STORAGE_KEY } from "../game/config/gameConfig.js";
import { createDefaultProgress, loadProgress, saveProgress } from "./storage.js";

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

test("progresso inicial não inventa planetas desbloqueados", () => {
  const progress = createDefaultProgress();
  assert.deepEqual(progress.unlockedPlanetIds, ["earth"]);
  assert.equal(progress.coins, 0);
  assert.deepEqual(progress.rescuedPlantIds, []);
  assert.equal(progress.settings.musicVolume, 35);
  assert.equal(progress.settings.soundEffectsVolume, 55);
});

test("volumes salvos são limitados e convertem preferências antigas", () => {
  const storage = memoryStorage();
  const progress = {
    ...createDefaultProgress(),
    settings: { music: false, soundEffects: true, musicVolume: 150, soundEffectsVolume: -8 },
  };
  saveProgress(progress, storage);

  const loaded = loadProgress(storage).progress;

  assert.equal(loaded.settings.musicVolume, 100);
  assert.equal(loaded.settings.soundEffectsVolume, 0);
  assert.equal(loaded.settings.music, true);
  assert.equal(loaded.settings.soundEffects, false);

  const legacyStorage = memoryStorage();
  saveProgress({ ...createDefaultProgress(), settings: { music: false, soundEffects: true } }, legacyStorage);
  const legacySettings = loadProgress(legacyStorage).progress.settings;
  assert.equal(legacySettings.musicVolume, 0);
  assert.equal(legacySettings.soundEffectsVolume, 55);
});

test("salva e recarrega progresso real", () => {
  const storage = memoryStorage();
  const progress = { ...createDefaultProgress(), coins: 3 };
  const saved = saveProgress(progress, storage);
  assert.equal(saved.ok, true);
  const loaded = loadProgress(storage);
  assert.equal(loaded.progress.coins, 3);
  assert.equal(loaded.source, "storage");
  assert.ok(storage.getItem(STORAGE_KEY));
});

test("progresso inválido é descartado", () => {
  const storage = memoryStorage({ [STORAGE_KEY]: "{not-json" });
  const loaded = loadProgress(storage);
  assert.equal(loaded.progress.coins, 0);
  assert.equal(loaded.source, "error");
});

test("migra crescimento existente a partir das fases já concluídas", () => {
  const legacy = {
    ...createDefaultProgress(),
    unlockedPlanetIds: ["earth", "mars"],
    completedStageIds: ["earth-1", "earth-2", "mars-1"],
    rescuedPlantIds: ["victoria-amazonica"],
    plantGrowthStages: { "victoria-amazonica": 1 },
  };
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) });
  const loaded = loadProgress(storage);
  assert.deepEqual(loaded.progress.rescuedPlantIds.sort(), ["mars-lichen", "victoria-amazonica"]);
  assert.equal(loaded.progress.plantGrowthStages["victoria-amazonica"], 1);
  assert.equal(loaded.progress.plantGrowthStages["mars-lichen"], 0);
});
