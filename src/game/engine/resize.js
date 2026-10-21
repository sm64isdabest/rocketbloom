export function fitCanvasToContainer(canvas) {
  const parent = canvas.parentElement;
  if (!parent) {
    return { width: canvas.clientWidth, height: canvas.clientHeight, dpr: 1 };
  }

  const rect = parent.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const cssWidth = Math.max(1, Math.floor(rect.width));
  const cssHeight = Math.max(1, Math.floor(rect.height));
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
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { width: cssWidth, height: cssHeight, dpr };
}
