import { useEffect, useRef } from "react";
import { GameEngine } from "../game/engine/GameEngine.js";

export function GameCanvas({ session, controlMode, reducedMotion = false, showHitboxes = false, running, onHud, onPauseRequest, onOutcome, onEngineRef }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const runningRef = useRef(running);
  const onOutcomeRef = useRef(onOutcome);
  runningRef.current = running;
  onOutcomeRef.current = onOutcome;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const engine = new GameEngine({
      canvas,
      session,
      controlMode,
      reducedMotion,
      showHitboxes,
      onHud,
      onPauseRequest,
      onOutcome: (...args) => onOutcomeRef.current?.(...args),
    });
    engineRef.current = engine;
    onEngineRef?.(engine);
    if (runningRef.current) {
      engine.start();
    }

    return () => {
      engine.stop();
      engineRef.current = null;
      onEngineRef?.(null);
    };
  }, [session, onHud, onPauseRequest, onEngineRef]);

  useEffect(() => {
    engineRef.current?.setControlMode(controlMode);
  }, [controlMode]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.showHitboxes = showHitboxes;
  }, [showHitboxes]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    if (running) {
      engine.resume();
    } else {
      engine.pause();
    }
  }, [running]);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Área da partida" />;
}
