# Apresentação da seleção de powerup — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a faixa de ícones da roleta por um cartão 1:1 com imagens e saída animada de zoom e fade.

**Architecture:** O GameEngine carregará as quatro artes de powerup e desenhará um cartão arredondado no canvas, usando o poder em rotação durante o sorteio e o escolhido durante uma janela temporizada de saída. Testes de GameEngine verificarão a apresentação com os recursos falsos de canvas já existentes.

**Tech Stack:** JavaScript ES modules, canvas 2D, node:test.

**Spec:** `docs/superpowers/specs/2026-11-11-powerup-roulette-design.md`

## Global Constraints

- Reutilizar os assets e a base de URL já usados no jogo.
- Preservar a duração de roleta de 1000 ms e os efeitos existentes dos poderes.
- Respeitar movimento reduzido, sem remover a legibilidade do cartão.

## Review Focus

- O app servido em subpath deve carregar os PNGs pela base configurada.
- O cartão deve continuar quadrado e legível nas dimensões variadas do canvas.
- O fim da roleta deve exibir o poder sorteado, sem uma imagem incorreta ou estado preso.
- Movimento reduzido deve manter a imagem legível sem movimento de zoom/fade.

---

### Task 1: Seleção visual no canvas

**Files:**
- Modify: `src/game/engine/GameEngine.js`
- Modify: `src/game/engine/GameEngine.test.js`
- Modify: `src/game/config/gameConfig.js` only if a reveal duration constant is useful

**Interfaces:**
- Consumes: `APP_BASE` and `MYSTERY_BOX.rouletteMs`.
- Produces: image-backed roulette and selection reveal state rendered by `GameEngine`.

- [x] **Step 1: Write failing tests** for image loading/rendering, roulette selection reveal, and cleanup after the reveal interval.
- [x] **Step 2: Run `node --test src/game/engine/GameEngine.test.js`** and confirm the new assertions fail on current behavior.
- [x] **Step 3: Implement the timed selection reveal and square rounded card with existing powerup images.** Use image-space padding, white stroke, rounded corners, and a smooth zoom/fade only when motion is enabled.
- [x] **Step 4: Run `node --test src/game/engine/GameEngine.test.js`** and confirm it passes.
- [x] **Step 5: Run `npm test` and `npm run build`.**
- [x] **Step 6: Review the diff, stage the requested implementation and docs, commit on `main`, and push to `origin/main`.**

## Review note

- Minor deferred: the card keeps the prior roulette's vertical anchor (`42%` of canvas height plus 36 px) to match the supplied reference. On unusually tall canvases it may sit above the geometric center.
