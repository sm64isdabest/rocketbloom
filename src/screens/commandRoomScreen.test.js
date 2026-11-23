import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const commandRoomSource = readFileSync(fileURLToPath(new URL("./CommandRoomScreen.jsx", import.meta.url)), "utf8");
const appSource = readFileSync(fileURLToPath(new URL("../App.jsx", import.meta.url)), "utf8");
const planetsSource = readFileSync(fileURLToPath(new URL("./PlanetsScreen.jsx", import.meta.url)), "utf8");
const stylesheetSource = readFileSync(fileURLToPath(new URL("../styles/index.css", import.meta.url)), "utf8");

test("laboratório usa o ícone compartilhado e mantém o retorno da base", () => {
  assert.match(commandRoomSource, /getPauseAssetUrl, RETURN_ICON_FILE/);
  assert.match(commandRoomSource, /getPauseAssetUrl\(RETURN_ICON_FILE, APP_BASE\)/);
  assert.match(commandRoomSource, /onClick=\{onBack\} aria-label="Voltar à base"/);
  assert.doesNotMatch(commandRoomSource, /laboratory\/back\.webp/);
});

test("laboratório empilha fundo, base, cúpula traseira, planta e frente do vidro", () => {
  const layers = [
    "laboratory-background-clean.png",
    "laboratory-equipment-base.png",
    "laboratory-dome-back.png",
    "laboratory-specimen__plant",
    "laboratory-dome-front.png",
  ].map((layer) => commandRoomSource.indexOf(layer));

  assert.ok(layers.every((index) => index >= 0));
  assert.deepEqual([...layers].sort((left, right) => left - right), layers);
  assert.match(commandRoomSource, /onClick=\{onSettings\} aria-label="Abrir configurações"/);
  assert.match(commandRoomSource, /onClick=\{\(\) => changePlanet\(-1\)\}/);
  assert.match(commandRoomSource, /onClick=\{\(\) => changePlanet\(1\)\}/);
});

test("Saturn's specimen alone gets the lower soil anchor in standard and short layouts", () => {
  assert.match(stylesheetSource, /\.laboratory-scene--saturn \.laboratory-specimen \{ bottom: calc\(40% - clamp\(10px, 3svh, 20px\)\); \}/);
  assert.match(stylesheetSource, /\.laboratory-scene--saturn \.laboratory-specimen \{ bottom: calc\(49% - clamp\(10px, 3svh, 20px\)\); \}/);
  assert.match(stylesheetSource, /\.laboratory-specimen__plant \{[^}]*object-fit: contain; object-position: center bottom;/);
});

test("laboratório retorna ao seletor de origem e atualiza sua referência ao entrar", () => {
  const commandRoomRoute = appSource.match(/<CommandRoomScreen([\s\S]*?)\/>/)?.[1] ?? "";
  assert.match(commandRoomRoute, /onBack=\{exitLaboratory\}/);
  assert.doesNotMatch(commandRoomRoute, /setScreen|setRun|setOutcomeSnapshot/);
  const exitHandler = appSource.match(/const exitLaboratory = \(\) => \{([\s\S]*?)\n  \};/)?.[1] ?? "";
  assert.match(exitHandler, /dispatchNavigationContext\(\{ type: "exit-laboratory" \}\)/);
  assert.match(exitHandler, /setMenuPage\(SCREEN\.PLANETS\)/);
  assert.doesNotMatch(exitHandler, /setRun|persist\(/);
  assert.match(planetsSource, /onCommandRoom\(planet\.id, selectedStageId\)/);
  assert.match(appSource, /onCommandRoom=\{enterLaboratory\}/);
  assert.match(appSource, /type: "open-laboratory", planetId, selectedStageId/);
  assert.match(appSource, /preferredPlanetId=\{navigationContext\.selector\.planetId\}/);
  assert.match(appSource, /preferredStageId=\{navigationContext\.selector\.selectedStageId\}/);
  assert.match(planetsSource, /validPreferredPlanetId \?\? getPlanetIdForStage\(completedStageId\)/);
  assert.match(planetsSource, /PLANETS\.find\(\(\{ id \}\) => id === initialPlanetId\).*preferredStageId/);
  assert.match(planetsSource, /onSelectionChange\?\.\(planet\.id, stageId\)/);
  assert.match(appSource, /onSelectionChange=\{\(planetId, selectedStageId\) => dispatchNavigationContext/);
  assert.ok(planetsSource.includes("const orbitStage = getOrbitStage(model.stages, selectedStageId)"));
  assert.ok(planetsSource.includes("ref={stage.id === orbitStage?.id ? activeStageElementRef : undefined}"));
});
