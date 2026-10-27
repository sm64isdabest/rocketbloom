import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getMenuAssetUrl } from "./menuModel.js";

test("menu assets respect the configured app base path", () => {
  assert.equal(getMenuAssetUrl("gear.png", "/rocketbloom/"), "/rocketbloom/assets/menu/gear.png");
  assert.equal(getMenuAssetUrl("logo.png", "/rocketbloom"), "/rocketbloom/assets/menu/logo.png");
  assert.equal(getMenuAssetUrl("logo.png"), "/assets/menu/logo.png");
});

test("menu artwork exists in the public directory served by the URL builder", () => {
  const publicMenuAssets = fileURLToPath(new URL("../../public/assets/menu/", import.meta.url));
  for (const filename of ["background.png", "laboratory.png", "logo.png", "play.png", "settings.png", "shop.png"]) {
    assert.equal(existsSync(`${publicMenuAssets}/${filename}`), true, `${filename} must be served from public/assets/menu`);
  }
});
