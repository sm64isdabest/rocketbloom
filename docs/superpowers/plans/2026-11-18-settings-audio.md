# Settings Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize RocketBloom settings and deliver four responsive, functional audio controls while preserving saved volume levels.

**Architecture:** Extend persisted settings with an independent interface-sounds switch and a global mute switch. The audio manager gates music, gameplay effects, and interface clicks separately; the settings UI keeps configured music/effects volumes intact while global mute is on and restores their previous states when turned off. Existing tabs, modal structure, assets, and design language remain in place.

**Tech Stack:** React 19, CSS, Node.js built-in test runner, Vite.

**Spec:** `docs/superpowers/specs/2026-11-18-settings-audio-design.md`

## Global Constraints

- Preserve the four settings tabs, centered navy panel, blue glow, translucent backdrop, cartoon close button, and existing settings behavior.
- Audio settings changes apply immediately and survive reloads.
- Global mute must preserve individual music/effects volumes and restore them when disabled.
- Keep controls responsive, keyboard accessible, and consistent with the current interface.
- Add no dependencies.

## Review Focus

- Older saved profiles missing new booleans still load with safe enabled defaults: test storage migration.
- Setting either volume to zero and raising it again updates its channel without losing the chosen nonzero level: test volume and enabled-state behavior.
- Interface clicks can be switched independently of gameplay effects: test distinct audio gating.
- Global mute suppresses every channel and restoring it returns previous channel states and volumes: test preference transition behavior.
- Narrow viewports do not clip the four cards or tabs: inspect a mobile-sized rendered view after build.

---

### Task 1: Persist the new audio preferences

**Files:**
- Modify: `src/utils/storage.js`
- Test: `src/utils/storage.test.js`

**Interfaces:**
- Produces settings `interfaceSounds: boolean` and `muteAll: boolean`, defaulting to `true` and `false` respectively.

- [x] **Step 1: Write failing tests** for default values, migration of a valid legacy profile without the two keys, and round-trip persistence of explicit false values.
- [x] **Step 2: Run `node --test src/utils/storage.test.js`** and confirm failures identify missing preference fields.
- [x] **Step 3: Implement defaults and migration** while retaining existing volume sanitization and settings.
- [x] **Step 4: Run `node --test src/utils/storage.test.js`** and confirm all storage tests pass.

### Task 2: Separate interface sounds and implement global mute

**Files:**
- Modify: `src/game/audio/audioManager.js`
- Test: `src/game/audio/audioManager.test.js`

**Interfaces:**
- Consumes: `interfaceSounds` and `muteAll` from persisted preferences.
- Produces: `configureAudio(nextPreferences)` gates all three audio channels; `playGameSound(name)` continues to emit game effects, while a new `playInterfaceSound(name)` emits interface feedback.

- [x] **Step 1: Write failing tests** for interface sounds being independent from gameplay effects, all channels being muted by `muteAll`, and existing volumes being restored after unmuting.
- [x] **Step 2: Run `node --test src/game/audio/audioManager.test.js`** and confirm these assertions fail for missing behavior.
- [x] **Step 3: Implement channel gating** and route only interface click feedback through the new interface sound function.
- [x] **Step 4: Run `node --test src/game/audio/audioManager.test.js`** and confirm existing audio behavior and new cases pass.

### Task 3: Reorganize the settings UI

**Files:**
- Modify: `src/screens/SettingsScreen.jsx`
- Create: `src/screens/settingsModel.js`
- Test: `src/screens/settingsModel.test.js`
- Modify: `src/styles/index.css`
- Test: `src/styles/settingsResponsive.test.js`
- Inspect call sites: `src/App.jsx`, menu/tab controls that trigger click audio

**Interfaces:**
- Consumes and updates the two new preferences through the existing `onChange(partialSettings)` callback.
- Audio tab displays four cards: music slider, effects slider, interface-sounds switch, and global mute switch; every option has a decorative icon and concise explanatory text.

- [x] **Step 1: Implement semantic audio control markup** with labels, descriptions, accessible slider values, switch state, and spacing classes.
- [x] **Step 2: Implement responsive styling** for balanced card spacing, subtle separators, brighter selected tab, and narrow screens while preserving the modal shell.
- [x] **Step 3: Run `npm test`** and confirm the full unit suite passes (183 tests after review fixes).
- [x] **Step 4: Run `npm run build`** and confirm Vite builds without errors.
- [x] **Step 5: Present the audio tab** at desktop and mobile sizes for visual review. Browser preview was blocked by the local-address policy, so matching desktop and mobile SVG mockups are included as deliverables.

### Task 4: Final review and delivery

**Files:** all files above plus the approved spec and plan.

- [x] **Step 1: Run `npm test` and `npm run build`** after review fixes; 183 tests passed and Vite build succeeded.
- [x] **Step 2: Inspect `git diff` and `git status`** to ensure only intended changes are included.
- [x] **Step 3: Commit the review fixes** with a focused message, then push the completed commits to the configured upstream (`origin/main`, through `aef37ea`).
