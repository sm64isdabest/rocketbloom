import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const source = readFileSync(fileURLToPath(new URL("./SettingsScreen.jsx", import.meta.url)), "utf8");

test("configurações têm cinco abas, mantendo Informações e Sobre nós separadas", () => {
  const tabs = [...source.matchAll(/\{ id: "([^"]+)", label: "([^"]+)" \}/g)].map(([, id, label]) => [id, label]);
  assert.deepEqual(tabs, [
    ["audio", "Áudio"],
    ["gameplay", "Jogabilidade"],
    ["accessibility", "Acessibilidade"],
    ["information", "Informações"],
    ["about", "Sobre nós"],
  ]);
});

test("Informações conserva a missão e o reset e inclui a descrição da campanha", () => {
  assert.match(source, /SOBRE A MISSÃO/);
  assert.match(source, /Ajude a flora a florescer/);
  assert.match(source, /Pilote o foguete pelas fases e alcance as respostas corretas/);
  assert.match(source, /Acompanhe as plantas resgatadas no Laboratório/);
  assert.match(source, /Explore Terra, Marte, Saturno e Netuno/);
  assert.match(source, /settings-reset-button" onClick=\{openResetDialog\}>Resetar progresso/);
  assert.match(source, /const openResetDialog = \(\) => \{[\s\S]*?resetDialog\.current\.showModal\(\)/);
  assert.match(source, /const confirmReset = \(\) => \{[\s\S]*?onResetProgress\(\)/);
});

test("Sobre nós apresenta igualmente os quatro desenvolvedores, orientador e logo", () => {
  for (const name of ["Luiz Neto", "Isaac Pessoa", "Ricardo Santos", "Thiago Pinheiro"]) assert.ok(source.includes(name));
  assert.match(source, /Professor Peterson Lobato/);
  assert.match(source, /assets\/ui\/uneb-logo\.png/);
  assert.match(source, /Desenvolver o RocketBloom foi uma jornada de criatividade, colaboração/);
});
