import { useEffect, useRef } from "react";
import { GameEngine } from "../game/engine/GameEngine.js";

export function GameCanvas({ session, controlMode, reducedMotion = false, running, onHud, onPauseRequest, onOutcome }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const runningRef = useRef(running);
  runningRef.current = running;

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
      onHud,
      onPauseRequest,
      onOutcome,
    });
    engineRef.current = engine;
    if (runningRef.current) {
      engine.start();
    }

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [session, controlMode, onHud, onPauseRequest, onOutcome]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

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
