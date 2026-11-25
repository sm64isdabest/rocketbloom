import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheet = await readFile(new URL("./index.css", import.meta.url), "utf8");

test("settings popup grows on desktop and stays within the viewport", () => {
  assert.match(stylesheet, /width: min\(780px, calc\(100vw - 32px\)\)/);
  assert.match(stylesheet, /height: min\(860px, calc\(100dvh - 24px\)\)/);
  assert.match(stylesheet, /\.settings-popup__content\s*\{[^}]*overflow-y:\s*auto/);
  assert.match(stylesheet, /\.settings-popup__close\s*\{[^}]*position:\s*absolute/);
});

test("mobile settings balance five tabs and keep audio controls touch-friendly", () => {
  assert.match(stylesheet, /\.settings-popup__tabs\s*\{[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(stylesheet, /@media \(max-width: 540px\) \{[\s\S]*?\.settings-popup__tabs\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(stylesheet, /@media \(max-width: 540px\) \{[\s\S]*?\.settings-popup__tab\s*\{[^}]*min-height:\s*42px/);
  assert.match(stylesheet, /@media \(max-width: 540px\) \{[\s\S]*?\.settings-popup__audio-switch\s*\{[^}]*min-height:\s*42px/);
  assert.match(stylesheet, /@media \(orientation: landscape\) and \(max-height: 600px\)/);
});

test("Informações e Sobre nós dispensam rolagem em telas de computador", () => {
  assert.match(stylesheet, /\.settings-popup__content--information, \.settings-popup__content--about \{ overflow: hidden; \}/);
  assert.match(stylesheet, /@media \(max-width: 540px\) \{[\s\S]*?\.settings-popup__content--information, \.settings-popup__content--about \{ overflow-y: auto; \}/);
});
