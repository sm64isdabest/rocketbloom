import { GameIcon } from "./GameIcon.jsx";
import { MuteButton } from "./MuteButton.jsx";
import { ENDLESS } from "../game/config/gameConfig.js";
import { getActiveQuestion, getHudAssetUrl, getPowerUpAssetUrl, getStageProgressPercent } from "./hudModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const numberFormat = new Intl.NumberFormat("pt-BR");

export function Hud({ snapshot, endless, endlessIcon, numberedAnswers, muted, onToggleMute, onPause }) {
  const activeQuestion = getActiveQuestion(snapshot);
  const stageProgress = getStageProgressPercent(snapshot);
  const lives = snapshot?.lives ?? ENDLESS.lives;
  const answerResult = snapshot?.answerResult;

  return (
    <div className={`hud${endless ? " hud--endless" : ""}${stageProgress === null ? "" : " hud--timed"}`} aria-label="Indicadores da fase">
      <div className="hud__topbar">
        <div className="hud__cluster">
          {endless ? (
            <div className="hud__stat hud__endless-score">
              <img src={getHudAssetUrl(endlessIcon, APP_BASE)} alt="" />
              <span><small>Pontuação</small><b>{numberFormat.format(snapshot?.endlessScore ?? 0)}</b></span>
            </div>
          ) : null}
          <span key={snapshot?.coins ?? 0} className={`hud__stat hud__stat--coins${snapshot?.coins ? " hud__stat--coin-pulse" : ""}`}
            role="img" aria-label={`${snapshot?.coins ?? 0} moedas coletadas`}>
            <img className="hud__resource-icon hud__resource-icon--coin" src={getHudAssetUrl("coin.webp", APP_BASE)} alt="" aria-hidden="true" />
            <b>{String(snapshot?.coins ?? 0).padStart(2, "0")}</b>
          </span>
          {!endless ? (
            <span className="hud__stat hud__stat--speed" aria-label={`Velocidade ${snapshot?.speed ?? 0} quilômetros por hora`}>
              <small>VELOCIDADE</small><b>{snapshot?.speed ?? 0}<i> km/h</i></b>
            </span>
          ) : null}
        </div>
        {endless ? (
          <div className="hud__stat hud__lives" role="status" aria-label={`${lives} de ${ENDLESS.lives} vidas`}>
            <span className="sr-only">{lives} de {ENDLESS.lives} vidas</span>
            {snapshot?.invulnerable ? <span className="hud__invulnerable">Protegido</span> : null}
            {Array.from({ length: ENDLESS.lives }, (_, index) => (
              <img key={index} className={index >= lives ? "hud__heart--lost" : undefined}
                src={getHudAssetUrl("life-heart.webp", APP_BASE)} alt="" />
            ))}
          </div>
        ) : null}
        <div className="hud__actions">
          <MuteButton className="hud__control" muted={muted} onToggle={onToggleMute} />
          <button type="button" className="hud__control" data-menu-start onClick={onPause} aria-label="Pausar fase">
            <GameIcon name="pause" />
          </button>
        </div>
      </div>
      {stageProgress !== null ? (
        <div className="hud__progress">
          <div className="hud__progress-track" role="progressbar" aria-label="Progresso da fase"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={stageProgress}>
            <div className="hud__progress-fill" style={{ width: `${stageProgress}%` }}>
              {stageProgress > 0 && stageProgress < 100 ? <span className="hud__progress-spark" aria-hidden="true" /> : null}
            </div>
          </div>
          <span aria-hidden="true">{stageProgress}%</span>
        </div>
      ) : null}
      {snapshot?.powerUps?.length ? <div className="hud__powerups" aria-label="Poderes ativos">
        {snapshot.powerUps.map((power) => <div key={power.id} className={`hud__powerup hud__powerup--${power.id}`}
          role="img" aria-label={power.remainingMs ? `${power.label}, ${Math.ceil(power.remainingMs / 1000)} segundos restantes` : `${power.label}, proteção para uma penalidade`}>
          <img className="hud__powerup-icon" src={getPowerUpAssetUrl(power.id, APP_BASE)} alt="" aria-hidden="true" />
          {power.remainingMs ? <span><i style={{ width: `${Math.max(0, Math.min(100, power.remainingMs / power.durationMs * 100))}%` }} /></span> : null}
        </div>)}
      </div> : null}
      <span className="sr-only" role="status" aria-atomic="true">
        {activeQuestion && snapshot?.answerChoices
          ? `${activeQuestion.prompt} ${snapshot.answerChoices.map((value, lane) => `Faixa ${lane + 1}: ${value}`).join(". ")}`
          : ""}
      </span>
      {activeQuestion ? <div key={activeQuestion.id ?? activeQuestion.prompt} className="hud__question" role="group" aria-label="Pergunta atual">
        <strong>{activeQuestion.prompt}</strong>
        {answerResult ? (
          <span className={`hud__answer-result hud__answer-result--${answerResult.correct ? "correct" : "incorrect"}`} role="status">
            {answerResult.correct ? "✓ Acertou!" : `× Errou! Resposta: ${activeQuestion.correctAnswer}`}
          </span>
        ) : null}
        {numberedAnswers && snapshot?.answerChoices ? (
          <div className="hud__answer-guide">
            <span className="hud__answer-keys">Teclas 1 a 4</span>
            <div className="hud__answer-preview" aria-hidden="true">
              {snapshot.answerChoices.map((value, lane) => (
                <span key={lane}><kbd>{lane + 1}</kbd><b>{value}</b></span>
              ))}
            </div>
          </div>
        ) : null}
        {snapshot?.answerState === "awaiting-resolution" ? <span className="sr-only" aria-live="polite">Coluna selecionada: {(snapshot.selectedLane ?? 0) + 1}</span> : null}
      </div> : null}
    </div>
  );
}
