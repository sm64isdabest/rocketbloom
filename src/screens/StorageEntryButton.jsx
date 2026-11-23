import { useEffect, useState } from "react";
import { StorageIcon } from "../components/StorageArt.jsx";
import { hasUnseenGoldGoals } from "../utils/goldStorage.js";

const format = new Intl.NumberFormat("pt-BR");

export function StorageEntryButton({ gold, previousBalance, reducedMotion, paused, buttonRef, onClick }) {
  const [shown, setShown] = useState(() => previousBalance.current ?? gold.total);
  const total = gold.total;
  const isNew = hasUnseenGoldGoals(gold);

  useEffect(() => {
    if (paused) return undefined;
    const from = previousBalance.current ?? total;
    if (reducedMotion || total <= from) {
      previousBalance.current = total;
      setShown(total);
      return undefined;
    }

    let start;
    let frameId;
    const step = (timestamp) => {
      start ??= timestamp;
      const progress = Math.min(1, (timestamp - start) / 520);
      const value = Math.round(from + (total - from) * (1 - (1 - progress) ** 3));
      previousBalance.current = value;
      setShown(value);
      if (progress < 1) frameId = window.requestAnimationFrame(step);
    };
    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [paused, previousBalance, reducedMotion, total]);

  return (
    <button type="button" ref={buttonRef} className={`phase-selection-storage${isNew ? " has-new" : ""}`}
      onClick={onClick} title="Armazém de ouro"
      aria-label={`Abrir Armazém, ${format.format(total)} de ouro${isNew ? ", nova meta alcançada" : ""}`}>
      <StorageIcon />
      <span className="phase-selection-storage__copy">
        <span>Armazém</span>
        <strong>{format.format(reducedMotion ? total : shown)}</strong>
      </span>
      {isNew ? <span className="phase-selection-storage__new" aria-hidden="true" /> : null}
    </button>
  );
}
