import { useCallback, useRef, useState } from "react";
import { GameCanvas } from "../components/GameCanvas.jsx";
import { Hud } from "../components/Hud.jsx";
import { useGameSession } from "../hooks/useGameSession.js";

export function PlayScreen({ planetId, stageId, controlMode, reducedMotion, showHitboxes = false, paused, showHud = true, onPause, onHudRef, onOutcome, onEngineRef }) {
  const session = useGameSession(planetId, stageId);
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
    <section className="play">
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
          onEngineRef={handleEngine}
        />
      </div>
      {showHud ? <Hud snapshot={snapshot} onPause={onPause}
        onSpecialAnswer={(answer) => engineRef.current?.answerSpecialQuestion(answer)}
        onSpecialContinue={() => engineRef.current?.continueAfterSpecialQuestion()} /> : null}
    </section>
  );
}
