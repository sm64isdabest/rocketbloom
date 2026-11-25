import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const source = readFileSync(fileURLToPath(new URL("./VictoryScreen.jsx", import.meta.url)), "utf8");

test("tela de vitória usa Nível Concluído e mantém o título do voo infinito", () => {
  assert.match(source, /flightEnded \? "Fim do voo" : "Nível Concluído!"/);
  assert.doesNotMatch(source, /Fase concluída!/);
});

test("resultados usam arte raster e o voo infinito tem um astronauta próprio", () => {
  assert.match(source, /astronaut-tired\.webp/);
  assert.match(source, /<img className="victory-screen__stat-icon"/);
  assert.match(source, /<img className="victory-screen__return-icon"/);
  assert.doesNotMatch(source, /[◎◴✓×↶]/);
});

test("pontuação fica no infinito e a derrota da campanha exibe o tempo", () => {
  assert.match(source, /: defeated \? \[flightTime\]/);
  assert.equal(source.match(/"Pontuação"/g)?.length, 1);
  assert.doesNotMatch(source, /format\(snapshot\.score\)/);
});
