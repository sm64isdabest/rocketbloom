import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getMenuAssetUrl, getSettingsReturnPage } from "./menuModel.js";
import { SCREEN } from "../utils/screenStates.js";

test("settings opened from phase selection returns to phase selection", () => {
  assert.equal(getSettingsReturnPage(SCREEN.PLANETS, SCREEN), SCREEN.PLANETS);
});

test("settings opened from the laboratory returns to the laboratory", () => {
  assert.equal(getSettingsReturnPage(SCREEN.COMMAND, SCREEN), SCREEN.COMMAND);
});

test("settings opened from the home menu returns to the home menu", () => {
  assert.equal(getSettingsReturnPage(SCREEN.MENU, SCREEN), SCREEN.MENU);
});

test("menu assets respect the configured app base path", () => {
  assert.equal(getMenuAssetUrl("gear.webp", "/rocketbloom/"), "/rocketbloom/assets/menu/gear.webp");
  assert.equal(getMenuAssetUrl("logo.webp", "/rocketbloom"), "/rocketbloom/assets/menu/logo.webp");
  assert.equal(getMenuAssetUrl("logo.webp"), "/assets/menu/logo.webp");
});

test("menu artwork exists in the public directory served by the URL builder", () => {
  const publicMenuAssets = fileURLToPath(new URL("../../public/assets/menu/", import.meta.url));
  for (const filename of ["background.webp", "close.webp", "laboratory.webp", "logo.webp", "play.webp", "settings.webp", "shop.webp"]) {
    assert.equal(existsSync(`${publicMenuAssets}/${filename}`), true, `${filename} must be served from public/assets/menu`);
  }
});
