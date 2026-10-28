import test from "node:test";
import assert from "node:assert/strict";
import { getActiveQuestion } from "./hudModel.js";

test("não exibe a pergunta do intervalo entre rodadas", () => {
  assert.equal(getActiveQuestion({ question: null }), null);
});

test("exibe o enunciado da rodada ativa", () => {
  const question = { id: "q-1", prompt: "Quanto é 7 + 5?" };
  assert.equal(getActiveQuestion({ question }), question);
});
