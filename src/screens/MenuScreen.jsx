import { useEffect, useId, useState } from "react";
import { getMenuAssetUrl } from "./menuModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const menuAsset = (filename) => getMenuAssetUrl(filename, APP_BASE);

const NOTICE_CONTENT = {
  shop: {
    title: "Loja",
    body: "A loja ainda não está disponível nesta versão. Suas moedas e diamantes continuam guardados no progresso da missão.",
  },
  info: {
    title: "Informações da missão",
    body: "Pilote com as setas, o mouse ou arrastando na tela. Leve o foguete até a resposta correta para ganhar velocidade e resgatar a flora de cada planeta.",
  },
};

export function MenuScreen({ warning, onPlay, onSettings, onCommandRoom }) {
  const [notice, setNotice] = useState(null);
  const noticeTitleId = useId();

  useEffect(() => {
    if (!notice) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setNotice(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [notice]);

  const noticeContent = notice ? NOTICE_CONTENT[notice] : null;

  return (
    <main
      className="screen menu screen--home"
      aria-labelledby="game-title"
      style={{ "--menu-background": `url("${menuAsset("background.png")}")` }}
    >
      <button type="button" className="menu__settings" onClick={onSettings} aria-label="Abrir configurações" title="Configurações">
        <img src={menuAsset("settings.png")} alt="" />
      </button>

      <section className="menu__layout">
        <h1 id="game-title" className="sr-only">RocketBloom</h1>
        <img className="menu__logo" src={menuAsset("logo.png")} alt="RocketBloom" />

        <nav className="menu__buttons" aria-label="Menu principal">
          <button type="button" className="menu__play" onClick={onPlay}>
            <img src={menuAsset("play.png")} alt="" />
            <span>Jogar</span>
          </button>

          <button type="button" className="menu__option menu__option--laboratory" onClick={onCommandRoom}>
            <img src={menuAsset("laboratory.png")} alt="" />
            <span>Laboratório</span>
          </button>
          <button type="button" className="menu__option menu__option--shop" onClick={() => setNotice("shop")}>
            <img src={menuAsset("shop.png")} alt="" />
            <span>Loja</span>
          </button>
          <button type="button" className="menu__option menu__option--info" onClick={() => setNotice("info")}>
            <span className="menu__info-icon" aria-hidden="true">i</span>
            <span>Informações</span>
          </button>
        </nav>
      </section>

      {warning ? <p className="menu__warning" role="status">{warning}</p> : null}

      {noticeContent ? (
        <div className="menu__notice-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setNotice(null);
        }}>
          <section className="menu__notice panel" role="dialog" aria-modal="true" aria-labelledby={noticeTitleId}>
            <h2 id={noticeTitleId}>{noticeContent.title}</h2>
            <p className="muted">{noticeContent.body}</p>
            <button type="button" className="btn btn--launch" onClick={() => setNotice(null)} autoFocus>
              Voltar
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
