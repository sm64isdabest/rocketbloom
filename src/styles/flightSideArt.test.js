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

test("flight screen fills the viewport and keeps its game canvas centered", () => {
  assert.match(ruleFor(".play"), /width:\s*100%/);
  assert.match(ruleFor(".play__stage"), /width:\s*min\(100%,\s*1080px\)/);
  assert.match(ruleFor(".play__stage"), /margin-inline:\s*auto/);
});

test("flight blurs the scenery outside the stage and defines both edges", () => {
  assert.match(ruleFor(".play__backdrop"), /filter:\s*blur\(/);
  assert.match(ruleFor(".play__stage::after"), /border-inline:/);
  assert.doesNotMatch(stylesheet, /flight-side-(left|right)\.webp/);
});
