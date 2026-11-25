import { useLayoutEffect, useRef } from "react";
import { ASTRONAUT_POINTER } from "../game/data/missionIntro.js";

const APP_BASE = import.meta.env.BASE_URL;

export function PhaseSelectionGuide({ kind, targetRef, message }) {
  const guideRef = useRef(null);

  useLayoutEffect(() => {
    const guide = guideRef.current;
    const target = targetRef.current;
    if (!target) return undefined;
    const button = target.matches("button") ? target : target.querySelector("button");
    button?.focus({ preventScroll: true });

    const align = () => {
      const { left, top } = guide.getBoundingClientRect();
      const bounds = target.getBoundingClientRect();
      guide.style.setProperty("--guide-x", `${bounds.left - left + bounds.width / 2}px`);
      guide.style.setProperty("--guide-y", `${bounds.top - top + bounds.height / 2}px`);
      guide.style.setProperty("--guide-width", `${bounds.width}px`);
      guide.style.setProperty("--guide-height", `${bounds.height}px`);
    };
    align();
    const resize = new ResizeObserver(align);
    resize.observe(guide);
    resize.observe(target);
    return () => resize.disconnect();
  }, [targetRef]);

  return (
    <div ref={guideRef} className={`phase-selection-guide phase-selection-guide--${kind}`}>
      <p className="phase-selection-guide__hint" id="phase-selection-guide-hint" role="status">{message}</p>
      <div className="phase-selection-guide__target" aria-hidden="true">
        <img src={`${APP_BASE}${ASTRONAUT_POINTER.slice(1)}`} alt="" draggable={false} />
      </div>
    </div>
  );
}
