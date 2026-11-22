import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const appSource = readFileSync(fileURLToPath(new URL("../App.jsx", import.meta.url)), "utf8");

test("sair do nível encerra a sessão pausada e abre diretamente o seletor", () => {
  assert.match(appSource, /dispatchNavigationContext\(\{ type: "start-run", planetId, stageId \}\)/);
  const exitHandler = appSource.match(/const exitLevel = \(\) => \{([\s\S]*?)\n  \};/)?.[1] ?? "";
  assert.match(exitHandler, /dispatchNavigationContext\(\{ type: "exit-run" \}\)/);
  assert.match(exitHandler, /setRun\(null\)/);
  assert.match(exitHandler, /setOutcomeSnapshot\(null\)/);
  assert.match(exitHandler, /setMenuPage\(SCREEN\.PLANETS\)/);
  assert.match(exitHandler, /setScreen\(SCREEN\.MENU\)/);
  assert.doesNotMatch(exitHandler, /persist\(|setProgress/);
  assert.match(appSource, /<PauseOverlay[\s\S]*?onQuit=\{exitLevel\}/);
  assert.match(appSource, /run && \(screen === SCREEN\.PLAYING \|\| screen === SCREEN\.PAUSED/);
  assert.match(appSource, /screen === SCREEN\.MENU && menuPage === SCREEN\.PLANETS/);
  assert.match(appSource, /screen === SCREEN\.MENU && \(menuPage === SCREEN\.MENU \|\| menuPage === SCREEN\.SETTINGS\)/);
});
