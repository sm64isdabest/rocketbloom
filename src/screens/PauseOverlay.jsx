import { useState } from "react";
import { getPauseActions, getPauseAssetUrl } from "./pauseModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";

export function PauseOverlay({ onResume, onQuit, onSettings, onTapRocket, reducedMotion = false, settingsOpen = false }) {
  const [reaction, setReaction] = useState(0);
  const actions = getPauseActions({ onQuit, onResume, onSettings });

  return (
    <div className="pause-overlay" inert={settingsOpen}>
      <section className="pause-popup" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <h2 id="pause-title">Jogo pausado</h2>
        <button
          type="button"
          className={`pause-popup__rocket ${reaction > 0 && !reducedMotion ? "is-angry" : ""}`}
          onClick={() => {
            setReaction((value) => value + 1);
            onTapRocket?.();
          }}
          aria-label="Tocar no foguete com jornal"
        >
          <img
            key={reaction}
            src={getPauseAssetUrl("rocket-newspaper.webp", APP_BASE)}
            alt="Foguete lendo um jornal"
          />
        </button>
        <nav className="pause-popup__actions" aria-label="Ações da fase pausada">
          {actions.map(({ id, label, asset, onClick }) => (
            <button key={id} type="button" className="pause-popup__action" onClick={onClick} aria-label={label} title={label}>
              <img src={getPauseAssetUrl(asset, APP_BASE)} alt="" />
            </button>
          ))}
        </nav>
      </section>
    </div>
  );
}
