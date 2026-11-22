import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const commandRoomSource = readFileSync(fileURLToPath(new URL("./CommandRoomScreen.jsx", import.meta.url)), "utf8");
const appSource = readFileSync(fileURLToPath(new URL("../App.jsx", import.meta.url)), "utf8");

test("laboratório usa o ícone compartilhado e mantém o retorno da base", () => {
  assert.match(commandRoomSource, /getPauseAssetUrl, RETURN_ICON_FILE/);
  assert.match(commandRoomSource, /getPauseAssetUrl\(RETURN_ICON_FILE, APP_BASE\)/);
  assert.match(commandRoomSource, /onClick=\{onBack\} aria-label="Voltar à base"/);
  assert.doesNotMatch(commandRoomSource, /laboratory\/back\.webp/);
});

test("voltar do laboratório abre o seletor sem limpar o estado da sessão", () => {
  const commandRoomRoute = appSource.match(/<CommandRoomScreen([\s\S]*?)\/>/)?.[1] ?? "";
  assert.match(commandRoomRoute, /onBack=\{\(\) => setMenuPage\(getLaboratoryReturnPage\(SCREEN\)\)\}/);
  assert.doesNotMatch(commandRoomRoute, /setScreen|setRun|setOutcomeSnapshot/);
});
