# Laboratório orbital Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the laboratory as the reference's animated single-plant planet selector.

**Architecture:** Keep planet/stage image mapping in a small tested model, render one responsive full-screen laboratory scene in `CommandRoomScreen`, and keep navigation state local to that screen. Add laboratory art to the project preload list and route the reference settings control through the existing settings screen.

**Tech Stack:** React 19, Vite, CSS, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-11-laboratorio-orbital.md`.

## Global Constraints

- Stay on `main`; do not create an isolated branch.
- Respect the existing reduced-motion setting and system preference.
- Preserve rescued plant and growth progress.
- Use the exact supplied background and plant artwork.

## Review Focus

- Planet navigation wraps from Netuno to Terra and Terra to Netuno.
- Growth stage values outside the range select the nearest available sprite.
- Narrow screens keep the plant, arrows, and labels visible.
- Reduced motion disables plant sway.
- Settings returns to the laboratory.

### Task 1: Map plant artwork to saved growth stages

**Files:** Create `src/screens/laboratoryModel.js` and `src/screens/laboratoryModel.test.js`; add art to `src/game/data/projectImages.js`.

- [x] Test each planet's ordered sprite mapping and stage clamping.
- [x] Implement `getLaboratoryPlantImage(planetId, growthStage, baseUrl)`.
- [x] Run focused Node tests.

### Task 2: Rebuild the laboratory scene

**Files:** Modify `src/screens/CommandRoomScreen.jsx`, `src/styles/index.css`, `src/App.jsx`, and `src/components/FullscreenButton.jsx`.

- [x] Render the full-screen scene, one animated plant, wrapping planet arrows, names, back, and settings controls.
- [x] Keep sprites and plant metadata synchronized with the selected planet and saved progress.
- [x] Add responsive and reduced-motion styles.
- [x] Run focused tests and the full suite, then build.

### Task 3: Verify and publish on main

- [x] Inspect the diff and run tests and production build.
- [ ] Commit the finished change on `main` and push `main`.
