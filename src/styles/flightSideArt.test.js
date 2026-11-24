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
  assert.match(left, /background-image:\s*url\([^)]*flight-side-left\.webp["']?\)/);
  assert.match(right, /background-image:\s*url\([^)]*flight-side-right\.webp["']?\)/);
  const [leftImage, rightImage] = await Promise.all(
    ["left", "right"].map((side) => readFile(new URL(`../assets/flight-side-${side}.webp`, import.meta.url))),
  );
  assert.equal(leftImage.toString("ascii", 8, 12), "WEBP");
  assert.equal(rightImage.toString("ascii", 8, 12), "WEBP");
  assert.notDeepEqual(leftImage, rightImage);
});
