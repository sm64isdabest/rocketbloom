import { MenuSpaceBackground } from "./MenuSpaceBackground.jsx";
import { MuteButton } from "../components/MuteButton.jsx";
import { getMenuAssetUrl } from "./menuModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const menuAsset = (filename) => getMenuAssetUrl(filename, APP_BASE);

export function MenuScreen({ warning, muted, onToggleMute, onPlay, onSettings }) {
  return (
    <main
      className="screen menu screen--home"
      aria-labelledby="game-title"
      style={{ "--menu-background": `url("${menuAsset("background.webp")}")` }}
    >
      <MenuSpaceBackground />
      <div className="menu__controls">
        <MuteButton muted={muted} onToggle={onToggleMute} />
        <button type="button" className="menu__settings" onClick={onSettings} aria-label="Abrir configurações" title="Configurações">
          <img src={menuAsset("settings.webp")} alt="" />
        </button>
      </div>

      <section className="menu__layout">
        <h1 id="game-title" className="sr-only">RocketBloom</h1>
        <img className="menu__logo" src={menuAsset("logo.webp")} alt="RocketBloom" />

        <nav className="menu__buttons" aria-label="Menu principal">
          <button type="button" className="menu__play" onClick={onPlay}>
            <img src={menuAsset("play.webp")} alt="" />
            <span>Jogar</span>
          </button>
        </nav>
      </section>

      {warning ? <p className="menu__warning" role="status">{warning}</p> : null}
    </main>
  );
}
