import { INPUT, ROCKET } from "../config/gameConfig.js";

export function createInputController(target, controlMode = "pointer") {
  const state = {
    pointerX: null,
    pointerActive: false,
    keys: new Set(),
  };

  const onPointerDown = (event) => {
    state.pointerActive = true;
    state.pointerX = event.clientX;
    target.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!state.pointerActive && event.pointerType === "mouse") {
      state.pointerX = event.clientX;
      return;
    }
    if (state.pointerActive) {
      state.pointerX = event.clientX;
    }
  };

  const onPointerUp = () => {
    state.pointerActive = false;
  };

  const onKeyDown = (event) => {
    if (["ArrowLeft", "ArrowRight", "Escape", " "].includes(event.key)) event.preventDefault();
    state.keys.add(event.key);
  };

  const onKeyUp = (event) => {
    state.keys.delete(event.key);
  };

  const onWindowBlur = () => {
    state.keys.clear();
    state.pointerActive = false;
  };

  target.addEventListener("pointerdown", onPointerDown);
  target.addEventListener("pointermove", onPointerMove);
  target.addEventListener("pointerup", onPointerUp);
  target.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);

  return {
    apply(rocket, canvas, dt) {
      const rect = canvas.getBoundingClientRect();
      if (controlMode === "pointer" && state.pointerX != null) {
        const localX = ((state.pointerX - rect.left) / rect.width) * canvas.clientWidth;
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
      return state.keys.has("Escape") || state.keys.has("p") || state.keys.has("P");
    },
    consumePause() {
      state.keys.delete("Escape");
      state.keys.delete("p");
      state.keys.delete("P");
    },
    destroy() {
      target.removeEventListener("pointerdown", onPointerDown);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
      target.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      state.keys.clear();
    },
  };
}
