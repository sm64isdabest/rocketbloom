import { useCallback, useRef, useState } from "react";
import { GameCanvas } from "../components/GameCanvas.jsx";
import { Hud } from "../components/Hud.jsx";
import { useGameSession } from "../hooks/useGameSession.js";

const APP_BASE = import.meta.env.BASE_URL;

export function PlayScreen({ planetId, stageId, mode, controlMode, reducedMotion, showHitboxes = false, paused, showHud = true,
  introducing, launching, onPause, onHudRef, onOutcome, onVictoryLaunchComplete, onEngineRef }) {
  const session = useGameSession(planetId, stageId, mode);
  const [snapshot, setSnapshot] = useState(null);
  const engineRef = useRef(null);

  const handleHud = useCallback(
    (next) => {
      onHudRef.current = next;
      setSnapshot(next);
    },
    [onHudRef],
  );
  const handleEngine = useCallback((engine) => {
    engineRef.current = engine;
    onEngineRef?.(engine);
  }, [onEngineRef]);

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
      <div className="play__stage">
        <GameCanvas
          session={session}
          controlMode={controlMode}
          reducedMotion={reducedMotion}
          showHitboxes={showHitboxes}
          running={!paused}
          onHud={handleHud}
          onPauseRequest={onPause}
          onOutcome={onOutcome}
          onVictoryLaunchComplete={onVictoryLaunchComplete}
          onEngineRef={handleEngine}
        />
      </div>
      {showHud ? <Hud snapshot={snapshot} endless={mode === "endless"} onPause={onPause} /> : null}
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
