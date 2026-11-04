export function DefeatScreen({ onRetry }) {
  return (
    <div className="defeat-overlay">
      <section className="defeat-popup" role="dialog" aria-modal="true" aria-labelledby="defeat-title">
        <h1 id="defeat-title">Game Over!</h1>
        <button type="button" className="defeat-retry" onClick={onRetry}>Tentar novamente</button>
      </section>
    </div>
  );
}
