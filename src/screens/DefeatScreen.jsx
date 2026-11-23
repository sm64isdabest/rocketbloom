export function DefeatScreen({ onRetry, onStorage }) {
  return (
    <div className="defeat-overlay">
      <section className="defeat-popup" role="dialog" aria-modal="true" aria-labelledby="defeat-title">
        <h1 id="defeat-title">Game Over!</h1>
        <button type="button" className="defeat-retry" onClick={onRetry}>Tentar novamente</button>
        {onStorage ? <button type="button" className="btn btn--ghost" onClick={onStorage}>Abrir armazém</button> : null}
      </section>
    </div>
  );
}
