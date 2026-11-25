export function BootScreen({ progress = { total: 0, completed: 0, loaded: 0, failed: 0 }, baseUrl = "/", onSkip, onRetry }) {
  const percentage = progress.total ? Math.floor((progress.loaded / progress.total) * 100) : 100;
  const needsRetry = progress.failed > 0 && progress.completed === progress.total;

  return (
    <main className="screen screen--boot" aria-labelledby="boot-title">
      <section className="boot__content">
        <img className="boot__logo" src={`${baseUrl}assets/menu/logo.webp`} alt="RocketBloom" />
        <p className="eyebrow boot__eyebrow">MISSÃO SUSTENTÁVEL <span>·</span> BASE DE LANÇAMENTO</p>
        <h1 id="boot-title" className="boot__title">Cultivando vida<br />entre as estrelas</h1>
        <p className="boot__message" aria-live="polite">
          {needsRetry ? "Algumas imagens não carregaram." : "Preparando seu universo"}
        </p>

        <div className="boot__loading">
          <div className="boot__loading-labels">
            <span>CARREGANDO RECURSOS</span>
            <span>{progress.loaded} <i>/</i> {progress.total}</span>
          </div>
          <div
            className="boot__progress-track"
            role="progressbar"
            aria-label="Carregamento das imagens do jogo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-valuetext={`${percentage}% · ${progress.loaded} de ${progress.total} imagens`}
          >
            <span className="boot__progress-fill" style={{ width: `${percentage}%` }}>
              <img className="boot__progress-rocket" src={`${baseUrl}assets/rocket.webp`} alt="" draggable={false} />
            </span>
          </div>
          <div className="boot__loading-foot">
            <span><i className="boot__signal" /> {progress.failed ? `${progress.failed} recurso(s) indisponível(is)` : "Sincronizando carta estelar"}</span>
            <strong>{percentage}%</strong>
          </div>
        </div>
        <div className="boot__actions">
          <button type="button" className="btn btn--ghost boot__skip" onClick={onSkip}>Pular carregamento</button>
          {needsRetry ? <button type="button" className="btn" onClick={onRetry}>Tentar novamente</button> : null}
        </div>
      </section>
    </main>
  );
}
