export const ORBIT_PERIOD_SECONDS = 6;
const TAU = Math.PI * 2;

export function smoothTarget(current, destination, deltaSeconds, easing = 4.5) {
  const amount = 1 - Math.exp(-Math.max(0, deltaSeconds) * easing);
  return {
    x: current.x + (destination.x - current.x) * amount,
    y: current.y + (destination.y - current.y) * amount,
  };
}

export function setOrbitTargetElement(targetRef, element) {
  if (!targetRef || !element?.isConnected) return false;
  targetRef.current = element;
  return true;
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
  const worldVelocityY = -velocityY;
  const worldVelocityZ = depthVelocity * 23;
  const velocityLength = Math.hypot(velocityX, worldVelocityY, worldVelocityZ) || 1;
  let quaternion = { x: worldVelocityZ / velocityLength, y: 0, z: -velocityX / velocityLength, w: 1 + worldVelocityY / velocityLength };
  const quaternionLength = Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  quaternion = reducedMotion || quaternionLength < 1e-8
    ? { x: 0, y: 0, z: 0, w: 1 }
    : Object.fromEntries(Object.entries(quaternion).map(([key, value]) => [key, value / quaternionLength]));

  return {
    x: center.x + radiusX * cos,
    y: center.y + radiusY * sin,
    depth: sin,
    scale: 1 + sin * 0.12,
    quaternion,
  };
}
