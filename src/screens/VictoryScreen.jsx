import { useEffect, useRef } from "react";
import { getHudAssetUrl } from "../components/hudModel.js";

const APP_BASE = import.meta.env.BASE_URL;
const numberFormat = new Intl.NumberFormat("pt-BR");

function formatFlightTime(elapsedMs) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function VictoryScreen({ planet, stage, snapshot, bestScore, onContinue, onRetry, decoration }) {
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const endless = snapshot?.mode === "endless";
  const title = endless ? "Fim do voo" : "Nível Concluído!";
  const stats = endless ? [
    ["Pontuação", numberFormat.format(snapshot.endlessScore), "victory/score.webp"],
    ["Recorde do planeta", numberFormat.format(bestScore), "victory/record.webp"],
    ["Tempo de voo", formatFlightTime(snapshot.elapsedMs), "victory/time.webp"],
  ] : snapshot ? [
    ["Pontuação", numberFormat.format(snapshot.score), "victory/score.webp"],
    ["Tempo de voo", formatFlightTime(snapshot.elapsedMs), "victory/time.webp"],
    ["Respostas certas", numberFormat.format(snapshot.correctAnswers), "victory/correct.webp"],
    ["Respostas erradas", numberFormat.format(snapshot.incorrectAnswers), "victory/incorrect.webp"],
    ["Moedas coletadas", numberFormat.format(snapshot.coins), "coin.webp"],
  ] : [];
  const astronaut = endless ? "astronaut-tired.webp" : "astronaut.webp";

  return (
    <main className={`screen victory-screen${endless ? " victory-screen--endless" : ""}`} aria-labelledby="victory-title"
      style={{ "--victory-background": `url("${getHudAssetUrl("victory/space.webp", APP_BASE)}")` }}>
      {decoration}
      <section className="victory-screen__panel">
        <img className="victory-screen__astronaut" src={getHudAssetUrl(`victory/${astronaut}`, APP_BASE)} alt="" />
        {planet && stage ? <p className="eyebrow victory-screen__stage">{planet.name} · {stage.name}</p> : null}
        <div className="victory-screen__heading">
          <h1 id="victory-title" ref={titleRef} tabIndex={-1} aria-label={title}>
            {endless ? <><span>Fim</span>{" "}<span>do voo</span></> : <><span>Nível</span>{" "}<span>Concluído!</span></>}
          </h1>
        </div>
        <p className="victory-screen__greeting">
          {endless ? "O foguete ficou sem vidas." : <><img src={`${APP_BASE}assets/rocket.webp`} alt="" /> Boa jornada, viajante!</>}
        </p>
        {stats.length ? (
          <dl className="victory-screen__stats">
            {stats.map(([label, value, icon], index) => (
              <div key={label} style={{ "--stat-index": index }}>
                <dt>{label}</dt>
                <dd>
                  <img className="victory-screen__stat-icon" src={getHudAssetUrl(icon, APP_BASE)} alt="" />
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="victory-screen__actions">
          {onRetry ? <button className="btn" type="button" onClick={onRetry}>Voar novamente</button> : null}
          <button className={onRetry ? "btn btn--ghost" : "btn"} type="button" onClick={onContinue}>
            <img className="victory-screen__return-icon" src={getHudAssetUrl("victory/return.webp", APP_BASE)} alt="" />
            Voltar à seleção de fases
          </button>
        </div>
      </section>
    </main>
  );
}
