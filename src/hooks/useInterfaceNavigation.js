import { useEffect } from "react";

const DIRECTIONS = {
  arrowleft: [-1, 0], a: [-1, 0],
  arrowright: [1, 0], d: [1, 0],
  arrowup: [0, -1], w: [0, -1],
  arrowdown: [0, 1], s: [0, 1],
};
const CONTROL_SELECTOR = "button, a[href], input, select, textarea, [tabindex='0']";

function getControls(scope) {
  return [...scope.querySelectorAll(CONTROL_SELECTOR)].filter((element) =>
    !element.matches(":disabled, [aria-disabled='true'], [type='hidden'], [tabindex='-1']")
    && !element.closest("[inert], [hidden], [aria-hidden='true']")
    && element.getClientRects().length > 0
    && getComputedStyle(element).visibility === "visible");
}

function getDirectionalControl(controls, current, [dx, dy]) {
  const rect = current.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  let nearest = null;
  let nearestScore = Infinity;

  for (const control of controls) {
    if (control === current) continue;
    const bounds = control.getBoundingClientRect();
    const deltaX = bounds.left + bounds.width / 2 - x;
    const deltaY = bounds.top + bounds.height / 2 - y;
    const forward = deltaX * dx + deltaY * dy;
    if (forward <= 2) continue;
    const sideways = Math.abs(dx ? deltaY : deltaX);
    const score = forward + sideways * 3;
    if (score < nearestScore) {
      nearest = control;
      nearestScore = score;
    }
  }

  return nearest;
}

export function useInterfaceNavigation() {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      const key = event.key.toLowerCase();
      const direction = Object.hasOwn(DIRECTIONS, key) ? DIRECTIONS[key] : null;
      const activate = key === "enter" || key === " ";
      if (!direction && !activate && key !== "tab") return;

      const active = document.activeElement;
      if (active?.matches("textarea, [contenteditable='true'], input:not([type='range'], [type='radio'], [type='checkbox'])")) return;
      const modal = document.querySelector("dialog[open]")
        ?? [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].at(-1);
      if (!modal && direction?.[0] && document.querySelector("[data-flight-active]") && !active?.matches(CONTROL_SELECTOR)) return;
      const scope = modal ?? document.querySelector("[data-guided]") ?? document;
      const controls = getControls(scope);
      if (controls.length === 0) return;
      const current = controls.includes(active) ? active : null;
      const initial = controls.find((control) => control.hasAttribute("data-menu-start"))
        ?? controls.find((control) => !control.classList.contains("fullscreen-float")) ?? controls[0];

      if (key === "tab") {
        if (scope === document || modal instanceof HTMLDialogElement) return;
        const edge = event.shiftKey ? controls[0] : controls.at(-1);
        if (current && current !== edge) return;
        event.preventDefault();
        (event.shiftKey ? controls.at(-1) : controls[0]).focus();
        return;
      }

      if (direction) {
        if (current?.matches('input[type="range"]') && direction[0]) {
          if (key.startsWith("arrow")) return;
          event.preventDefault();
          current.stepUp(direction[0]);
          current.dispatchEvent(new Event("input", { bubbles: true }));
          return;
        }
        event.preventDefault();
        const next = current ? getDirectionalControl(controls, current, direction) : initial;
        next?.focus();
        return;
      }

      if (event.repeat) {
        event.preventDefault();
        return;
      }
      if (!current) {
        event.preventDefault();
        if (active?.matches("[aria-disabled='true'], :disabled")) {
          initial.focus();
          return;
        }
        initial.focus();
        initial.click();
      } else if ((key === " " && current.matches("a[href]")) || (key === "enter" && current.matches('input[type="radio"], input[type="checkbox"]'))) {
        event.preventDefault();
        current.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
