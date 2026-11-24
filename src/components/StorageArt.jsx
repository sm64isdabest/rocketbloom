import { memo, useState } from "react";
import { STORAGE_ICON } from "../assets/storageAssets.js";
import { GameIcon } from "./GameIcon.jsx";

export const StorageArt = memo(function StorageArt({ src, className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return failedSrc === src ? (
    <GameIcon name="chest" className={className} />
  ) : <img className={className} src={src} alt="" draggable="false" onError={() => setFailedSrc(src)} />;
});

export function StorageIcon() {
  return (
    <span className="storage-icon" aria-hidden="true">
      <StorageArt src={STORAGE_ICON.normal} className="storage-icon__normal" />
      <StorageArt src={STORAGE_ICON.highlight} className="storage-icon__highlight" />
    </span>
  );
}
