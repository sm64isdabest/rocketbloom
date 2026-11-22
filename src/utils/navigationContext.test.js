import assert from "node:assert/strict";
import test from "node:test";
import { initialNavigationContext, navigationContextReducer } from "./navigationContext.js";

const planets = ["earth", "mars", "saturn", "neptune"];

test("sair de uma partida retorna ao planeta em que ela começou", () => {
  for (const planetId of planets) {
    let context = { ...initialNavigationContext, selectorPlanetId: "saturn" };
    context = navigationContextReducer(context, { type: "start-run", planetId });
    context = navigationContextReducer(context, { type: "exit-run" });
    assert.equal(context.selectorPlanetId, planetId, `a partida de ${planetId} retorna ao próprio seletor`);
    assert.equal(context.runOriginPlanetId, null, "a referência da partida encerrada é limpa");
  }
});

test("sair do laboratório retorna ao seletor usado para abri-lo", () => {
  for (const planetId of planets) {
    let context = { ...initialNavigationContext, selectorPlanetId: "saturn" };
    context = navigationContextReducer(context, { type: "open-laboratory", planetId });
    context = navigationContextReducer(context, { type: "exit-laboratory" });
    assert.equal(context.selectorPlanetId, planetId, `o laboratório aberto em ${planetId} retorna ao próprio seletor`);
    assert.equal(context.laboratoryOriginPlanetId, null, "a referência desse acesso ao laboratório é limpa");
  }
});

test("origens da partida e do laboratório permanecem independentes", () => {
  let context = navigationContextReducer(initialNavigationContext, { type: "open-laboratory", planetId: "earth" });
  context = navigationContextReducer(context, { type: "start-run", planetId: "saturn" });
  context = navigationContextReducer(context, { type: "exit-run" });
  assert.equal(context.selectorPlanetId, "saturn");
  assert.equal(context.laboratoryOriginPlanetId, "earth");
  context = navigationContextReducer(context, { type: "exit-laboratory" });
  assert.equal(context.selectorPlanetId, "earth");
});

test("acessos consecutivos ao laboratório atualizam o planeta de origem", () => {
  let context = navigationContextReducer(initialNavigationContext, { type: "open-laboratory", planetId: "earth" });
  context = navigationContextReducer(context, { type: "exit-laboratory" });
  context = navigationContextReducer(context, { type: "open-laboratory", planetId: "neptune" });
  context = navigationContextReducer(context, { type: "exit-laboratory" });
  assert.equal(context.selectorPlanetId, "neptune");
  assert.equal(context.laboratoryOriginPlanetId, null);
});
