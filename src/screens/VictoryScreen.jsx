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
    ["Pontuação", numberFormat.format(snapshot.endlessScore)],
    ["Recorde do planeta", numberFormat.format(bestScore)],
    ["Tempo de voo", formatFlightTime(snapshot.elapsedMs)],
  ] : snapshot ? [
    ["Pontuação", numberFormat.format(snapshot.score), "score", "◎"],
    ["Tempo de voo", formatFlightTime(snapshot.elapsedMs), "time", "◴"],
    ["Respostas certas", numberFormat.format(snapshot.correctAnswers), "correct", "✓"],
    ["Respostas erradas", numberFormat.format(snapshot.incorrectAnswers), "incorrect", "×"],
    ["Moedas coletadas", numberFormat.format(snapshot.coins), "coins"],
  ] : [];

  return (
    <main className={`screen victory-screen${endless ? "" : " victory-screen--campaign"}`} aria-labelledby="victory-title"
      style={{ "--victory-accent": planet?.theme.accent, "--victory-background": `url("${getHudAssetUrl("victory/space.webp", APP_BASE)}")` }}>
      {decoration}
      <section className="victory-screen__panel">
        {!endless ? (
          <img className="victory-screen__astronaut" src={getHudAssetUrl("victory/astronaut.webp", APP_BASE)} alt="" />
        ) : planet ? (
          <img className="victory-screen__planet" src={`${APP_BASE}assets/ui/planets/${planet.id}-icon.webp`} alt="" />
        ) : null}
        {planet && stage ? <p className="eyebrow victory-screen__stage">{planet.name} · {stage.name}</p> : null}
        <div className="victory-screen__heading">
          <h1 id="victory-title" ref={titleRef} tabIndex={-1} aria-label={title}>
            {endless ? title : <><span>Nível</span>{" "}<span>Concluído!</span></>}
          </h1>
        </div>
        {!endless ? <p className="victory-screen__greeting">
          <img src={`${APP_BASE}assets/rocket.webp`} alt="" /> Boa jornada, viajante!
        </p> : null}
        {stats.length ? (
          <dl className="victory-screen__stats">
            {stats.map(([label, value, icon, symbol], index) => (
              <div key={label} style={{ "--stat-index": index }}>
                <dt>{label}</dt>
                <dd>
                  {icon === "coins" ? (
                    <img className="victory-screen__stat-icon" src={getHudAssetUrl("coin.webp", APP_BASE)} alt="" />
                  ) : icon ? (
                    <span className={`victory-screen__stat-icon victory-screen__stat-icon--${icon}`} aria-hidden="true">{symbol}</span>
                  ) : null}
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="victory-screen__actions">
          {onRetry ? <button className="btn" type="button" onClick={onRetry}>Voar novamente</button> : null}
          <button className={onRetry ? "btn btn--ghost" : "btn"} type="button" onClick={onContinue}>
            {!endless ? <span aria-hidden="true">↶</span> : null} Voltar à seleção de fases
          </button>
        </div>
      </section>
    </main>
  );
}
