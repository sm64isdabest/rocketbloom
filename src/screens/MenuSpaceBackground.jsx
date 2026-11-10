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

    resizeObserver.observe(canvas.parentElement);
    window.addEventListener("resize", resizeWindow);
    motionPreference.addEventListener("change", startAnimation);
    startAnimation();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeWindow);
      motionPreference.removeEventListener("change", startAnimation);
      animation?.stop();
    };
  }, []);

  return <canvas ref={canvasRef} className="menu__space-canvas" aria-hidden="true" />;
}
