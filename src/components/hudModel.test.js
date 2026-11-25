import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getActiveQuestion, getHudAssetUrl, getPowerUpAssetUrl, getStageProgressPercent } from "./hudModel.js";

const hudAssetsDirectory = fileURLToPath(new URL("../../public/assets/ui/", import.meta.url));
const powerUpAssetsDirectory = fileURLToPath(new URL("../../public/assets/powerups/", import.meta.url));

test("não exibe a pergunta do intervalo entre rodadas", () => {
  assert.equal(getActiveQuestion({ question: null }), null);
});

test("exibe o enunciado da rodada ativa", () => {
  const question = { id: "q-1", prompt: "Quanto é 7 + 5?" };
  assert.equal(getActiveQuestion({ question }), question);
});

test("exibe o andamento de fases com duração finita, chegando a 100 só na chegada", () => {
  assert.equal(getStageProgressPercent({ stageDurationMs: 70_000, stageProgress: 0 }), 0);
  assert.equal(getStageProgressPercent({ stageDurationMs: 70_000, stageProgress: 0.475 }), 47);
  assert.equal(getStageProgressPercent({ stageDurationMs: 70_000, stageProgress: 0.9999 }), 99);
  assert.equal(getStageProgressPercent({ stageDurationMs: 70_000, stageProgress: 1 }), 100);
});

test("omite a barra na inicialização e em partidas sem limite de tempo", () => {
  assert.equal(getStageProgressPercent(null), null);
  assert.equal(getStageProgressPercent({ stageDurationMs: Infinity, stageProgress: 0 }), null);
});

test("monta caminhos de ícones da HUD respeitando o caminho base do app", () => {
  assert.equal(getHudAssetUrl("coin.webp", "/rocketbloom/"), "/rocketbloom/assets/ui/coin.webp");
  assert.equal(getHudAssetUrl("warning-alert.webp", "/rocketbloom/"), "/rocketbloom/assets/ui/warning-alert.webp");
});

test("mapeia cada poder para seu ícone próprio no caminho base do app", () => {
  assert.equal(getPowerUpAssetUrl("turbo", "/rocketbloom/"), "/rocketbloom/assets/powerups/turbo.png");
  assert.equal(getPowerUpAssetUrl("bubble", "/"), "/assets/powerups/bubble.png");
  assert.equal(getPowerUpAssetUrl("magnet", "/"), "/assets/powerups/magnet.png");
  assert.equal(getPowerUpAssetUrl("doubler", "/"), "/assets/powerups/doubler.png");
  assert.equal(getPowerUpAssetUrl("freeze", "/"), "/assets/powerups/freeze.png");
});

test("os ícones de moeda e poderes existem nos assets públicos", () => {
  assert.equal(existsSync(`${hudAssetsDirectory}/coin.webp`), true);
  for (const asset of ["turbo.png", "bubble.png", "magnet.png", "doubler.png", "freeze.png"]) {
    assert.equal(existsSync(`${powerUpAssetsDirectory}/${asset}`), true, `${asset} deve existir`);
  }
});
