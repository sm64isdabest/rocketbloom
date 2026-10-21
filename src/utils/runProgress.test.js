import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultProgress } from "./storage.js";
import { applyRunOutcome } from "./runProgress.js";

test("uma conclusão duplicada não reaplica moedas, créditos ou resgate", () => {
  let progress = createDefaultProgress();
  const firstStage = { runId: "run-a", planetId: "earth", stageId: "earth-1", coins: 2, diamonds: 1 };
  const first = applyRunOutcome(progress, firstStage, "victory");
  progress = first.progress;
  const duplicate = applyRunOutcome(progress, firstStage, "victory");
  assert.equal(duplicate.alreadyApplied, true);
  assert.equal(duplicate.progress.coins, 2);
  assert.equal(duplicate.progress.money, first.progress.money);
  assert.equal(duplicate.progress.completedStageIds.length, 1);
});

test("concluir as cinco fases da Terra desbloqueia Marte", () => {
  let progress = applyRunOutcome(createDefaultProgress(), {
    runId: "run-b", planetId: "earth", stageId: "earth-1", coins: 0, diamonds: 0,
  }, "victory").progress;
  assert.deepEqual(progress.rescuedPlantIds, ["victoria-amazonica"]);
  assert.equal(progress.plantGrowthStages["victoria-amazonica"], 0);
  for (let phase = 2; phase <= 5; phase += 1) {
    progress = applyRunOutcome(progress, { runId: `earth-${phase}`, planetId: "earth", stageId: `earth-${phase}`, coins: 0, diamonds: 0 }, "victory").progress;
  }
  assert.ok(progress.unlockedPlanetIds.includes("mars"));
  assert.deepEqual(progress.rescuedPlantIds, ["victoria-amazonica"]);
  assert.equal(progress.plantGrowthStages["victoria-amazonica"], 4);
  const replay = applyRunOutcome(progress, { runId: "earth-replay", planetId: "earth", stageId: "earth-5" }, "victory");
  assert.equal(replay.progress.plantGrowthStages["victoria-amazonica"], 4);
  assert.equal(replay.progress.money, progress.money);
});

test("uma fase avança apenas a planta do planeta correspondente", () => {
  let progress = createDefaultProgress();
  progress = applyRunOutcome(progress, { runId: "growth-earth-1", planetId: "earth", stageId: "earth-1" }, "victory").progress;
  progress = applyRunOutcome(progress, { runId: "growth-earth-2", planetId: "earth", stageId: "earth-2" }, "victory").progress;
  assert.equal(progress.plantGrowthStages["victoria-amazonica"], 1);
  assert.equal(progress.plantGrowthStages["mars-lichen"], undefined);
});

test("itens coletados durante uma derrota são salvos sem marcar a fase como concluída", () => {
  const result = applyRunOutcome(createDefaultProgress(), {
    runId: "run-defeat", planetId: "earth", stageId: "earth-1", coins: 3, diamonds: 2,
  }, "defeat");
  assert.equal(result.progress.coins, 3);
  assert.equal(result.progress.diamonds, 2);
  assert.deepEqual(result.progress.completedStageIds, []);
});

test("rejogar uma fase concluída não credita novamente moedas e diamantes", () => {
  const completed = applyRunOutcome(createDefaultProgress(), {
    runId: "first-clear", planetId: "earth", stageId: "earth-1", coins: 2, diamonds: 1,
  }, "victory").progress;
  const replay = applyRunOutcome(completed, {
    runId: "replay", planetId: "earth", stageId: "earth-1", coins: 5, diamonds: 3,
  }, "victory");
  assert.equal(replay.progress.coins, completed.coins);
  assert.equal(replay.progress.diamonds, completed.diamonds);
  assert.equal(replay.rewards.coins, 0);
  assert.equal(replay.rewards.diamonds, 0);
});
