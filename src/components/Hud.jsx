export function Hud({ snapshot, durationMs, question, onPause }) {
  const progress = snapshot
    ? Math.min(100, Math.round(((snapshot.progressMs ?? snapshot.elapsedMs) / durationMs) * 100))
    : 0;
  const activeQuestion = snapshot?.question ?? question;

  return (
    <div className="hud">
      <div className="hud__question" role="group" aria-label="Pergunta atual"><span className="eyebrow">{activeQuestion?.categoryLabel ?? "Desafio da rota"} · NÍVEL {activeQuestion?.difficulty ?? 1}</span><strong>{activeQuestion?.prompt ?? "Prepare-se para a próxima pergunta"}</strong>{snapshot?.feedback ? <span className="hud__feedback" role="status">{snapshot.feedback}</span> : null}{activeQuestion?.choices?.length ? <span className="sr-only" aria-live="polite">Alternativas: {activeQuestion.choices.join(", ")}</span> : null}{snapshot?.answerState === "awaiting-resolution" ? <span className="sr-only" aria-live="polite">Coluna selecionada: {(snapshot.selectedLane ?? 0) + 1}</span> : null}</div>
      <div className="hud__cluster">
        <span className="hud__stat"><small>VELOCIDADE</small><b>{snapshot?.speed ?? 0}<i> km/h</i></b></span>
        <span className="hud__stat"><small>PONTOS</small><b>{snapshot?.score ?? 0}</b></span>
        <span className="hud__stat"><small>MOEDAS</small><b><i className="resource-coin">●</i> {snapshot?.coins ?? 0}</b></span>
        <span className="hud__stat"><small>DIAMANTES</small><b><i className="resource-diamond">◆</i> {snapshot?.diamonds ?? 0}</b></span>
      </div>
      <div className="hud__progress" role="progressbar" aria-label="Progresso da fase" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="hud__progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <button type="button" className="btn btn--ghost hud__pause" onClick={onPause}>
        <span aria-hidden="true">Ⅱ</span> Pausar
      </button>
    </div>
  );
}
