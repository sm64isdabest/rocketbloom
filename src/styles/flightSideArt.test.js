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

test("flight side panels use illustrated art on both sides", async () => {
  const left = [...stylesheet.matchAll(/\.play::before\s*\{([^}]*)\}/g)].map((match) => match[1]).join(" ");
  const right = [...stylesheet.matchAll(/\.play::after\s*\{([^}]*)\}/g)].map((match) => match[1]).join(" ");
  assert.match(left, /background-image:\s*url\([^)]*flight-side-left\.svg["']?\)/);
  assert.match(right, /background-image:\s*url\([^)]*flight-side-right\.svg["']?\)/);
  await Promise.all(["left", "right"].map(async (side) => {
    const image = await readFile(new URL(`../assets/flight-side-${side}.svg`, import.meta.url), "utf8");
    assert.match(image, /<svg[\s>]/);
    assert.doesNotMatch(image, /fill=\"black\"/i);
  }));
});
