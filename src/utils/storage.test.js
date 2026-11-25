import assert from "node:assert/strict";
import test from "node:test";
import { STORAGE_KEY } from "../game/config/gameConfig.js";
import { createDefaultProgress, loadProgress, saveProgress } from "./storage.js";
import * as progressStorage from "./storage.js";
import { acknowledgeGold, creditGold } from "./goldStorage.js";

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

test("a preferência de decorações do Cofre sobrevive ao recarregar e o perfil antigo começa com elas visíveis", () => {
  const profile = createDefaultProgress();
  const legacy = { ...profile, settings: {} };
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) });
  assert.equal(loadProgress(storage).progress.settings.showVaultDecorations, true);

  profile.settings.showVaultDecorations = false;
  assert.ok(saveProgress(profile, storage).ok);
  assert.equal(loadProgress(storage).progress.settings.showVaultDecorations, false);
});

test("perfil antigo descarta diamantes e preserva ouro e progresso", () => {
  const old = { ...createDefaultProgress(), diamonds: 45, coins: 18, gold: { total: 312 }, completedStageIds: ["earth-1"] };
  const store = memoryStorage({ [STORAGE_KEY]: JSON.stringify(old) });
  const { progress } = loadProgress(store);
  assert.equal(Object.hasOwn(progress, "diamonds"), false);
  assert.equal(progress.coins, 18);
  assert.equal(progress.gold.total, 312);
  assert.deepEqual(progress.completedStageIds, ["earth-1"]);
  assert.ok(saveProgress(progress, store).ok);
  assert.equal(Object.hasOwn(JSON.parse(store.getItem(STORAGE_KEY)), "diamonds"), false);
});

test("ouro, depósitos ainda não vistos e metas vistas sobrevivem ao recarregar", () => {
  const storage = memoryStorage();
  const progress = { ...createDefaultProgress(), gold: { total: 617, seenTotal: 300, seenGoalIds: ["aurora", "stars"] } };
  assert.ok(saveProgress(progress, storage).ok);
  assert.deepEqual(loadProgress(storage).progress.gold, progress.gold);
  assert.deepEqual(progressStorage.resetSavedProgress(progress, storage).progress.gold, createDefaultProgress().gold);
});

test("terminar uma animação preserva o saldo acrescentado por outra aba depois que ela começou", () => {
  const storage = memoryStorage();
  const openTab = { ...createDefaultProgress(), gold: { total: 100, seenTotal: 0 } };
  assert.ok(saveProgress(openTab, storage).ok);
  assert.ok(saveProgress({ ...openTab, coins: 12, gold: creditGold(openTab.gold, 1000) }, storage).ok);
  const result = progressStorage.updateSavedProgress(openTab, (current) => ({
    ...current, gold: acknowledgeGold(current.gold, 100),
  }), { storage });
  assert.ok(result.ok);
  const saved = loadProgress(storage).progress;
  assert.deepEqual(saved.gold, { total: 1100, seenTotal: 100, seenGoalIds: ["aurora"] });
  assert.equal(saved.coins, 12);
});

test("atualizar progresso mantém depósitos em memória se persistir falhou", () => {
  const local = { ...createDefaultProgress(), gold: { total: 100, seenTotal: 0 } };
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(createDefaultProgress()) });
  storage.setItem = () => { throw new Error("somente leitura"); };
  const result = progressStorage.updateSavedProgress(local, (current) => ({
    ...current, gold: creditGold(current.gold, 25),
  }), { storage, preferMemory: true });
  assert.equal(result.ok, false);
  assert.equal(result.progress.gold.total, 125);
});

test("perfis antigos ou com ouro inválido mantêm as demais recompensas", () => {
  const legacy = { ...createDefaultProgress(), coins: 45 };
  delete legacy.gold;
  for (const profile of [legacy, { ...legacy, gold: { total: -9, seenTotal: 99, equippedIds: ["aurora"] } }]) {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(profile) });
    const { progress } = loadProgress(storage);
    assert.equal(progress.coins, 45);
    assert.deepEqual(progress.gold, { total: 0, seenTotal: 0, seenGoalIds: [] });
  }
});

test("o jogo inicia em memória quando acessar localStorage lança uma exceção", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("bloqueado"); } });
  try {
    const { progress, source } = loadProgress();
    assert.equal(source, "error");
    assert.deepEqual(progress.gold, { total: 0, seenTotal: 0, seenGoalIds: [] });
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});

