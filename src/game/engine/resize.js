import { VIEW } from "../config/gameConfig.js";

export function fitCanvasToContainer(canvas) {
  const parent = canvas.parentElement;
  const rect = parent?.getBoundingClientRect();
  const touchScreen = window.matchMedia?.("(pointer: coarse)")?.matches;
  const dpr = Math.min(window.devicePixelRatio || 1, touchScreen ? 1.5 : 2.5);
  const cssWidth = Math.max(1, Math.floor(rect?.width ?? canvas.clientWidth));
  const cssHeight = Math.max(1, Math.floor(rect?.height ?? canvas.clientHeight));
  const scale = Math.min(cssWidth / VIEW.designWidth, cssHeight / VIEW.designHeight);
  const pixelWidth = Math.floor(cssWidth * dpr);
  const pixelHeight = Math.floor(cssHeight * dpr);

  if (canvas.width !== pixelWidth) {
    canvas.width = pixelWidth;
  }
  if (canvas.height !== pixelHeight) {
    canvas.height = pixelHeight;
  }

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

  return { width: cssWidth / scale, height: cssHeight / scale, scale, dpr };
}
