import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const settingsSource = readFileSync(fileURLToPath(new URL("./SettingsScreen.jsx", import.meta.url)), "utf8");

test("sons da interface usam o mesmo controle deslizante das outras categorias", () => {
  const interfaceCard = settingsSource.match(/<section className="settings-popup__audio-card" aria-labelledby=\{`\$\{ids\}-interface-title`\}[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.ok(interfaceCard);
  assert.match(interfaceCard, /Sons da interface/);
  assert.match(interfaceCard, /Cliques, seleções e botões do jogo\./);
  assert.match(interfaceCard, /<input[\s\S]*?className="settings-popup__range"[\s\S]*?type="range"/);
  assert.match(interfaceCard, /interfaceSoundsVolume/);
  assert.match(interfaceCard, /\{interfaceSoundsVolume\}%/);
  assert.doesNotMatch(interfaceCard, /role="switch"|settings-popup__audio-switch/);
  assert.match(settingsSource, /onClick=\{\(\) => onChange\(\{ muteAll: !muteAll \}\)\}/);
});
