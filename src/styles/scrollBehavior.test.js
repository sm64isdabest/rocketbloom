import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheet = await readFile(new URL("./index.css", import.meta.url), "utf8");

function ruleFor(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = stylesheet.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected a CSS rule for ${selector}`);
  return match[1];
}

test("non-settings screens cannot scroll in either direction", () => {
  for (const selector of ["html, body, #root", ".screen", ".screen--section", ".menu.screen--home", ".debug-menu__body"]) {
    const rule = ruleFor(selector);
    assert.match(rule, /overflow(?:-x|-y)?:\s*hidden\b/);
  }
});

test("the settings content remains scrollable inside its popup", () => {
  assert.match(ruleFor(".settings-popup__content"), /overflow-y:\s*auto\b/);
});
