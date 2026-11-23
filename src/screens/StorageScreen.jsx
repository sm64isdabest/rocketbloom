import { useCallback, useEffect, useRef, useState } from "react";
import { getTreasureArt } from "../assets/storageAssets.js";
import { getHudAssetUrl } from "../components/hudModel.js";
import { StorageArt } from "../components/StorageArt.jsx";
import { EMPTY_TREASURE, GOLD_GOALS } from "../game/config/goldConfig.js";
import { getCrossedGoals, getGoalProgress, getGoldMeterProgress, getHighestGoldGoal, getNextGoldGoal } from "../game/systems/goalSystem.js";
import { hasUnseenGoldGoals } from "../utils/goldStorage.js";
import { Decorations } from "./Decorations.jsx";
import { getMenuAssetUrl } from "./menuModel.js";
import { getPauseAssetUrl, RETURN_ICON_FILE } from "./pauseModel.js";
import { createDepositTimeline, drawDepositFrame, getDepositFrame } from "./storageAnimation.js";
import { StorageTreasure } from "./StorageTreasure.jsx";
import "../styles/storageScreen.css";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const COIN_URL = getHudAssetUrl("coin.webp", APP_BASE);
const format = new Intl.NumberFormat("pt-BR");

function GoldMeter({ total, goal, label, large = false, trackRef, pulse }) {
  const amount = large ? GOLD_GOALS.at(-1)?.amount ?? 100 : goal.amount;
  const progress = large ? getGoldMeterProgress(total) : getGoalProgress(total, amount);
  const nearGoal = !goal || getGoalProgress(total, goal.amount) >= 0.8;
  const valueText = `${format.format(Math.min(total, amount))} de ${format.format(amount)} de ouro`;
  return (
    <div ref={trackRef} className={`gold-meter${large ? " gold-meter--large" : ""}${large && nearGoal ? " is-near" : ""}`}
      role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={amount}
      aria-valuenow={Math.min(total, amount)} aria-valuetext={goal ? valueText : "Todas as metas concluídas"}>
      <div className="gold-meter__fill" style={{ width: `${progress * 100}%` }} />
      {large ? GOLD_GOALS.slice(0, -1).map(({ id }, index) => (
        <span key={id} className="gold-meter__marker" aria-hidden="true"
          style={{ left: `${(index + 1) / GOLD_GOALS.length * 100}%` }} />
      )) : null}
      {pulse ? <div className="gold-meter__pulse" key={pulse} aria-hidden="true" /> : null}
    </div>
  );
}

