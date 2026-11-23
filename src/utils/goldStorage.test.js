import assert from "node:assert/strict";
import test from "node:test";
import { getCrossedGoals, getGoalProgress, getGoldMeterProgress, getNextGoldGoal } from "../game/systems/goalSystem.js";
import { acknowledgeGold, creditGold, createGoldStorage, toggleDecoration } from "./goldStorage.js";

test("metas incluem todos os desbloqueios cruzados e apontam para a próxima decoração", () => {
  assert.deepEqual(getCrossedGoals(90, 610).map(({ amount }) => amount), [100, 300, 600]);
  assert.deepEqual(getCrossedGoals(100, 299), []);
  assert.equal(getNextGoldGoal(100).amount, 300);
  assert.equal(getNextGoldGoal(2000), null);
  assert.equal(getGoalProgress(750, 600), 1);
  assert.equal(getGoalProgress(75, 100), 0.75);
});

test("a barra global avança continuamente ao cruzar cada marcador", () => {
  assert.equal(getGoldMeterProgress(0), 0);
  assert.equal(getGoldMeterProgress(100), 0.2);
  assert.equal(getGoldMeterProgress(200), 0.3);
  for (const goal of [100, 300, 600, 1000, 2000]) {
    assert.ok(getGoldMeterProgress(goal - 1) < getGoldMeterProgress(goal));
    assert.ok(getGoldMeterProgress(goal) <= getGoldMeterProgress(goal + 1));
  }
  assert.equal(getGoldMeterProgress(2500), 1);
});

test("depósitos ficam disponíveis para animar até serem vistos sem apagar novos depósitos", () => {
  const first = creditGold(createGoldStorage(), 25);
  const second = creditGold(first, 200);
  assert.deepEqual(first, { total: 25, seenTotal: 0, equippedIds: [] });
  assert.deepEqual(acknowledgeGold(second, first.total), { total: 225, seenTotal: 25, equippedIds: [] });
  assert.equal(acknowledgeGold(second, 999).seenTotal, second.total);
  assert.equal(creditGold(second, Infinity), second);
});

test("só é possível equipar recompensas desbloqueadas e a decoração pode ser removida", () => {
  const initial = creditGold(createGoldStorage(), 100);
  assert.equal(toggleDecoration(initial, "nebula"), initial);
  const equipped = toggleDecoration(initial, "aurora");
  assert.deepEqual(equipped.equippedIds, ["aurora"]);
  assert.deepEqual(toggleDecoration(equipped, "aurora").equippedIds, []);
});

test("campos inválidos do ouro recebem valores seguros", () => {
  assert.deepEqual(createGoldStorage(null), { total: 0, seenTotal: 0, equippedIds: [] });
  assert.deepEqual(createGoldStorage({ total: "100", seenTotal: -1, equippedIds: "aurora" }), createGoldStorage());
  assert.deepEqual(createGoldStorage({ total: 100, seenTotal: 200, equippedIds: ["nebula", "aurora", "aurora", "unknown"] }), {
    total: 100, seenTotal: 100, equippedIds: ["aurora"],
  });
});
