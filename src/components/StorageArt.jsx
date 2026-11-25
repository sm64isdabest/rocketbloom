import { memo, useState } from "react";
import { GameIcon } from "./GameIcon.jsx";

export const StorageArt = memo(function StorageArt({ src, className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return failedSrc === src ? (
    <GameIcon name="chest" className={className} />
  ) : <img className={className} src={src} alt="" draggable="false" onError={() => setFailedSrc(src)} />;
});
