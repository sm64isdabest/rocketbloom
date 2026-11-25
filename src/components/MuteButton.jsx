import { GameIcon } from "./GameIcon.jsx";

export function MuteButton({ muted, onToggle, className = "", inert }) {
  return (
    <button type="button" className={`mute-button ${className}`} onClick={onToggle} inert={inert}
      aria-label="Silenciar jogo" aria-pressed={muted} title={muted ? "Ativar som" : "Silenciar jogo"}>
      <GameIcon name={muted ? "sound-off" : "sound-on"} />
    </button>
  );
}
