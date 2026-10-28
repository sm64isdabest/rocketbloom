import { getActiveQuestion, getHudAssetUrl } from "./hudModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";

export function Hud({ snapshot, onPause }) {
  const activeQuestion = getActiveQuestion(snapshot);

  return (
    <div className="hud" aria-label="Indicadores da fase">
      <div className="hud__cluster">
        <span className="hud__stat hud__stat--coins" role="img" aria-label={`${snapshot?.coins ?? 0} moedas coletadas`}>
          <img className="hud__resource-icon hud__resource-icon--coin" src={getHudAssetUrl("coin.png", APP_BASE)} alt="" aria-hidden="true" />
          <b>{String(snapshot?.coins ?? 0).padStart(2, "0")}</b>
        </span>
        <span className="hud__stat hud__stat--diamonds" role="img" aria-label={`${snapshot?.diamonds ?? 0} diamantes coletados`}>
          <img className="hud__resource-icon hud__resource-icon--diamond" src={getHudAssetUrl("diamond.png", APP_BASE)} alt="" aria-hidden="true" />
          <b>{String(snapshot?.diamonds ?? 0).padStart(2, "0")}</b>
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
