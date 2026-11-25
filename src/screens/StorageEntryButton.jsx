import { STORAGE_ICON } from "../assets/storageAssets.js";
import { StorageArt } from "../components/StorageArt.jsx";
import { hasUnseenGoldGoals } from "../utils/goldStorage.js";

export function StorageEntryButton({ gold, buttonRef, onClick }) {
  const isNew = hasUnseenGoldGoals(gold);

  return (
    <button type="button" ref={buttonRef} className={`phase-selection-storage${isNew ? " has-new" : ""}`}
      onClick={onClick}
      aria-label={`Abrir Cofre de Moedas${isNew ? ", nova meta alcançada" : ""}`}>
      <StorageArt src={STORAGE_ICON} className="phase-selection-storage__icon" />
      {isNew ? <span className="phase-selection-storage__new" aria-hidden="true" /> : null}
    </button>
  );
}
