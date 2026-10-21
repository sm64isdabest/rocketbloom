export function ErrorScreen({ message, onRetry }) {
  return (
    <section className="screen screen--center">
      <p className="eyebrow">Falha no sistema</p>
      <h1>Não foi possível continuar</h1>
      <p className="muted">{message}</p>
      {onRetry ? (
        <button type="button" className="btn" onClick={onRetry}>
          Tentar de novo
        </button>
      ) : null}
    </section>
  );
}
