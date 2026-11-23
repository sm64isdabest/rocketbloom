import { useEffect, useRef } from "react";

const APP_BASE = import.meta.env.BASE_URL;
const numberFormat = new Intl.NumberFormat("pt-BR");

function formatFlightTime(elapsedMs) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function VictoryScreen({ planet, stage, snapshot, bestScore, onContinue, onRetry }) {
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const endless = snapshot?.mode === "endless";
  const stats = endless ? [
    ["Pontuação", numberFormat.format(snapshot.endlessScore)],
    ["Recorde do planeta", numberFormat.format(bestScore)],
    ["Tempo de voo", formatFlightTime(snapshot.elapsedMs)],
  ] : snapshot ? [
    ["Pontuação", numberFormat.format(snapshot.score)],
    ["Tempo de voo", formatFlightTime(snapshot.elapsedMs)],
    ["Respostas certas", numberFormat.format(snapshot.correctAnswers)],
    ["Respostas erradas", numberFormat.format(snapshot.incorrectAnswers)],
    ["Moedas coletadas", numberFormat.format(snapshot.coins)],
    ["Diamantes coletados", numberFormat.format(snapshot.diamonds)],
  ] : [];

  return (
    <main className="screen victory-screen" aria-labelledby="victory-title" style={{ "--victory-accent": planet?.theme.accent }}>
      <section className="victory-screen__panel">
        {planet ? (
          <img className="victory-screen__planet" src={`${APP_BASE}assets/ui/planets/${planet.id}-icon.webp`} alt="" />
        ) : null}
        {planet && stage ? <p className="eyebrow victory-screen__stage">{planet.name} · {stage.name}</p> : null}
        <h1 id="victory-title" ref={titleRef} tabIndex={-1}>{endless ? "Fim do voo" : "Fase concluída!"}</h1>
        {stats.length ? (
          <dl className="victory-screen__stats">
            {stats.map(([label, value], index) => (
              <div key={label} style={{ "--stat-index": index }}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="victory-screen__actions">
          {onRetry ? <button className="btn" type="button" onClick={onRetry}>Voar novamente</button> : null}
          <button className={onRetry ? "btn btn--ghost" : "btn"} type="button" onClick={onContinue}>Voltar à seleção de fases</button>
        </div>
      </section>
    </main>
  );
}
