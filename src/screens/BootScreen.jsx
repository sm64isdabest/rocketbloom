export function BootScreen({ progress = { total: 0, completed: 0, loaded: 0, failed: 0 }, baseUrl = "/" }) {
  const percentage = progress.total ? Math.round((progress.completed / progress.total) * 100) : 100;

  return (
    <main className="screen screen--boot" aria-labelledby="boot-title">
      <div className="boot__topline" aria-hidden="true">
        <span><i /> SISTEMA DE BORDO</span>
        <span>RB · 001</span>
      </div>

      <section className="boot__content">
        <div className="boot__scene" aria-hidden="true">
          <span className="boot__orbit boot__orbit--outer" />
          <span className="boot__orbit boot__orbit--inner" />
          <span className="boot__planet boot__planet--green" />
          <span className="boot__planet boot__planet--blue" />
          <img className="boot__rocket" src={`${baseUrl}assets/rocket.png`} alt="" />
          <span className="boot__spark boot__spark--one" />
          <span className="boot__spark boot__spark--two" />
          <span className="boot__spark boot__spark--three" />
        </div>

        <img className="boot__logo" src={`${baseUrl}assets/menu/logo.png`} alt="" />
        <p className="eyebrow boot__eyebrow">MISSÃO SUSTENTÁVEL <span>·</span> BASE DE LANÇAMENTO</p>
        <h1 id="boot-title" className="boot__title">Cultivando vida<br />entre as estrelas</h1>
        <p className="boot__message" aria-live="polite">
          {percentage >= 100 ? "Tudo pronto para decolar" : "Preparando seu universo"}
        </p>

        <div className="boot__loading">
          <div className="boot__loading-labels">
            <span>CARREGANDO RECURSOS</span>
            <span>{progress.completed} <i>/</i> {progress.total}</span>
          </div>
          <div
            className="boot__progress-track"
            role="progressbar"
            aria-label="Carregamento das imagens do jogo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-valuetext={`${percentage}% · ${progress.completed} de ${progress.total} imagens`}
          >
            <span className="boot__progress-fill" style={{ width: `${percentage}%` }} />
            <span className="boot__progress-glow" style={{ left: `${percentage}%` }} />
          </div>
          <div className="boot__loading-foot">
            <span><i className="boot__signal" /> {progress.failed ? `${progress.failed} recurso(s) indisponível(is)` : "Sincronizando carta estelar"}</span>
            <strong>{percentage}%</strong>
          </div>
        </div>
      </section>

      <footer className="boot__footer" aria-hidden="true">
        <span>ROCKETBLOOM <i>©</i> 2026</span>
        <span>PROTEGENDO O FUTURO, UMA SEMENTE DE CADA VEZ</span>
      </footer>
    </main>
  );
}
