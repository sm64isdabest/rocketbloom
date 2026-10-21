import { PLANETS } from "../game/data/planets.js";

export function MenuScreen({ progress, warning, hasProgress, onPlay, onContinue, onSettings, onCommandRoom }) {
  const unlockedCount = progress.unlockedPlanetIds.length;
  const completedCount = progress.completedStageIds.length;
  return (
    <main className="screen menu screen--home">
      <div className="menu__topline"><span className="signal-dot" /> Base orbital · Sistema Solar</div>
      <section className="menu__hero" aria-labelledby="game-title">
        <div className="menu__copy">
          <p className="eyebrow">Missão de exploração sustentável</p>
          <h1 id="game-title" className="wordmark">Rocket<span>Bloom</span></h1>
          <p className="lede">Uma expedição científica para resgatar a flora rara do sistema solar. Pilote, descubra e faça a vida florescer.</p>
          {warning ? <p className="banner" role="status">{warning}</p> : null}
          <div className="menu__actions">
            <button type="button" className="btn btn--launch" onClick={onPlay}><span aria-hidden="true">✦</span> Jogar</button>
            {hasProgress ? <button type="button" className="btn btn--ghost" onClick={onContinue}>Continuar missão <span aria-hidden="true">↗</span></button> : null}
          </div>
          <p className="menu__hint"><span className="keycap">←</span> <span className="keycap">→</span> ou arraste para pilotar</p>
        </div>
        <div className="solar-art" aria-hidden="true">
          <div className="solar-art__orbit solar-art__orbit--one" /><div className="solar-art__orbit solar-art__orbit--two" />
          <div className="solar-art__planet solar-art__planet--main"><span /></div>
          <div className="solar-art__planet solar-art__planet--moon" />
          <div className="solar-art__rocket">◆</div><div className="solar-art__leaf">✦</div>
        </div>
      </section>
      <section className="mission-strip" aria-label="Resumo da missão">
        <div><span className="eyebrow">Carta estelar</span><strong>{unlockedCount} <small>/ {PLANETS.length}</small></strong><span>mundos localizados</span></div>
        <div><span className="eyebrow">Pesquisa</span><strong>{completedCount}</strong><span>fases concluídas</span></div>
        <div><span className="eyebrow">Recursos</span><strong><span className="resource-coin">●</span> {progress.coins} <span className="resource-diamond">◆</span> {progress.diamonds}</strong><span>moedas · diamantes</span></div>
        <div className="mission-strip__plant"><span aria-hidden="true">♧</span><p><b>Objetivo científico</b><br />Preservar uma espécie nativa em cada planeta.</p></div>
      </section>
      <footer className="menu__footer">
        <span>ROCKETBLOOM <i>•</i> DIÁRIO DE BORDO 01</span>
        <nav aria-label="Navegação da base">
          <button type="button" className="text-button" onClick={onCommandRoom}>Laboratório</button>
          <button type="button" className="text-button" onClick={onSettings}>Configurações</button>
        </nav>
      </footer>
    </main>
  );
}
