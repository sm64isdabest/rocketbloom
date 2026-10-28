# Feedback de dano Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a red fading blink and strong visual shake to the rocket after collisions and wrong answers, plus a localized mini explosion on collision.

**Architecture:** Keep damage animation state on `Rocket`; trigger it from the two existing damage paths in `GameEngine`. Apply shake only to canvas rendering so movement, hitboxes, and controls stay unchanged. Reuse the existing particle system with a larger warm-colored burst for collisions.

**Tech Stack:** JavaScript ES modules, Canvas 2D, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-28-feedback-de-dano-design.md`

## Global Constraints

- Use the existing canvas and update/render loops; add no dependencies.
- Both damage events tint and shake the rocket with a gradual fade-out; only collisions create the localized explosion.
- Respect reduced motion and keep gameplay rules, controls, and collision geometry unchanged.

## Review Focus

- Damage state must fade to zero and must not leak into a new run — cover in Rocket and engine tests.
- Render shake must not mutate the rocket's gameplay coordinates — assert coordinates remain stable while damage feedback renders.
- Reduced-motion mode must retain readable damage feedback without shake — cover in a render test.
- Repeated collision detection must trigger one penalty and one explosion — existing collision test plus particle-count assertion.
- Wrong answers and unanswered rounds both resolve through the same incorrect-answer path — existing answer test plus damage-state assertion.

---

### Task 1: Rocket damage animation

**Files:**
- Modify: `src/game/entities/Rocket.js`
- Test: `src/game/entities/Rocket.test.js`

**Interfaces:**
- Add `triggerDamageFeedback(durationMs = 900)` to start/restart the animation.
- Add `updateDamageFeedback(dt)` where `dt` is seconds, reducing its remaining duration to zero.
- Track the remaining duration on the rocket; derive a normalized fade strength for rendering.

- [ ] **Step 1: Write failing Rocket tests**
  - `rocket damage feedback fades out and clamps at zero`: trigger, advance partway, assert remaining time decreases, advance past expiry, assert zero.
  - `rocket damage render tints and shakes without changing gameplay position`: render an active effect; assert the red tint and render transform are used, while `x` and `y` stay unchanged.
  - `reduced motion keeps red damage tint but omits shake`: render active damage with reduced motion and assert tint is drawn without damage translation.
- [ ] **Step 2: Run `node --test src/game/entities/Rocket.test.js` and confirm the new tests fail for missing behavior.**
- [ ] **Step 3: Implement the animation state and canvas-only rendering in `Rocket.js`.** Use a strong short-lived shake (up to 8 canvas pixels) that decays with remaining time; disable shake for reduced motion, while preserving the red fade. Ensure canvas save/restore contains all transform and tint state.
- [ ] **Step 4: Run `node --test src/game/entities/Rocket.test.js`; expect all Rocket tests to pass.**

### Task 2: Trigger feedback from damage events

**Files:**
- Modify: `src/game/engine/GameEngine.js`
- Test: `src/game/engine/GameEngine.test.js`

**Interfaces:**
- Consume `rocket.triggerDamageFeedback(durationMs)` from Task 1.
- Advance damage feedback by `frameSeconds` once per active engine tick.

- [ ] **Step 1: Add failing engine assertions**
  - Extend `resposta incorreta pisca vermelho sem recompensa e acerto respeita o limite de velocidade` to assert a wrong answer starts rocket damage feedback.
  - Extend `obstáculo aplica uma penalidade por colisão e a pausa congela perigos e efeitos` to assert collision starts feedback and creates a localized burst of at least 20 particles, with one penalty/burst after a repeated tick.
- [ ] **Step 2: Run `node --test src/game/engine/GameEngine.test.js` and confirm the new assertions fail because triggers/burst are missing.**
- [ ] **Step 3: Trigger feedback when resolving an incorrect answer and on obstacle collision; enlarge the collision burst to 24 warm red/orange particles. Advance the Rocket feedback timer once per active tick so it expires naturally and pauses with the engine.**
- [ ] **Step 4: Run `node --test src/game/engine/GameEngine.test.js`; expect all engine tests to pass.**

### Task 3: Full verification and delivery

**Files:**
- Verify all changes and the design/plan docs.

- [ ] **Step 1: Run `npm test`; expect all tests to pass.**
- [ ] **Step 2: Run `npm run build`; expect Vite build to exit successfully.**
- [ ] **Step 3: Review `git diff` and `git status`; ensure only the intended design, plan, and feedback changes are present.**
- [ ] **Step 4: Commit the completed changes and push `main` to `origin`.**
