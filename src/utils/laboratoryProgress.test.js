import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultProgress } from "./storage.js";
import { getPlanetById } from "../game/data/planets.js";
import * as laboratory from "./laboratoryProgress.js";

const earth = getPlanetById("earth");

test("a visita ao laboratório reconhece a muda da primeira fase", () => {
  const rescued = { ...createDefaultProgress(), completedStageIds: ["earth-1"], laboratoryNotices: ["earth"] };
  assert.equal(laboratory.getPendingLaboratoryStage(earth, rescued), null);
  const visited = laboratory.prepareLaboratoryVisit(rescued, "earth");
  assert.deepEqual(visited.laboratoryNotices, []);
  assert.deepEqual(visited.laboratoryActivities, {});
  assert.equal(laboratory.hasLaboratoryAttention(visited), false);
});

test("dois avanços pendentes precisam de cuidados em ordem e o sorteio se mantém", () => {
  const progress = {
    ...createDefaultProgress(),
    completedStageIds: ["earth-1", "earth-2", "earth-3"],
    laboratoryNotices: ["earth"],
  };
  assert.equal(laboratory.getPendingLaboratoryStage(earth, progress).id, "earth-2");
  const picked = laboratory.prepareLaboratoryVisit(progress, "earth", () => 0);
  assert.equal(picked.laboratoryActivities["earth-2"], "water");
  const revisited = laboratory.prepareLaboratoryVisit(picked, "earth", () => 0.99);
  assert.equal(revisited, picked);
  assert.equal(laboratory.hasLaboratoryAttention(revisited), true);
  assert.equal(laboratory.completeLaboratoryCare(revisited, "earth", "earth-3", "water"), revisited);

  const tended = laboratory.completeLaboratoryCare(revisited, "earth", "earth-2", "water");
  assert.equal(tended.plantGrowthStages[earth.plantId], 1);
  assert.equal(laboratory.completeLaboratoryCare(tended, "earth", "earth-2", "water"), tended);
  const next = laboratory.prepareLaboratoryVisit(tended, "earth", () => 0);
  assert.equal(next.laboratoryActivities["earth-3"], "bees", "o estágio seguinte sorteia um cuidado diferente");
  const mature = laboratory.completeLaboratoryCare(next, "earth", "earth-3", "bees");
  assert.equal(mature.plantGrowthStages[earth.plantId], 2);
  assert.equal(laboratory.hasLaboratoryAttention(mature), false);
});

test("a visita aberta de outro mapa prioriza um planeta com aviso", () => {
  const progress = {
    ...createDefaultProgress(),
    completedStageIds: ["earth-1", "earth-2"],
    laboratoryNotices: ["earth"],
  };
  assert.equal(laboratory.getLaboratoryVisitPlanet(progress, "mars").id, "earth");
});
