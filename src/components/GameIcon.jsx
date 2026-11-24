import { getHudAssetUrl } from "./hudModel.js";

const APP_BASE = import.meta.env.BASE_URL;

export function GameIcon({ name, className }) {
  return <img className={className} src={getHudAssetUrl(`controls/${name}.webp`, APP_BASE)} alt="" draggable="false" />;
}
