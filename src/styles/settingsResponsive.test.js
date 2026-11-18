import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheet = await readFile(new URL("./index.css", import.meta.url), "utf8");

test("mobile settings tabs reserve enough room for every horizontal label", () => {
  assert.match(
    stylesheet,
    /@media \(max-width: 540px\) \{[\s\S]*?\.settings-popup__tabs\s*\{[^}]*gap:\s*3px/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 540px\) \{[\s\S]*?\.settings-popup__tab\s*\{[^}]*font-size:\s*clamp\(\.43rem, 2\.1vw, \.55rem\)/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 360px\) \{[\s\S]*?\.settings-popup__content\s*\{[^}]*padding-right:\s*16px;[^}]*padding-left:\s*16px/,
  );
});
