import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const screenSource = readFileSync(fileURLToPath(new URL("./PlanetsScreen.jsx", import.meta.url)), "utf8");
const stylesheet = readFileSync(fileURLToPath(new URL("../styles/index.css", import.meta.url)), "utf8");
const toolbar = screenSource.match(/<header className="phase-selection-header"[\s\S]*?<\/header>/)?.[0] ?? "";

test("barra do seletor mostra os subtítulos definidos para os quatro planetas", () => {
  for (const subtitle of [
    "Explore o nosso planeta!",
    "Desvende os mistérios do planeta vermelho!",
    "O gigante dos anéis!",
    "O último desafio!",
  ]) assert.ok(screenSource.includes(subtitle), `subtítulo ausente: ${subtitle}`);
});

test("barra reúne os dados dinâmicos e conserva os handlers e ícones originais", () => {
  assert.ok(toolbar);
  assert.match(toolbar, /numberFormat\.format\(progress\.coins \?\? 0\)/);
  assert.match(toolbar, /numberFormat\.format\(progress\.diamonds \?\? 0\)/);
  assert.match(toolbar, /onClick=\{onBack\}[^>]*>Menu<\/button>/);
  assert.doesNotMatch(toolbar, /phase-selection-back[^>]*>[\s\S]*?<span|aria-hidden="true">‹/);
  assert.match(toolbar, /onClick=\{onSettings\}/);
  assert.match(toolbar, /getMenuAssetUrl\("settings\.webp", APP_BASE\)/);
  assert.match(toolbar, /onClick=\{\(\) => onCommandRoom\(planet\.id, selectedStageId\)\}/);
  assert.match(toolbar, /getMenuAssetUrl\("laboratory\.webp", APP_BASE\)/);
  assert.equal((screenSource.match(/className="phase-selection-laboratory"/g) ?? []).length, 1);
});

test("barra tem cores por planeta e reorganiza recursos e navegação em telas estreitas", () => {
  for (const planet of ["earth", "mars", "saturn", "neptune"]) {
    assert.match(stylesheet, new RegExp(`\\.phase-selection-canvas--${planet} \\{ --selector-accent:`));
  }
  assert.match(stylesheet, /@media \(max-width: 620px\) \{[\s\S]*?\.phase-selection-header\s*\{[^}]*grid-template-rows:\s*auto auto/);
  assert.match(stylesheet, /\.phase-selection-resources\s*\{[^}]*grid-column:\s*1 \/ -1/);
});