test("progresso inicial não inventa planetas desbloqueados", () => {
  const progress = createDefaultProgress();
  assert.deepEqual(progress.unlockedPlanetIds, ["earth"]);
  assert.equal(progress.coins, 0);
  assert.deepEqual(progress.rescuedPlantIds, []);
  assert.equal(progress.settings.musicVolume, 35);
  assert.equal(progress.settings.soundEffectsVolume, 55);
  assert.equal(progress.settings.interfaceSoundsVolume, 100);
  assert.equal(progress.settings.interfaceSounds, true);
  assert.equal(progress.settings.muteAll, false);
  assert.deepEqual(progress.seenPlanetIds, []);
});

test("progresso antigo recebe lista de planetas vistos e perfis novos preservam IDs válidos", () => {
  const oldProfile = createDefaultProgress();
  delete oldProfile.seenPlanetIds;
  const legacy = loadProgress(memoryStorage({ [STORAGE_KEY]: JSON.stringify(oldProfile) })).progress;
  assert.deepEqual(legacy.seenPlanetIds, []);

  const newProfile = {
    ...createDefaultProgress(),
    seenPlanetIds: ["earth", "mars", "unknown"],
  };
  const loaded = loadProgress(memoryStorage({ [STORAGE_KEY]: JSON.stringify(newProfile) })).progress;
  assert.deepEqual(loaded.seenPlanetIds, ["earth", "mars"]);
});

test("visualização das áreas de colisão começa desligada e continua desligada em perfis antigos", () => {
  assert.equal(createDefaultProgress().settings.showHitboxes, false);

  const legacy = { ...createDefaultProgress(), settings: { music: true, soundEffects: true } };
  const loaded = loadProgress(memoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })).progress;

  assert.equal(loaded.settings.showHitboxes, false);
});

test("preferências antigas recebem sons da interface ligados e silêncio geral desligado", () => {
  const legacy = {
    ...createDefaultProgress(),
    settings: { music: true, soundEffects: true, musicVolume: 35, soundEffectsVolume: 55 },
  };
  const settings = loadProgress(memoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })).progress.settings;

  assert.equal(settings.interfaceSounds, true);
  assert.equal(settings.interfaceSoundsVolume, 100);
  assert.equal(settings.muteAll, false);
});

test("preferências dos sons da interface e do silêncio geral preservam estados salvos", () => {
  const profile = {
    ...createDefaultProgress(),
    settings: { ...createDefaultProgress().settings, interfaceSoundsVolume: 0, interfaceSounds: false, muteAll: true },
  };
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(profile) });
  const settings = loadProgress(storage).progress.settings;

  assert.equal(settings.interfaceSounds, false);
  assert.equal(settings.interfaceSoundsVolume, 0);
  assert.equal(settings.muteAll, true);
});

test("volumes salvos são limitados e convertem preferências antigas", () => {
  const storage = memoryStorage();
  const progress = {
    ...createDefaultProgress(),
    settings: { music: false, soundEffects: true, musicVolume: 150, soundEffectsVolume: -8, interfaceSoundsVolume: -8 },
  };
  saveProgress(progress, storage);

  const loaded = loadProgress(storage).progress;

  assert.equal(loaded.settings.musicVolume, 100);
  assert.equal(loaded.settings.soundEffectsVolume, 0);
  assert.equal(loaded.settings.interfaceSoundsVolume, 0);
  assert.equal(loaded.settings.music, true);
  assert.equal(loaded.settings.soundEffects, false);

  const legacyStorage = memoryStorage();
  saveProgress({ ...createDefaultProgress(), settings: { music: false, soundEffects: true } }, legacyStorage);
  const legacySettings = loadProgress(legacyStorage).progress.settings;
  assert.equal(legacySettings.musicVolume, 0);
  assert.equal(legacySettings.soundEffectsVolume, 55);
  assert.equal(legacySettings.interfaceSoundsVolume, 100);
});

