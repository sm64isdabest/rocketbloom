export const ORBIT_PERIOD_SECONDS = 6;
const TAU = Math.PI * 2;

export function smoothTarget(current, destination, deltaSeconds, easing = 4.5) {
  const amount = 1 - Math.exp(-Math.max(0, deltaSeconds) * easing);
  return {
    x: current.x + (destination.x - current.x) * amount,
    y: current.y + (destination.y - current.y) * amount,
  };
}

export function getRocketOrbitPose(elapsedSeconds, target, options = {}) {
  const {
    radiusX = 48,
    radiusY = 30,
    periodSeconds = ORBIT_PERIOD_SECONDS,
    phaseOffset = 0,
    reducedMotion = false,
  } = options;
  const center = target ?? { x: 0, y: 0 };

  const angularSpeed = TAU / Math.max(0.001, periodSeconds);
  const angle = reducedMotion ? 0 : (elapsedSeconds * angularSpeed + phaseOffset) % TAU;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const velocityX = -radiusX * sin * angularSpeed;
  const velocityY = radiusY * cos * angularSpeed;
  const depthVelocity = cos * angularSpeed;
  const rotationZ = Math.atan2(velocityY, velocityX) - Math.PI / 2;

  return {
    x: center.x + radiusX * cos,
    y: center.y + radiusY * sin,
    depth: sin,
    scale: 1 + sin * 0.12,
    rotationX: reducedMotion ? 0 : Math.atan2(depthVelocity, Math.hypot(velocityX, velocityY)) * 0.45,
    rotationY: reducedMotion ? 0 : cos * 0.28,
    rotationZ: reducedMotion ? 0 : rotationZ,
  };
}
