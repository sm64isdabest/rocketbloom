import assert from "node:assert/strict";
import test from "node:test";
import { getCrossedGoals, getGoalProgress, getGoldMeterProgress, getHighestGoldGoal, getNextGoldGoal } from "../game/systems/goalSystem.js";
import { acknowledgeGold, creditGold, creditNextGoldGoal, createGoldStorage, hasUnseenGoldGoals } from "./goldStorage.js";

test("metas incluem todos os desbloqueios cruzados e apontam para a próxima decoração", () => {
  assert.deepEqual(getCrossedGoals(19, 76).map(({ amount }) => amount), [20, 45, 75]);
  assert.deepEqual(getCrossedGoals(20, 44), []);
  assert.equal(getNextGoldGoal(20).amount, 45);
  assert.equal(getNextGoldGoal(150), null);
  assert.equal(getGoalProgress(750, 600), 1);
  assert.equal(getGoalProgress(75, 100), 0.75);
});

test("a barra global avança continuamente ao cruzar cada marcador", () => {
  assert.equal(getGoldMeterProgress(0), 0);
  assert.equal(getGoldMeterProgress(20), 0.2);
  assert.equal(getGoldMeterProgress(32.5), 0.3);
  for (const goal of [20, 45, 75, 110, 150]) {
    assert.ok(getGoldMeterProgress(goal - 1) < getGoldMeterProgress(goal));
    assert.ok(getGoldMeterProgress(goal) <= getGoldMeterProgress(goal + 1));
  }
  assert.equal(getGoldMeterProgress(200), 1);
});

test("o maior tesouro corresponde ao saldo exibido e o debug credita até a próxima meta", () => {
  let gold = creditGold(createGoldStorage(), 19);
  assert.equal(getHighestGoldGoal(gold.total), null);
  for (const [index, amount] of [20, 45, 75, 110, 150].entries()) {
    gold = creditNextGoldGoal(gold);
    assert.equal(gold.total, amount);
    assert.equal(getHighestGoldGoal(gold.total).treasure.level, index + 1);
  }
  assert.equal(creditNextGoldGoal(gold), gold);
});

test("a novidade aparece apenas para metas ganhas e é removida ao ver as imagens", () => {
  const initial = createGoldStorage({ total: 19, seenTotal: 15 });
  assert.equal(hasUnseenGoldGoals(initial), false);
  const gold = creditGold(initial, 56);
  assert.ok(hasUnseenGoldGoals(gold));
  const firstSeen = acknowledgeGold(gold, 20);
  assert.deepEqual(firstSeen.seenGoalIds, ["aurora"]);
  assert.ok(hasUnseenGoldGoals(firstSeen));
  const allSeen = acknowledgeGold(firstSeen, gold.total);
  assert.deepEqual(allSeen.seenGoalIds, ["aurora", "stars", "saturn"]);
  assert.equal(hasUnseenGoldGoals(allSeen), false);
  assert.equal(acknowledgeGold(allSeen, 20), allSeen);
});

test("o save antigo migra as metas vistas e descarta referências corrompidas", () => {
  const migrated = createGoldStorage({ total: 90, seenTotal: 45 });
  assert.deepEqual(migrated.seenGoalIds, ["aurora", "stars"]);
  assert.ok(hasUnseenGoldGoals(migrated));
  const normalized = createGoldStorage({ total: 20, seenTotal: 20, seenGoalIds: ["aurora", "aurora", "saturn", "unknown"] });
  assert.deepEqual(normalized.seenGoalIds, ["aurora"]);
  assert.equal(hasUnseenGoldGoals(normalized), false);
});

test("depósitos ficam disponíveis para animar até serem vistos sem apagar novos depósitos", () => {
  const first = creditGold(createGoldStorage(), 10);
  const second = creditGold(first, 200);
  assert.deepEqual(first, { total: 10, seenTotal: 0, seenGoalIds: [] });
  assert.deepEqual(acknowledgeGold(second, first.total), { total: 210, seenTotal: 10, seenGoalIds: [] });
  assert.equal(acknowledgeGold(second, 999).seenTotal, second.total);
  assert.equal(creditGold(second, Infinity), second);
});

test("campos inválidos do ouro recebem valores seguros", () => {
  assert.deepEqual(createGoldStorage(null), { total: 0, seenTotal: 0, seenGoalIds: [] });
  assert.deepEqual(createGoldStorage({ total: "100", seenTotal: -1, equippedIds: "aurora" }), createGoldStorage());
  assert.deepEqual(createGoldStorage({ total: 20, seenTotal: 200, equippedIds: ["nebula", "aurora", "aurora", "unknown"] }), {
    total: 20, seenTotal: 20, seenGoalIds: ["aurora"],
  });
});