test("configuração antiga de sons da interface migra o estado sem perder o volume configurado", () => {
  const oldOff = loadProgress(memoryStorage({ [STORAGE_KEY]: JSON.stringify({
    ...createDefaultProgress(),
    settings: { interfaceSounds: false },
  }) })).progress.settings;
  const savedVolume = loadProgress(memoryStorage({ [STORAGE_KEY]: JSON.stringify({
    ...createDefaultProgress(),
    settings: { interfaceSounds: true, interfaceSoundsVolume: 42 },
  }) })).progress.settings;

  assert.equal(oldOff.interfaceSoundsVolume, 0);
  assert.equal(oldOff.interfaceSounds, false);
  assert.equal(savedVolume.interfaceSoundsVolume, 42);
  assert.equal(savedVolume.interfaceSounds, true);
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

test("reset salva uma nova campanha e preserva as preferências", () => {
  const storage = memoryStorage();
  const previous = {
    ...createDefaultProgress(),
    coins: 82,
    unlockedPlanetIds: ["earth", "mars"],
    completedStageIds: ["earth-1"],
    endlessHighScores: { earth: 500 },
    settings: { ...createDefaultProgress().settings, reducedMotion: true, musicVolume: 0, music: false },
  };
  saveProgress(previous, storage);
  const result = progressStorage.resetSavedProgress(previous, storage);
  assert.equal(result.ok, true);
  const { resetId, ...profile } = loadProgress(storage).progress;
  assert.equal(typeof resetId, "string");
  assert.deepEqual(profile, { ...createDefaultProgress(), settings: previous.settings });
  assert.equal(previous.coins, 82);
});

test("outra aba com o perfil antigo não restaura o progresso após o reset", () => {
  const storage = memoryStorage();
  const initial = { ...createDefaultProgress(), coins: 82, completedStageIds: ["earth-1"] };
  saveProgress(initial, storage);
  const oldTab = loadProgress(storage).progress;
  assert.ok(progressStorage.resetSavedProgress(initial, storage).ok);

  const staleUpdate = saveProgress({ ...oldTab, settings: { ...oldTab.settings, muteAll: true } }, storage);
  assert.equal(staleUpdate.ok, false);
  assert.equal(staleUpdate.stale, true);
  const active = loadProgress(storage).progress;
  assert.equal(active.coins, 0);
  assert.deepEqual(active.completedStageIds, []);
  assert.ok(saveProgress({ ...active, coins: 2 }, storage).ok);
});

test("uma falha de armazenamento durante o reset não retorna um perfil vazio", () => {
  const storage = { setItem() { throw new Error("storage indisponível"); } };
  const result = progressStorage.resetSavedProgress(createDefaultProgress(), storage);
  assert.equal(result.ok, false);
  assert.equal(result.progress, undefined);
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
    laboratoryNotices: undefined,
  };
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) });
  const loaded = loadProgress(storage);
  assert.deepEqual(loaded.progress.rescuedPlantIds.sort(), ["mars-lichen", "victoria-amazonica"]);
  assert.equal(loaded.progress.plantGrowthStages["victoria-amazonica"], 1);
  assert.equal(loaded.progress.plantGrowthStages["mars-lichen"], 0);
});

test("um save antigo libera Marte ao carregar três fases da Terra concluídas", () => {
  const legacy = {
    ...createDefaultProgress(),
    coins: 80,
    completedStageIds: ["earth-1", "earth-2", "earth-3", "earth-4"],
    endlessHighScores: { earth: 725, mars: -10, unknown: 100 },
    laboratoryNotices: undefined,
  };
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) });
  const { progress } = loadProgress(storage);
  assert.deepEqual(progress.unlockedPlanetIds, ["earth", "mars"]);
  assert.deepEqual(progress.completedStageIds, ["earth-1", "earth-2", "earth-3"]);
  assert.deepEqual(progress.endlessHighScores, { earth: 725 });
  assert.equal(progress.plantGrowthStages["victoria-amazonica"], 2);
  assert.equal(progress.coins, 80);
});

test("recarregar um perfil novo preserva uma atividade sorteada e o estágio atual", () => {
  const storage = memoryStorage();
  const profile = {
    ...createDefaultProgress(),
    completedStageIds: ["earth-1", "earth-2", "earth-3"],
    plantGrowthStages: { "victoria-amazonica": 0 },
    laboratoryNotices: ["earth"],
    laboratoryActivities: { "earth-2": "clean" },
  };
  assert.equal(saveProgress(profile, storage).ok, true);
  const { progress } = loadProgress(storage);
  assert.deepEqual(progress.laboratoryNotices, ["earth"]);
  assert.deepEqual(progress.laboratoryActivities, { "earth-2": "clean" });
  assert.equal(progress.plantGrowthStages["victoria-amazonica"], 0);
});
