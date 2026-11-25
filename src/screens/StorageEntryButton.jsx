import { STORAGE_ICON } from "../assets/storageAssets.js";
import { StorageArt } from "../components/StorageArt.jsx";
import { hasUnseenGoldGoals } from "../utils/goldStorage.js";

const APP_BASE = import.meta.env.BASE_URL;

export function StorageEntryButton({ gold, buttonRef, guided, blocked, onClick }) {
  const isNew = hasUnseenGoldGoals(gold);

  return (
    <button type="button" ref={buttonRef} className={`phase-selection-storage${isNew ? " has-new" : ""}`}
      onClick={onClick} inert={blocked}
      aria-describedby={guided ? "phase-selection-guide-hint" : undefined}
      aria-label={`Abrir Cofre de Moedas${isNew ? ", nova meta alcançada" : ""}`}>
      <StorageArt src={STORAGE_ICON} className="phase-selection-storage__icon" />
      {isNew ? <img className="phase-selection-notice" src={`${APP_BASE}assets/ui/laboratory-notice.webp`} alt="" /> : null}
    </button>
  );
}
