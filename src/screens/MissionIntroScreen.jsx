import { useEffect, useRef, useState } from "react";
import { MISSION_INTRO } from "../game/data/missionIntro.js";
import "../styles/onboarding.css";

const APP_BASE = import.meta.env.BASE_URL;

export function MissionIntroScreen({ onComplete, returningPlayer = false }) {
  const [index, setIndex] = useState(0);
  const heading = useRef(null);
  const scene = MISSION_INTRO[index];
  const lastScene = index === MISSION_INTRO.length - 1;
  const nextLabel = lastScene ? (returningPlayer ? "Ir para as fases" : "Ir para a Terra") : "Continuar";

  useEffect(() => { heading.current?.focus(); }, [index]);

  return (
    <main className="screen mission-intro" aria-labelledby="mission-intro-title">
      <div className="mission-intro__layout">
        <img key={scene.image} className="mission-intro__astronaut" src={`${APP_BASE}${scene.image.slice(1)}`} alt="" draggable={false} />
        <section key={scene.title} className="mission-intro__dialogue">
          <p className="eyebrow">Astronauta cientista</p>
          <h1 id="mission-intro-title" ref={heading} tabIndex={-1}>{scene.title}</h1>
          <p className="mission-intro__copy">{scene.dialogue}</p>
          <div className="mission-intro__actions">
            {!lastScene ? <button className="btn btn--ghost" type="button" onClick={onComplete}>Pular introdução</button> : null}
            <button className="btn" type="button" onClick={lastScene ? onComplete : () => setIndex(index + 1)}>
              {nextLabel}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
