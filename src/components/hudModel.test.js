import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getActiveQuestion, getHudAssetUrl, getPowerUpAssetUrl } from "./hudModel.js";

const hudAssetsDirectory = fileURLToPath(new URL("../../public/assets/ui/", import.meta.url));
const powerUpAssetsDirectory = fileURLToPath(new URL("../../public/assets/powerups/", import.meta.url));

test("não exibe a pergunta do intervalo entre rodadas", () => {
  assert.equal(getActiveQuestion({ question: null }), null);
});

test("exibe o enunciado da rodada ativa", () => {
  const question = { id: "q-1", prompt: "Quanto é 7 + 5?" };
  assert.equal(getActiveQuestion({ question }), question);
});

test("monta caminhos de ícones da HUD respeitando o caminho base do app", () => {
  assert.equal(getHudAssetUrl("coin.png", "/rocketbloom/"), "/rocketbloom/assets/ui/coin.png");
  assert.equal(getHudAssetUrl("diamond.png", "/"), "/assets/ui/diamond.png");
});

test("mapeia cada poder para seu ícone próprio no caminho base do app", () => {
  assert.equal(getPowerUpAssetUrl("turbo", "/rocketbloom/"), "/rocketbloom/assets/powerups/turbo.png");
  assert.equal(getPowerUpAssetUrl("star", "/"), "/assets/powerups/star.png");
  assert.equal(getPowerUpAssetUrl("shrink", "/"), "/assets/powerups/shrink.png");
  assert.equal(getPowerUpAssetUrl("bubble", "/"), "/assets/powerups/bubble.png");
});

test("os ícones de moeda, diamante e poderes existem nos assets públicos", () => {
  assert.equal(existsSync(`${hudAssetsDirectory}/coin.png`), true);
  assert.equal(existsSync(`${hudAssetsDirectory}/diamond.png`), true);
  for (const asset of ["turbo.png", "star.png", "shrink.png", "bubble.png"]) {
    assert.equal(existsSync(`${powerUpAssetsDirectory}/${asset}`), true, `${asset} deve existir`);
  }
});
