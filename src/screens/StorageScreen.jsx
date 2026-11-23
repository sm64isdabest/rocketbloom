import { useCallback, useEffect, useRef, useState } from "react";
import { getHudAssetUrl } from "../components/hudModel.js";
import { GOLD_GOALS } from "../game/config/goldConfig.js";
import { getCrossedGoals, getGoalProgress, getGoldMeterProgress, getNextGoldGoal } from "../game/systems/goalSystem.js";
import { Decorations } from "./Decorations.jsx";
import { createDepositTimeline, drawDepositFrame, getDepositFrame } from "./storageAnimation.js";
import "../styles/storageScreen.css";

const COIN_URL = getHudAssetUrl("coin.webp", import.meta.env?.BASE_URL ?? "/");
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

export function StorageScreen({ gold, reducedMotion, inputBlocked, onBack, onAcknowledge, onToggleDecoration }) {
  const [from] = useState(gold.seenTotal);
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
  const crossed = getCrossedGoals(from, total);

  const finish = useCallback(() => {
    setFinished(true);
    onAcknowledge(gold.total);
  }, [gold.total, onAcknowledge]);

  useEffect(() => { if (!inputBlocked) titleRef.current?.focus(); }, [inputBlocked]);

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
    <main className="screen gold-storage" aria-labelledby="gold-title" onClickCapture={(event) => {
      if (!animating || inputBlocked) return;
      event.preventDefault();
      event.stopPropagation();
      if (document.activeElement === skipRef.current) titleRef.current?.focus();
      finish();
    }}>
      <Decorations equippedIds={gold.equippedIds} />
      <div className="gold-storage__layout">
        <header className="gold-storage__header">
          <h1 id="gold-title" ref={titleRef} tabIndex={-1}>Armazém de ouro</h1>
          <button className="btn btn--ghost" type="button" onClick={onBack}>Voltar</button>
        </header>

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
          {crossed.length && !reducedMotion ? <span key={crossed.length} className="gold-storage__flash" aria-hidden="true" /> : null}
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
            {crossed.length ? <p className="gold-storage__notice">
              <span aria-hidden="true">✦</span> {crossed.length === 1 ? "Desbloqueado" : "Desbloqueados"} · {crossed.map(({ name }) => name).join(", ")}
            </p> : null}
          </div>
        </section>

        <section className="gold-storage__goals" aria-labelledby="gold-goals">
          <h2 id="gold-goals">Metas e decorações</h2>
          <ul className="gold-storage__list">
            {GOLD_GOALS.map((item) => {
              const unlocked = total >= item.amount;
              const equipped = gold.equippedIds.includes(item.id);
              return (
                <li key={item.id} className={`gold-goal${unlocked ? " is-unlocked" : ""}`} style={{ "--decoration-color": item.color }}>
                  <span className="gold-goal__icon" aria-hidden="true">{unlocked ? item.icon : "🔒"}</span>
                  <div className="gold-goal__detail">
                    <h3>{item.name}</h3>
                    <p>{format.format(item.amount)} ouro</p>
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
