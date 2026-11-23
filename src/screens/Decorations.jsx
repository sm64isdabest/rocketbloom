import { useState } from "react";
import { getHighestGoldGoal } from "../game/systems/goalSystem.js";

export function Decorations({ total }) {
  const [failedOverlay, setFailedOverlay] = useState(null);
  const goal = getHighestGoldGoal(total);
  if (!goal || goal.overlay === failedOverlay) return null;

  return (
    <img className="gold-decorations" alt="" aria-hidden="true" draggable="false" src={goal.overlay}
      data-treasure-level={goal.treasure.level} style={{ "--treasure-level": goal.treasure.level }}
      onError={() => setFailedOverlay(goal.overlay)} />
  );
}
