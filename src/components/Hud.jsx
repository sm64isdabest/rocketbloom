import { getActiveQuestion } from "./hudModel.js";

export function Hud({ snapshot, onPause }) {
  const activeQuestion = getActiveQuestion(snapshot);

  return (
    <div className="hud" aria-label="Indicadores da fase">
      <div className="hud__cluster">
        <span className="hud__stat hud__stat--coins" aria-label={`${snapshot?.coins ?? 0} moedas coletadas`}>
          <i className="resource-coin" aria-hidden="true">●</i>
          <b>{String(snapshot?.coins ?? 0).padStart(2, "0")}</b>
        </span>
        <span className="hud__stat hud__stat--speed" aria-label={`Velocidade ${snapshot?.speed ?? 0} quilômetros por hora`}>
          <small>VELOCIDADE</small><b>{snapshot?.speed ?? 0}<i> km/h</i></b>
        </span>
      </div>
      {activeQuestion ? <div key={activeQuestion.id ?? activeQuestion.prompt} className="hud__question" role="group" aria-label="Pergunta atual">
        <strong>{activeQuestion.prompt}</strong>
        {snapshot?.feedback ? <span className="hud__feedback" role="status">{snapshot.feedback}</span> : null}
        {activeQuestion.choices?.length ? <span className="sr-only" aria-live="polite">Alternativas: {activeQuestion.choices.join(", ")}</span> : null}
        {snapshot?.answerState === "awaiting-resolution" ? <span className="sr-only" aria-live="polite">Coluna selecionada: {(snapshot.selectedLane ?? 0) + 1}</span> : null}
      </div> : null}
      <button type="button" className="btn btn--ghost hud__pause" onClick={onPause} aria-label="Pausar fase">
        <span aria-hidden="true">Ⅱ</span>
      </button>
    </div>
  );
}
