import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getPauseActions, getPauseAssetUrl } from "./pauseModel.js";

const pauseAssetsDirectory = fileURLToPath(new URL("../../public/assets/ui/pause/", import.meta.url));
const pauseStyles = readFileSync(fileURLToPath(new URL("../styles/index.css", import.meta.url)), "utf8");
const pauseOverlaySource = readFileSync(fileURLToPath(new URL("./PauseOverlay.jsx", import.meta.url)), "utf8");

test("pause artwork URLs preserve the app base path with or without a trailing slash", () => {
  assert.equal(getPauseAssetUrl("return-portal.webp", "/rocketbloom/"), "/rocketbloom/assets/ui/pause/return-portal.webp");
  assert.equal(getPauseAssetUrl("return-portal.webp", "/rocketbloom"), "/rocketbloom/assets/ui/pause/return-portal.webp");
});

test("pause actions map the door, green arrow, and gear to quit, resume, and settings", () => {
  const onQuit = () => {};
  const onResume = () => {};
  const onSettings = () => {};

  assert.deepEqual(getPauseActions({ onQuit, onResume, onSettings }), [
    { id: "quit", label: "Sair da fase", asset: "return-portal.webp", onClick: onQuit },
    { id: "resume", label: "Continuar", asset: "continue.webp", onClick: onResume },
    { id: "settings", label: "Configurações", asset: "settings.webp", onClick: onSettings },
  ]);
});

test("the supplied pause artwork exists in the public assets directory", () => {
  for (const filename of ["return-portal.webp", "continue.webp", "settings.webp", "rocket-newspaper.webp"]) {
    assert.equal(existsSync(`${pauseAssetsDirectory}/${filename}`), true, `${filename} must exist in public/assets/ui/pause`);
  }
  assert.equal(existsSync(`${pauseAssetsDirectory}/leave.webp`), false, "the old door artwork must be removed");
});

test("pause action buttons have no gap and brighten only their artwork on hover", () => {
  assert.match(pauseStyles, /\.pause-popup__actions\s*\{[^}]*\bgap:\s*0\s*;/);
  assert.match(pauseStyles, /\.pause-popup__action:hover\s+img\s*\{[^}]*\bfilter:\s*brightness\(1\.15\)\s*;/);
  assert.doesNotMatch(pauseStyles, /\.pause-popup__action:hover\s*\{[^}]*\btransform\s*:/);
});

test("pause settings uses the shared settings icon while other buttons keep pause artwork", () => {
  assert.match(pauseOverlaySource, /id === "settings" \? getMenuAssetUrl\(asset, APP_BASE\) : getPauseAssetUrl\(asset, APP_BASE\)/);
});
