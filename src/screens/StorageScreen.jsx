import { useCallback, useEffect, useId, useRef, useState } from "react";
import { VAULT_BUTTON_ART } from "../assets/storageAssets.js";
import { StorageArt } from "../components/StorageArt.jsx";
import { getHudAssetUrl } from "../components/hudModel.js";
import { playGameSound } from "../game/audio/audioManager.js";
import { EMPTY_TREASURE, getRocketCosmeticUrl, GOLD_GOALS, ROCKET_COSMETICS } from "../game/config/goldConfig.js";
import { getCrossedGoals, getGoldMeterProgress, getHighestGoldGoal, getNextGoldGoal } from "../game/systems/goalSystem.js";
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

function GoldMeter({ total, trackRef, pulse }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const tooltipId = useId();
  const amount = GOLD_GOALS.at(-1).amount;
  const progress = getGoldMeterProgress(total);
  const next = getNextGoldGoal(total);
  const remaining = next ? next.amount - total : 0;
  const message = next
    ? `${remaining === 1 ? "Falta 1 moeda" : `Faltam ${format.format(remaining)} moedas`} para a meta de ${format.format(next.amount)}.`
    : "Todas as metas foram atingidas.";
  const visible = !dismissed && (open || hovered);
  useEffect(() => {
    if (!visible) return undefined;
    const dismissOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      setDismissed(true);
    };
    window.addEventListener("keydown", dismissOnEscape, true);
    return () => window.removeEventListener("keydown", dismissOnEscape, true);
  }, [visible]);
  return (
    <div className="gold-meter__wrapper" data-open={visible} data-dismissed={dismissed}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        setHovered(true);
        setDismissed(false);
      }}
      onPointerLeave={() => setHovered(false)}>
      <div ref={trackRef} className="gold-meter gold-meter--large"
        role="progressbar" aria-label="Progresso das metas de ouro" aria-valuemin={0} aria-valuemax={amount}
        aria-valuenow={Math.min(total, amount)} aria-valuetext={`${format.format(total)} de ouro`}>
        <div className="gold-meter__fill" style={{ width: `${progress * 100}%` }} />
        {GOLD_GOALS.slice(0, -1).map(({ id }, index) => (
          <span key={id} className="gold-meter__marker" aria-hidden="true"
            style={{ left: `${(index + 1) / GOLD_GOALS.length * 100}%` }} />
        ))}
        {pulse ? <div className="gold-meter__pulse" key={pulse} aria-hidden="true" /> : null}
      </div>
      <button className="gold-meter__inspect" type="button" aria-label="Consultar próxima meta"
        aria-describedby={tooltipId} aria-controls={tooltipId}
        onFocus={() => setDismissed(false)}
        onBlur={() => setOpen(false)}
        onClick={() => {
          setOpen(!open);
          setDismissed(open);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.stopPropagation();
          setOpen(false);
          setDismissed(true);
        }} />
      <span id={tooltipId} className="gold-meter__tooltip" role="tooltip">{message}</span>
    </div>
  );
}

function VaultIcon({ name }) {
  return <StorageArt src={VAULT_BUTTON_ART[name]} className="gold-storage__button-art" />;
}

