# Menu de debug global Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expor controles completos da sessão e navegação para qualquer tela pelo menu Q+P.

**Architecture:** Manter `DebugMenu` como UI, encaminhando ações pela `App` para progresso e uma referência imperativa ao `GameEngine`. Manter velocidade, duração e GODMODE somente na instância da sessão.

**Tech Stack:** React 19, Vite, JavaScript ES modules, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-11-debug-menu-design.md`

## Global Constraints

- Trabalhar na branch `main`, sem criar branch isolada.
- Interface e rótulos em português.
- Duração zero representa fase infinita.
- Usar os poderes existentes em `POWER_UPS`.

## Review Focus

- Desconcluir uma fase sem deixar seu progresso registrado: testar remoção de id e progresso.
- Fase infinita sem divisão por infinito: testar controle do motor e snapshot.
- Ativar shrink sem caixa aleatória: testar efeito imediato nos obstáculos e HUD.
- Abrir Q+P em estado pós-boot e navegar: validar integração e destinos no build.
- Fechar o menu em qualquer tela: validar retorno preservado no fluxo central.

---

### Task 1: Utilitários de progresso

**Files:**
- Modify: `src/utils/debugTools.js`
- Test: `src/utils/debugTools.test.js`

**Interfaces:**
- Produces `uncompleteDebugStage(progress, planetId, stageId)`.

- [x] **Step 1: Write the failing test** — `debug stage can be uncompleted without changing unlocked planets`; remove a phase id and stage progress while preserving unlocked planets and all other completed ids.
- [x] **Step 2: Run test to verify it fails** — the missing export caused the expected failure.
- [x] **Step 3: Implement** — validate stage belongs to the planet, filter the id, set that phase progress to zero, preserve all other state.
- [x] **Step 4: Run test to verify it passes** — regression test passes.
- [x] **Step 5: Run task suite** — all tests pass.

### Task 2: Controles da sessão de jogo

**Files:**
- Modify: `src/game/engine/GameEngine.js`
- Test: `src/game/engine/GameEngine.test.js`

**Interfaces:**
- Expose engine methods `setDebugSpeed(speed)`, `setDebugGodmode(enabled)`, `setDebugDuration(durationMs)`, and `grantDebugPowerUp(power)`.
- `durationMs` is positive finite or `0`/`Infinity`; the engine snapshot exposes `speed`, `godmode`, and `stageDurationMs`.

- [x] **Step 1: Write failing tests** — finite/infinite duration and speed, GODMODE penalties and zero-speed survival, immediate activation of each power.
- [x] **Step 2: Run tests to verify they fail** — the missing debug APIs caused the expected failures.
- [x] **Step 3: Implement** — use stage-local duration in progress calculations, keep infinite progress at zero, bypass damage and defeat under GODMODE, and apply each effect including shrink.
- [x] **Step 4: Run tests to verify they pass** — focused engine suite passes.
- [x] **Step 5: Run task suite** — all tests pass.

### Task 3: Menu global e navegação

**Files:**
- Modify: `src/App.jsx`, `src/screens/PlayScreen.jsx`, `src/components/GameCanvas.jsx`, `src/screens/DebugMenu.jsx`, `src/styles/index.css`

**Interfaces:**
- Pass an engine control reference from `GameCanvas` through `PlayScreen` to `App`.
- `DebugMenu` receives live run state, `onSetSpeed`, `onSetGodmode`, `onSetDuration`, `onGrantPowerUp`, `onUncompleteStage`, and `onNavigate` callbacks.

- [x] **Step 1: Add controls** — speed, GODMODE, duration with infinite option, all powers, and uncomplete action.
- [x] **Step 2: Add screen selector** — menu, phase selection, laboratory, settings, play, pause, victory and defeat.
- [x] **Step 3: Enable Q+P on every screen with a profile** — preserve return screen and close behavior, including boot/error overlays.
- [x] **Step 4: Add integration where feasible and run build** — Vite build passes with the existing large-chunk warning.
- [x] **Step 5: Run full tests** — 143/143 pass.
- [ ] **Step 6: Review diff and commit/push** — commit to `main`, then push `origin main`.
