import { useEffect, useState } from "react";
import { GameIcon } from "./GameIcon.jsx";

export function FullscreenButton({ hidden = false }) {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be unavailable or denied by the browser.
    }
  };

  if (hidden) return null;

  const label = isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia";
  return (
    <button type="button" className="fullscreen-float" aria-label={label} aria-pressed={isFullscreen}
      title={label} draggable={false} onClick={toggleFullscreen}>
      <GameIcon name={isFullscreen ? "fullscreen-exit" : "fullscreen-enter"} />
    </button>
  );
}
