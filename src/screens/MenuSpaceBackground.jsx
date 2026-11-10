import { useEffect, useRef } from "react";
import { createMenuSpaceAnimation } from "./menuSpaceAnimation.js";

export function MenuSpaceBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation = null;
    const startAnimation = () => {
      animation?.stop();
      animation = createMenuSpaceAnimation(canvas, { reducedMotion: motionPreference.matches });
      animation.start();
    };
    const resizeObserver = new ResizeObserver(() => animation?.resize());
    const resizeWindow = () => animation?.resize();
    const resetPointer = () => animation?.setPointer(0, 0);
    const movePointer = (event) => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      animation?.setPointer(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      );
    };

    resizeObserver.observe(canvas.parentElement);
    window.addEventListener("resize", resizeWindow);
    window.addEventListener("pointermove", movePointer, { passive: true });
    window.addEventListener("pointerup", resetPointer);
    window.addEventListener("blur", resetPointer);
    motionPreference.addEventListener("change", startAnimation);
    startAnimation();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeWindow);
      window.removeEventListener("pointermove", movePointer);
      window.removeEventListener("pointerup", resetPointer);
      window.removeEventListener("blur", resetPointer);
      motionPreference.removeEventListener("change", startAnimation);
      animation?.stop();
    };
  }, []);

  return <canvas ref={canvasRef} className="menu__space-canvas" aria-hidden="true" />;
}
