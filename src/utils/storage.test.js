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
