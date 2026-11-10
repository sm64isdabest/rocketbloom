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
    const movePointer = (event) => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
      animation?.setPointer(x, y);
      canvas.parentElement.style.setProperty("--menu-pointer-x", x);
      canvas.parentElement.style.setProperty("--menu-pointer-y", y);
    };
    const resetPointer = () => {
      animation?.setPointer(0, 0);
      canvas.parentElement.style.setProperty("--menu-pointer-x", 0);
      canvas.parentElement.style.setProperty("--menu-pointer-y", 0);
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
