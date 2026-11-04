import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getPauseActions, getPauseAssetUrl } from "./pauseModel.js";

const pauseAssetsDirectory = fileURLToPath(new URL("../../public/assets/ui/pause/", import.meta.url));

test("pause artwork URLs preserve the app base path with or without a trailing slash", () => {
  assert.equal(getPauseAssetUrl("leave.png", "/rocketbloom/"), "/rocketbloom/assets/ui/pause/leave.png");
  assert.equal(getPauseAssetUrl("leave.png", "/rocketbloom"), "/rocketbloom/assets/ui/pause/leave.png");
});

test("pause actions map the door, green arrow, and gear to quit, resume, and settings", () => {
  const onQuit = () => {};
  const onResume = () => {};
  const onSettings = () => {};

  assert.deepEqual(getPauseActions({ onQuit, onResume, onSettings }), [
    { id: "quit", label: "Sair da fase", asset: "leave.png", onClick: onQuit },
    { id: "resume", label: "Continuar", asset: "continue.png", onClick: onResume },
    { id: "settings", label: "Configurações", asset: "settings.png", onClick: onSettings },
  ]);
});

test("the supplied pause artwork exists in the public assets directory", () => {
  for (const filename of ["leave.png", "continue.png", "settings.png", "rocket-newspaper.png"]) {
    assert.equal(existsSync(`${pauseAssetsDirectory}/${filename}`), true, `${filename} must exist in public/assets/ui/pause`);
  }
});
