import { getActiveQuestion, getHudAssetUrl, getPowerUpAssetUrl } from "./hudModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";

export function Hud({ snapshot, onPause, onSpecialAnswer, onSpecialContinue }) {
  const activeQuestion = getActiveQuestion(snapshot);
  const specialQuestion = snapshot?.specialQuestion;

  return (
    <div className="hud" aria-label="Indicadores da fase">
      <div className="hud__cluster">
        <span className="hud__stat hud__stat--coins" role="img" aria-label={`${snapshot?.coins ?? 0} moedas coletadas`}>
          <img className="hud__resource-icon hud__resource-icon--coin" src={getHudAssetUrl("coin.webp", APP_BASE)} alt="" aria-hidden="true" />
          <b>{String(snapshot?.coins ?? 0).padStart(2, "0")}</b>
        </span>
        <span className="hud__stat hud__stat--diamonds" role="img" aria-label={`${snapshot?.diamonds ?? 0} diamantes coletados`}>
          <img className="hud__resource-icon hud__resource-icon--diamond" src={getHudAssetUrl("diamond.webp", APP_BASE)} alt="" aria-hidden="true" />
          <b>{String(snapshot?.diamonds ?? 0).padStart(2, "0")}</b>
        </span>
        <span className="hud__stat hud__stat--speed" aria-label={`Velocidade ${snapshot?.speed ?? 0} quilômetros por hora`}>
          <small>VELOCIDADE</small><b>{snapshot?.speed ?? 0}<i> km/h</i></b>
        </span>
      </div>
      {snapshot?.powerUps?.length ? <div className="hud__powerups" aria-label="Poderes ativos">
        {snapshot.powerUps.map((power) => <div key={power.id} className={`hud__powerup hud__powerup--${power.id}`}
          role="img" aria-label={power.remainingMs ? `${power.label}, ${Math.ceil(power.remainingMs / 1000)} segundos restantes` : `${power.label}, proteção para uma penalidade`}>
          <img className="hud__powerup-icon" src={getPowerUpAssetUrl(power.id, APP_BASE)} alt="" aria-hidden="true" />
          {power.remainingMs ? <span><i style={{ width: `${Math.max(0, Math.min(100, power.remainingMs / power.durationMs * 100))}%` }} /></span> : null}
        </div>)}
      </div> : null}
      {activeQuestion ? <div key={activeQuestion.id ?? activeQuestion.prompt} className="hud__question" role="group" aria-label="Pergunta atual">
        <strong>{activeQuestion.prompt}</strong>
        {snapshot?.feedback ? <span className="hud__feedback" role="status">{snapshot.feedback}</span> : null}
        {activeQuestion.choices?.length ? <span className="sr-only" aria-live="polite">Alternativas: {activeQuestion.choices.join(", ")}</span> : null}
        {snapshot?.answerState === "awaiting-resolution" ? <span className="sr-only" aria-live="polite">Coluna selecionada: {(snapshot.selectedLane ?? 0) + 1}</span> : null}
      </div> : null}
      {specialQuestion ? <div className="hud__special-backdrop">
        <section className={`hud__special${specialQuestion.result?.correct ? " is-correct" : specialQuestion.result ? " is-incorrect" : ""}`} role="dialog" aria-modal="true" aria-labelledby="special-question-title">
          <div className="hud__special-sparkles" aria-hidden="true">✦　✧　✦</div>
          <p className="hud__special-kicker">✨ DESAFIO ESPECIAL! ✨</p>
          <span className="hud__special-category"><span aria-hidden="true">{specialQuestion.categoryIcon}</span> {specialQuestion.categoryLabel}</span>
          <h2 id="special-question-title">{specialQuestion.prompt}</h2>
          <div className="hud__special-choices" aria-label="Escolha uma resposta">
            {specialQuestion.choices.map((choice, index) => <button
              type="button"
              key={`${specialQuestion.id}-${choice}`}
              className={`hud__special-choice${specialQuestion.result?.correctAnswer === choice ? " is-answer" : ""}`}
              disabled={Boolean(specialQuestion.result)}
              onClick={() => onSpecialAnswer?.(choice)}
            ><span aria-hidden="true">{["A", "B", "C"][index]}</span>{choice}</button>)}
          </div>
          {specialQuestion.result ? <div className="hud__special-result" role="status" aria-live="polite">
            <strong>{specialQuestion.result.message}</strong>
            {!specialQuestion.result.correct ? <p>A resposta certa é <b>{specialQuestion.result.correctAnswer}</b>.</p> : null}
            <p>{specialQuestion.result.explanation}</p>
            <button type="button" className="hud__special-continue" onClick={onSpecialContinue}>Continuar aventura 🚀</button>
          </div> : <p className="hud__special-hint">Escolha uma resposta para continuar!</p>}
        </section>
      </div> : null}
      <button type="button" className="btn btn--ghost hud__pause" onClick={onPause} aria-label="Pausar fase">
        <span aria-hidden="true">Ⅱ</span>
      </button>
    </div>
  );
}
