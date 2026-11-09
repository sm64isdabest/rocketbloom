export function clampFloatingPosition(position, viewport, size) {
  return {
    x: Math.max(0, Math.min(position.x, Math.max(0, viewport.width - size.width))),
    y: Math.max(0, Math.min(position.y, Math.max(0, viewport.height - size.height))),
  };
}

export function readFloatingPosition(serialized) {
  if (!serialized) return null;
  try {
    const position = JSON.parse(serialized);
    if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y) || position.x < 0 || position.y < 0) return null;
    return { x: position.x, y: position.y };
  } catch {
    return null;
  }
}