export function StorageScreen({ gold, reducedMotion, inputBlocked, onBack, onSettings, onAcknowledge, onToggleDecoration }) {
  const [from] = useState(gold.seenTotal);
  const [seenAtEntry] = useState(gold.seenGoalIds);
  const [frame, setFrame] = useState({ total: from, arrived: 0 });
  const [finished, setFinished] = useState(from === gold.total);
  const titleRef = useRef(null);
  const canvasRef = useRef(null);
  const coinRef = useRef(null);
  const trackRef = useRef(null);
  const skipRef = useRef(null);
  const elapsedRef = useRef(0);
  const animating = !finished && !reducedMotion;
  const total = animating ? frame.total : gold.total;
  const goal = getNextGoldGoal(total);
  const highestGoal = getHighestGoldGoal(total);
  const revealed = getCrossedGoals(0, total).filter(({ id }) => !seenAtEntry.includes(id));

  const finish = useCallback(() => {
    setFinished(true);
    onAcknowledge(gold.total);
  }, [gold.total, onAcknowledge]);

  useEffect(() => { if (!inputBlocked) titleRef.current?.focus(); }, [inputBlocked]);
  useEffect(() => {
    if (finished && !inputBlocked && hasUnseenGoldGoals(gold)) onAcknowledge(gold.total);
  }, [finished, gold, inputBlocked, onAcknowledge]);

  useEffect(() => {
    if (finished || inputBlocked) return undefined;
    if (reducedMotion) {
      finish();
      return undefined;
    }

    const timeline = createDepositTimeline(from, gold.total);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    let start;
    let animationId;
    let previous;

    const paint = (now) => {
      start ??= now - elapsedRef.current;
      const elapsed = now - start;
      elapsedRef.current = elapsed;
      if (elapsed >= timeline.duration) {
        finish();
        return;
      }
      const next = getDepositFrame(timeline, elapsed);
      if (next.total !== previous?.total || next.arrived !== previous?.arrived) {
        setFrame(next);
        previous = next;
      }
      if (ctx && coinRef.current && trackRef.current) {
        const bounds = canvas.getBoundingClientRect();
        const origin = coinRef.current.getBoundingClientRect();
        const target = trackRef.current.getBoundingClientRect();
        const width = Math.round(bounds.width * pixelRatio);
        const height = Math.round(bounds.height * pixelRatio);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, bounds.width, bounds.height);
        drawDepositFrame(ctx, timeline, elapsed, {
          x: origin.left - bounds.left + origin.width / 2,
          y: origin.top - bounds.top + origin.height / 2,
        }, {
          x: target.left - bounds.left + target.width / 2,
          y: target.top - bounds.top + target.height / 2,
        }, coinRef.current);
      }
      animationId = window.requestAnimationFrame(paint);
    };
    animationId = window.requestAnimationFrame(paint);
    return () => window.cancelAnimationFrame(animationId);
  }, [finish, finished, from, gold.total, inputBlocked, reducedMotion]);

  useEffect(() => {
    if (!animating || inputBlocked) return undefined;
    const onKeyDown = (event) => {
      if (!["Enter", " ", "Escape"].includes(event.key) || event.repeat) return;
      event.preventDefault();
      if (document.activeElement === skipRef.current) titleRef.current?.focus();
      finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [animating, finish, inputBlocked]);

  return (
    <main className="laboratory-scene gold-storage" aria-labelledby="gold-title" onClickCapture={(event) => {
      if (!animating || inputBlocked) return;
      event.preventDefault();
      event.stopPropagation();
      if (document.activeElement === skipRef.current) titleRef.current?.focus();
      finish();
    }}>
      <img className="laboratory-scene__background gold-storage__background"
        src={`${APP_BASE}assets/laboratory/laboratory-background-clean.png`} alt="" />
      <Decorations equippedIds={gold.equippedIds} />
      <header className="laboratory-scene__topbar gold-storage__header">
        <button type="button" className="laboratory-scene__icon-button gold-storage__back" onClick={onBack}
          aria-label="Voltar à seleção de fases" title="Voltar à seleção de fases">
          <img className="laboratory-scene__back-icon" src={getPauseAssetUrl(RETURN_ICON_FILE, APP_BASE)} alt="" />
          <span aria-hidden="true">Voltar</span>
        </button>
        <h1 id="gold-title" className="laboratory-scene__title" ref={titleRef} tabIndex={-1}>Armazém de ouro</h1>
        <button type="button" className="laboratory-scene__icon-button laboratory-scene__icon-button--settings"
          onClick={onSettings} aria-label="Abrir configurações">
          <img src={getMenuAssetUrl("settings.webp", APP_BASE)} alt="" />
        </button>
      </header>

      <div className="gold-storage__layout">
        <div className="gold-storage__hero">
          <StorageTreasure treasure={highestGoal?.treasure ?? EMPTY_TREASURE}
            isFinal={highestGoal === GOLD_GOALS.at(-1)} reducedMotion={reducedMotion} />
          <section className="gold-storage__vault" aria-label="Saldo e próxima meta">
            {animating ? (
              <>
                <div className="gold-storage__deposit">
                  <img ref={coinRef} src={COIN_URL} alt="" />
                  <span><strong>+{format.format(gold.total - total)}</strong> a depositar</span>
                </div>
                <button className="gold-storage__skip" ref={skipRef} type="button">Pular animação</button>
                <canvas ref={canvasRef} className="gold-storage__flights" aria-hidden="true" />
              </>
            ) : null}
            {!reducedMotion && revealed.length > 0 ? <span key={revealed.length} className="gold-storage__flash" aria-hidden="true" /> : null}
            <div className="gold-storage__balance">
              <span>Ouro acumulado</span>
              <strong>{format.format(total)}</strong>
            </div>
            <GoldMeter total={total} goal={goal} label="Progresso das metas de ouro" large trackRef={trackRef}
              pulse={animating ? frame.arrived : 0} />
            <p className="gold-storage__next">{goal
              ? <>Próxima meta <strong>{format.format(goal.amount)} ouro</strong> · {goal.name}</>
              : "Todas as metas concluídas"}</p>
            <div role="status">
              {revealed.length > 0 ? <p className="gold-storage__notice">
                <span aria-hidden="true">✦</span> {revealed.at(-1).treasure.name} · {revealed.length === 1 ? "Decoração liberada" : "Decorações liberadas"}{" "}
                {revealed.map(({ name }) => name).join(", ")}
              </p> : null}
            </div>
          </section>
        </div>

        <section className="gold-storage__goals" aria-labelledby="gold-goals">
          <h2 id="gold-goals">Metas e decorações</h2>
          <ul className="gold-storage__list">
            {GOLD_GOALS.map((item) => {
              const unlocked = total >= item.amount;
              const equipped = gold.equippedIds.includes(item.id);
              return (
                <li key={item.id} className={`gold-goal${unlocked ? " is-unlocked" : ""}`} style={{ "--decoration-color": item.color }}>
                  <div className="gold-goal__image">
                    <StorageArt src={getTreasureArt(item.treasure.level)} className="gold-goal__art" />
                    {unlocked ? null : (
                      <svg viewBox="0 0 24 24" className="gold-goal__lock" aria-hidden="true">
                        <rect x="5.5" y="10" width="13" height="10" rx="2" />
                        <path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3M12 14v2" />
                      </svg>
                    )}
                  </div>
                  <div className="gold-goal__detail">
                    <h3>{item.treasure.name}</h3>
                    <p><strong>{format.format(item.amount)} ouro</strong> · {item.name}</p>
                    <GoldMeter total={total} goal={item} label={`Progresso para ${item.name}`} />
                  </div>
                  {unlocked ? <button className="btn btn--ghost gold-goal__action" type="button" aria-pressed={equipped}
                    aria-label={`${equipped ? "Desequipar" : "Equipar"} ${item.name}`}
                    onClick={() => onToggleDecoration(item.id)}>{equipped ? "Desequipar" : "Equipar"}</button>
                    : <span className="gold-goal__locked">Bloqueado</span>}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
