import { getTreasureArt } from "../assets/storageAssets.js";
import { StorageArt } from "../components/StorageArt.jsx";
import { getHighestGoldGoal } from "../game/systems/goalSystem.js";

export function Decorations({ total }) {
  const treasure = getHighestGoldGoal(total)?.treasure;
  if (!treasure) return null;
  const src = getTreasureArt(treasure.level, { floor: true });

  return (
    <div className="gold-decorations" aria-hidden="true" data-treasure-level={treasure.level}
      style={{ "--treasure-level": treasure.level }}>
      <StorageArt src={src} className="gold-decorations__pile gold-decorations__pile--left" />
      <StorageArt src={src} className="gold-decorations__pile gold-decorations__pile--right" />
    </div>
  );
}
