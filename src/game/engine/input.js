import { INPUT, ROCKET } from "../config/gameConfig.js";

const TAP_TOLERANCE_PX = 8;

export function createInputController(target, controlMode = "pointer", prepareTap, selectAnswerLane) {
  let activeControlMode = controlMode;
  let enabled = true;
  let pauseRequested = false;
  const state = {
    pointerX: null,
    pointerActive: false,
    tap: null,
    keys: new Set(),
  };

  const onPointerDown = (event) => {
    if (!enabled || event.isPrimary === false || (event.button ?? 0) !== 0) return;
    state.pointerActive = true;
    state.pointerX = event.clientX;
    state.tap = { x: event.clientX, y: event.clientY, id: event.pointerId, commit: prepareTap?.(event.clientX, event.clientY) };
    target.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!enabled || event.isPrimary === false) return;
    if (!state.pointerActive && event.pointerType === "mouse") {
      state.pointerX = event.clientX;
      return;
    }
    if (state.pointerActive) {
      state.pointerX = event.clientX;
    }
    if (state.tap && Math.hypot(event.clientX - state.tap.x, event.clientY - state.tap.y) > TAP_TOLERANCE_PX) {
      state.tap = null;
    }
  };

  const cancelPointer = (event) => {
    if (event?.isPrimary === false) return;
    state.pointerActive = false;
    state.tap = null;
  };

  const onPointerUp = (event) => {
    if (!enabled || event.isPrimary === false || (event.button ?? 0) !== 0) return;
    const start = state.tap;
    cancelPointer();
    if (start && start.id === event.pointerId
      && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= TAP_TOLERANCE_PX) {
      start.commit?.();
    }
  };

  const onKeyDown = (event) => {
    if (!enabled || event.defaultPrevented) return;
    if (selectAnswerLane && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey
      && /^[1-4]$/.test(event.key) && selectAnswerLane(Number(event.key) - 1)) {
      event.preventDefault();
      return;
    }
    if (["ArrowLeft", "ArrowRight", "Escape"].includes(event.key)) event.preventDefault();
    if (event.key === "Escape" || event.key.toLowerCase() === "p") {
      pauseRequested ||= !event.repeat;
      return;
    }
    state.keys.add(event.key);
  };

  const onKeyUp = (event) => {
    state.keys.delete(event.key);
  };

  const onWindowBlur = () => {
    pauseRequested = false;
    state.keys.clear();
    cancelPointer();
  };

  target.addEventListener("pointerdown", onPointerDown);
  target.addEventListener("pointermove", onPointerMove);
  target.addEventListener("pointerup", onPointerUp);
  target.addEventListener("pointercancel", cancelPointer);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);

  return {
    setControlMode(nextControlMode) {
      if (activeControlMode === nextControlMode) return;
      activeControlMode = nextControlMode;
      state.pointerX = null;
      cancelPointer();
    },
    setEnabled(nextEnabled) {
      enabled = nextEnabled;
      if (!enabled) {
        pauseRequested = false;
        state.keys.clear();
        state.pointerX = null;
        cancelPointer();
      }
    },
    apply(rocket, canvas, dt, scale = 1) {
      const rect = canvas.getBoundingClientRect();
      if (activeControlMode === "pointer" && state.pointerX != null) {
        const localX = ((state.pointerX - rect.left) / rect.width) * canvas.clientWidth / scale;
        const nextX = localX - rocket.width / 2;
        if (Math.abs(nextX - rocket.x) > INPUT.pointerDeadZone) {
          rocket.targetX = nextX;
        }
      }

      let keyboardDir = 0;
      if (state.keys.has("ArrowLeft") || state.keys.has("a") || state.keys.has("A")) {
        keyboardDir -= 1;
      }
      if (state.keys.has("ArrowRight") || state.keys.has("d") || state.keys.has("D")) {
        keyboardDir += 1;
      }
      if (keyboardDir !== 0) {
        rocket.targetX += keyboardDir * ROCKET.keyboardStep * dt;
      }
    },
    wantsPause() {
      return pauseRequested;
    },
    consumePause() {
      pauseRequested = false;
    },
    destroy() {
      target.removeEventListener("pointerdown", onPointerDown);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
      target.removeEventListener("pointercancel", cancelPointer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      state.keys.clear();
    },
  };
}
