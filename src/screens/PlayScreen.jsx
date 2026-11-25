import { useCallback, useRef, useState } from "react";
import { GameCanvas } from "../components/GameCanvas.jsx";
import { Hud } from "../components/Hud.jsx";
import { getHudAssetUrl } from "../components/hudModel.js";
import { useGameSession } from "../hooks/useGameSession.js";

const APP_BASE = import.meta.env.BASE_URL;

export function PlayScreen({ planetId, stageId, mode, cosmetics, controlMode, reducedMotion, showHitboxes = false, paused, showHud = true,
  introducing, launching, muted, onToggleMute, onPause, onHudRef, onOutcome, onVictoryLaunchComplete, onEngineRef }) {
  const session = useGameSession(planetId, stageId, mode);
  const [snapshot, setSnapshot] = useState(null);
  const backdropRef = useRef(null);
  const lowSpeedAlert = showHud && !paused && snapshot?.lowSpeedAlert;

  const handleHud = useCallback(
    (next) => {
      onHudRef.current = next;
      setSnapshot(next);
    },
    [onHudRef],
  );
  if (session.error) {
    return (
      <section className="screen screen--center">
        <h1>Fase indisponível</h1>
        <p className="muted">{session.error}</p>
      </section>
    );
  }

  return (
    <section className={`play${introducing ? " play--introducing" : ""}`} style={{ "--flight-accent": session.planet.theme.accent }}>
      <canvas ref={backdropRef} className="play__backdrop" aria-hidden="true" />
      <div className="play__stage">
        <GameCanvas
          backdropRef={backdropRef}
          session={session}
          cosmetics={cosmetics}
          controlMode={controlMode}
          reducedMotion={reducedMotion}
          showHitboxes={showHitboxes}
          running={!paused}
          onHud={handleHud}
          onPauseRequest={onPause}
          onOutcome={onOutcome}
          onVictoryLaunchComplete={onVictoryLaunchComplete}
          onEngineRef={onEngineRef}
        />
      </div>
      {lowSpeedAlert ? (
        <>
          <div className="flight-low-speed-vignette" aria-hidden="true" />
          <div className="flight-low-speed" role="status">
            <img src={getHudAssetUrl("warning-alert.webp", APP_BASE)} alt="" />
            <strong>Velocidade baixa</strong>
          </div>
        </>
      ) : null}
      {showHud ? <Hud snapshot={snapshot} endless={mode === "endless"} endlessIcon={session.planet.endlessIcon}
        muted={muted} onToggleMute={onToggleMute} onPause={onPause} /> : null}
      {introducing ? (
        <div className="flight-intro" role="status">
          <img className="flight-intro__planet" src={`${APP_BASE}assets/ui/planets/${planetId}-icon.webp`} alt="" />
          <img className="flight-intro__rocket" src={`${APP_BASE}assets/rocket.webp`} alt="" />
          <div className="flight-intro__title">
            <p className="eyebrow">{session.planet.name}</p>
            <strong>{session.stage.name}</strong>
          </div>
        </div>
      ) : null}
      {launching ? <div className="flight-victory-glow" aria-hidden="true" /> : null}
    </section>
  );
}
