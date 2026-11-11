import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getPauseActions, getPauseAssetUrl } from "./pauseModel.js";

const pauseAssetsDirectory = fileURLToPath(new URL("../../public/assets/ui/pause/", import.meta.url));
const pauseStyles = readFileSync(fileURLToPath(new URL("../styles/index.css", import.meta.url)), "utf8");

test("pause artwork URLs preserve the app base path with or without a trailing slash", () => {
  assert.equal(getPauseAssetUrl("leave.webp", "/rocketbloom/"), "/rocketbloom/assets/ui/pause/leave.webp");
  assert.equal(getPauseAssetUrl("leave.webp", "/rocketbloom"), "/rocketbloom/assets/ui/pause/leave.webp");
});

test("pause actions map the door, green arrow, and gear to quit, resume, and settings", () => {
  const onQuit = () => {};
  const onResume = () => {};
  const onSettings = () => {};

  assert.deepEqual(getPauseActions({ onQuit, onResume, onSettings }), [
    { id: "quit", label: "Sair da fase", asset: "leave.webp", onClick: onQuit },
    { id: "resume", label: "Continuar", asset: "continue.webp", onClick: onResume },
    { id: "settings", label: "Configurações", asset: "settings.webp", onClick: onSettings },
  ]);
});

test("the supplied pause artwork exists in the public assets directory", () => {
  for (const filename of ["leave.webp", "continue.webp", "settings.webp", "rocket-newspaper.webp"]) {
    assert.equal(existsSync(`${pauseAssetsDirectory}/${filename}`), true, `${filename} must exist in public/assets/ui/pause`);
  }
});

test("pause action buttons have no gap and brighten only their artwork on hover", () => {
  assert.match(pauseStyles, /\.pause-popup__actions\s*\{[^}]*\bgap:\s*0\s*;/);
  assert.match(pauseStyles, /\.pause-popup__action:hover\s+img\s*\{[^}]*\bfilter:\s*brightness\(1\.15\)\s*;/);
  assert.doesNotMatch(pauseStyles, /\.pause-popup__action:hover\s*\{[^}]*\btransform\s*:/);
});
