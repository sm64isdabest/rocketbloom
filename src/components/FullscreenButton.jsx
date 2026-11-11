import { useEffect, useRef, useState } from "react";
import { clampFloatingPosition, readFloatingPosition } from "./floatingControlModel.js";

const POSITION_KEY = "rocketbloom.fullscreen-button-position";
const BUTTON_SIZE = 52;
const EDGE_GAP = 16;

function getSavedPosition() {
  try {
    return readFloatingPosition(window.localStorage.getItem(POSITION_KEY));
  } catch {
    return null;
  }
}

function savePosition(position) {
  try {
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  } catch {
    // The control remains usable when browser storage is unavailable.
  }
}

export function FullscreenButton({ hidden = false }) {
  const [position, setPosition] = useState(() => getSavedPosition() ?? {
    x: Math.max(EDGE_GAP, window.innerWidth - BUTTON_SIZE - EDGE_GAP),
    y: EDGE_GAP,
  });
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const dragStart = useRef(null);
  const suppressClick = useRef(false);
  const positionRef = useRef(position);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const keepInsideViewport = () => {
      setPosition((current) => {
        const next = clampFloatingPosition(current, { width: window.innerWidth, height: window.innerHeight }, { width: BUTTON_SIZE, height: BUTTON_SIZE });
        positionRef.current = next;
        savePosition(next);
        return next;
      });
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    window.addEventListener("resize", keepInsideViewport);
    keepInsideViewport();
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      window.removeEventListener("resize", keepInsideViewport);
    };
  }, []);

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, x: position.x, y: position.y, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragStart.current) return;
    const drag = dragStart.current;
    const deltaX = event.clientX - drag.pointerX;
    const deltaY = event.clientY - drag.pointerY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 4) return;
    drag.moved = true;
    const next = clampFloatingPosition(
      { x: drag.x + deltaX, y: drag.y + deltaY },
      { width: window.innerWidth, height: window.innerHeight },
      { width: BUTTON_SIZE, height: BUTTON_SIZE },
    );
    positionRef.current = next;
    setPosition(next);
  };

  const onPointerUp = () => {
    if (!dragStart.current) return;
    suppressClick.current = dragStart.current.moved;
    if (dragStart.current.moved) savePosition(positionRef.current);
    dragStart.current = null;
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be unavailable or denied by the browser.
    }
  };

  if (hidden) return null;

  return (
    <button
      type="button"
      className="fullscreen-float"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
      aria-pressed={isFullscreen}
      title={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(event) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          event.preventDefault();
          return;
        }
        toggleFullscreen();
      }}
    >
      {isFullscreen ? (
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v4H4M16 4v4h4M8 20v-4H4m12 4v-4h4" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5" /></svg>
      )}
    </button>
  );
}
