import { memo, useState } from "react";
import { STORAGE_ICON } from "../assets/storageAssets.js";

export const StorageArt = memo(function StorageArt({ src, className, icon = false }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return failedSrc === src ? (
    <svg className={className} viewBox={icon ? "0 0 80 80" : "0 0 420 240"} aria-hidden="true">
      <g transform={icon ? undefined : "translate(161 102) scale(1.23)"}>
        <path d="M10 34 20 23h40l10 11v26l-8 8H18l-8-8Z" fill="#254872" stroke="#81bded" strokeWidth="3" />
        <path d="M11 41h58M19 62h42" stroke="#e8ac48" strokeWidth="4" />
        <rect x="33" y="36" width="14" height="13" rx="3" fill="#ffd778" />
        <ellipse cx="29" cy="18" rx="5" ry="7" fill="#f5bf50" stroke="#fff5c4" />
        <ellipse cx="47" cy="13" rx="5" ry="7" fill="#f5bf50" stroke="#fff5c4" />
      </g>
    </svg>
  ) : <img className={className} src={src} alt="" draggable="false" onError={() => setFailedSrc(src)} />;
});

export function StorageIcon() {
  return (
    <span className="storage-icon" aria-hidden="true">
      <StorageArt src={STORAGE_ICON.normal} className="storage-icon__normal" icon />
      <StorageArt src={STORAGE_ICON.highlight} className="storage-icon__highlight" icon />
    </span>
  );
}
