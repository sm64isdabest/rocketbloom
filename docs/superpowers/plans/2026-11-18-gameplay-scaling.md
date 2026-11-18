# Gameplay Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep gameplay object sizes and interactions proportional across viewport widths.

**Architecture:** Render the canvas with a uniform scale equal to the smaller viewport-to-design ratio (`VIEW.designWidth` × `VIEW.designHeight`). Keep the engine and collision math in logical coordinates and convert pointer positions at the input boundary.

**Tech Stack:** JavaScript ES modules, Canvas 2D, Node test runner, Vite.

**Spec:** `docs/superpowers/specs/2026-11-18-gameplay-scaling-design.md`

## Global Constraints
- Preserve `VIEW.designWidth` (390) as logical gameplay width.
- Preserve gameplay speeds and timers.
- Keep canvas backing resolution adapted to device pixel ratio.

## Review Focus
- DPR must affect backing resolution but not logical gameplay dimensions.
- Pointer must map to the same logical location at different CSS widths.
- Resize must keep logical width fixed and update logical height.
- Existing gameplay tests and production build must pass.

### Task 1: Canvas logical coordinate scaling

**Files:** Modify `src/game/engine/resize.js`; test `src/game/engine/resize.test.js`.

- [ ] Add tests for narrow and landscape viewports using the smaller width/height ratio; assert the logical viewport matches CSS dimensions divided by scale and DPR changes backing dimensions only.
- [ ] Run the focused tests and confirm they fail for the missing scale behavior.
- [ ] Implement scale-aware canvas sizing and logical dimensions in `fitCanvasToContainer`.
- [ ] Run focused tests and confirm they pass.

### Task 2: Engine and pointer integration

**Files:** Modify `src/game/engine/input.js` and `src/game/engine/GameEngine.js`; test `src/game/engine/input.test.js` and `src/game/engine/GameEngine.test.js`.

- [ ] Add pointer mapping coverage for a scaled 320 px CSS viewport.
- [ ] Integrate logical scale in engine resize placement and pointer conversion.
- [ ] Run `npm test` and `npm run build`.
- [ ] Review diff, then commit the implementation and docs.