export function StorageScreen({ gold, equippedCosmetics, onToggleCosmetic, showDecorations, onToggleDecorations,
  reducedMotion, inputBlocked, onBack, onSettings, onAcknowledge }) {
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
  const cosmeticsRef = useRef(null);
  const animating = !finished && !reducedMotion;
  const total = animating ? frame.total : gold.total;

  const highestGoal = getHighestGoldGoal(total);
  const decorationsLabel = showDecorations ? "Ocultar decorações" : "Mostrar decorações";
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
    let previous = getDepositFrame(timeline, elapsedRef.current);

    const paint = (now) => {
      start ??= now - elapsedRef.current;
      const elapsed = now - start;
      elapsedRef.current = elapsed;
      if (elapsed >= timeline.duration) {
        finish();
        return;
      }
      const next = getDepositFrame(timeline, elapsed);
      if (next.arrived > (previous?.arrived ?? 0)) playGameSound("goldDeposit");
      if (next.total !== previous?.total || next.arrived !== previous?.arrived) {
        setFrame(next);
        previous = next;
      }
      if (ctx && coinRef.current && trackRef.current) {
        const bounds = canvas.getBoundingClientRect();
        const target = trackRef.current.getBoundingClientRect();
        const width = Math.round(bounds.width * pixelRatio);
        const height = Math.round(bounds.height * pixelRatio);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, bounds.width, bounds.height);
        drawDepositFrame(ctx, timeline, elapsed, bounds, {
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
      if (event.target.closest?.(".gold-meter__inspect")) return;
      if (event.key !== "Escape" && !event.target.closest?.(".gold-storage")) return;
      event.preventDefault();
      if (document.activeElement === skipRef.current) titleRef.current?.focus();
      finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [animating, finish, inputBlocked]);

  return (
    <main className="laboratory-scene gold-storage" aria-labelledby="gold-title" onClickCapture={(event) => {
      if (!animating || inputBlocked || event.target.closest?.(".gold-meter__inspect")) return;
      event.preventDefault();
      event.stopPropagation();
      if (document.activeElement === skipRef.current) titleRef.current?.focus();
      finish();
    }}>
      <img className="laboratory-scene__background gold-storage__background"
        src={`${APP_BASE}assets/laboratory/laboratory-background-clean.webp`} alt="" />
      {showDecorations ? <Decorations total={total} /> : null}
      {animating ? <canvas ref={canvasRef} className="gold-storage__flights" aria-hidden="true" /> : null}

      <header className="laboratory-scene__topbar gold-storage__header">
        <button type="button" className="laboratory-scene__icon-button gold-storage__button gold-storage__back" onClick={onBack}
          aria-label="Voltar à seleção de fases" title="Voltar à seleção de fases">
          <img className="gold-storage__button-art" src={getPauseAssetUrl(RETURN_ICON_FILE, APP_BASE)} alt="" draggable={false} />
        </button>
        <h1 id="gold-title" className="laboratory-scene__title" ref={titleRef} tabIndex={-1}>Cofre de Moedas</h1>
        <button type="button" className="laboratory-scene__icon-button laboratory-scene__icon-button--settings gold-storage__button"
          onClick={onSettings} aria-label="Abrir configurações">
          <img className="gold-storage__button-art" src={getMenuAssetUrl("settings.webp", APP_BASE)} alt="" draggable={false} />
        </button>
      </header>

      <div className="gold-storage__layout">
        <StorageTreasure treasure={highestGoal?.treasure ?? EMPTY_TREASURE} hasGold={total > 0}
          isFinal={highestGoal === GOLD_GOALS.at(-1)} reducedMotion={reducedMotion} />
        <section className="gold-storage__vault" aria-label="Saldo de ouro">
          {animating ? (
            <>
              <div className="gold-storage__deposit">
                <img ref={coinRef} src={COIN_URL} alt="" />
                <span><strong>+{format.format(gold.total - total)}</strong> a depositar</span>
              </div>
              <button className="gold-storage__button gold-storage__skip" ref={skipRef} type="button">
                <VaultIcon name="skip" /> Pular animação
              </button>
            </>
          ) : (
            <div className="gold-storage__customization-actions">
              <button className="gold-storage__button gold-storage__button--icon" type="button" onClick={onToggleDecorations}
                aria-label={decorationsLabel} title={decorationsLabel}>
                <VaultIcon name="decorations" />
              </button>
              <button className="gold-storage__button gold-storage__button--icon" type="button" aria-haspopup="dialog"
                aria-label="Personalizar foguete" title="Personalizar foguete"
                onClick={() => cosmeticsRef.current?.showModal()}><VaultIcon name="cosmetics" /></button>
            </div>
          )}
          <div className="gold-storage__balance">{format.format(total)} ouro</div>
          <GoldMeter total={total} trackRef={trackRef} pulse={animating ? frame.arrived : 0} />
          <div className="sr-only" role="status">
            {revealed.length > 0 ? `${revealed.at(-1).treasure.name} liberado` : ""}
          </div>
        </section>
      </div>
      <dialog ref={cosmeticsRef} className="gold-storage__cosmetics" aria-labelledby="rocket-cosmetics-title">
        <div className="gold-storage__cosmetics-heading">
          <h2 id="rocket-cosmetics-title">Cosméticos do foguete</h2>
          <button type="button" className="gold-storage__button" onClick={() => cosmeticsRef.current?.close()}>
            <VaultIcon name="close" /> Fechar
          </button>
        </div>
        <ul className="gold-storage__cosmetics-list">
          {ROCKET_COSMETICS.map(({ id, name, amount }) => {
            const unlocked = gold.total >= amount;
            const equipped = equippedCosmetics.includes(id);
            return (
              <li key={id}>
                <button className="gold-storage__cosmetic" type="button" disabled={!unlocked} aria-pressed={equipped}
                  onClick={() => onToggleCosmetic(id)}>
                  <img src={getRocketCosmeticUrl(id, APP_BASE)} alt="" draggable={false} />
                  <span><strong>{name}</strong><small>{format.format(amount)} de ouro</small></span>
                  <small>{equipped ? "Em uso" : unlocked ? "Liberado" : "Bloqueado"}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </dialog>
    </main>
  );
}
