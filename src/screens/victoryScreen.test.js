import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const source = readFileSync(fileURLToPath(new URL("./VictoryScreen.jsx", import.meta.url)), "utf8");

test("tela de vitória usa Nível Concluído e mantém o título do voo infinito", () => {
  assert.match(source, /endless \? "Fim do voo" : "Nível Concluído!"/);
  assert.doesNotMatch(source, /Fase concluída!/);
});
