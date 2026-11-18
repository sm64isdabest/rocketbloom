# Temporary Collision Alert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a persistent, animated warning sprite next to the HUD speedometer after obstacle impacts and temporarily slow world motion for two seconds before gradual recovery.

**Architecture:** Keep the normal game speed as the progression baseline and apply a separately timed impact factor to progress, scenery, entities, and the displayed speed. Publish a collision alert sequence and remaining time in the HUD snapshot so one responsive HUD element can restart its CSS animation on repeated impacts.

**Tech Stack:** JavaScript, React, CSS, Node test runner.

**Spec:** User request in this conversation.

## Global Constraints

- Use one warning sprite instance beside the speedometer, never beside the rocket.
- Preserve existing HUD placement, gameplay rules, and obstacle behavior.
- Keep the alert visible while pulsing and shaking; fade it out over about 1.5 seconds.
- Hold reduced speed for about 2 seconds, then restore gradually; repeated impacts restart both effects.

## Review Focus

- Repeated impacts during hold and recovery restart both timers without accumulating speed loss.
- Pause freezes the impact timer.
- Narrow screens keep the sprite adjacent to the speedometer without covering its text.
- An impact protected by a power-up does not trigger either effect.

### Task 1: Collision speed recovery

**Files:** Create `src/game/systems/collisionImpact.js` and its test; modify `src/game/engine/GameEngine.js` and its tests.

- [ ] Test slowdown, two-second hold, gradual recovery, repeated impacts, pause behavior, and protected collisions.
- [ ] Implement a composable temporary speed factor and expose effective speed in the snapshot.
- [ ] Apply the factor to stage progress, scenery, speed streaks, and falling entities while leaving obstacle collisions unchanged.

### Task 2: HUD warning

**Files:** Modify `src/components/Hud.jsx`, `src/components/hudModel.js`, `src/components/hudModel.test.js`, `src/styles/index.css`, and `src/assets.test.js` as needed.

- [ ] Test the warning sprite asset route and file availability.
- [ ] Render one accessible warning image alongside the speedometer only while active; key it by collision sequence to restart animation.
- [ ] Add responsive spacing and a 1.5-second two-level glow, lateral shake, and soft fade animation.

### Task 3: Verify and commit

- [ ] Run the full test suite and production build.
- [ ] Review the diff, commit the feature, and push only if the configured remote and branch permit it.
