import { getPlantById } from "../game/data/plants.js";

export function VictoryScreen({ planetName, snapshot, rewards, onMenu, onNext }) {
  const rescuedPlant = rewards?.plantName ? getPlantById(rewards.plantName) : null;
  return (
    <section className="screen screen--center outcome-screen outcome-screen--win">
      <div className="outcome-orbit" aria-hidden="true">✦</div>
      <p className="eyebrow">Registro de missão · completo</p>
      <h1>Rota estabilizada</h1>
      <p className="muted">{rewards?.replayedStage ? "Fase concluída novamente. Os itens coletados nesta repetição não geram novos créditos." : `A expedição em ${planetName} chegou ao fim. Confira os recursos registrados nesta viagem.`}</p>
      <div className="outcome-rewards">
        <span><i className="resource-coin">●</i> {rewards?.coins ?? snapshot?.coins ?? 0}<small>{rewards?.replayedStage ? "moedas creditadas" : "moedas coletadas"}</small></span>
        <span><i className="resource-diamond">◆</i> {rewards?.diamonds ?? snapshot?.diamonds ?? 0}<small>{rewards?.replayedStage ? "diamantes creditados" : "diamantes coletados"}</small></span>
        <span>{snapshot?.score ?? 0}<small>pontos na missão</small></span>
        {rewards?.money ? <span>{rewards.money}<small>créditos científicos</small></span> : null}
        {rewards?.sustainabilityPoints ? <span>{rewards.sustainabilityPoints}<small>pontos ecológicos</small></span> : null}
      </div>
      {rescuedPlant ? <p className="mission-complete-note">{rescuedPlant.name} resgatada! Acompanhe seu crescimento no laboratório.</p> : null}
      <div className="row"><button type="button" className="btn btn--launch" onClick={onNext}>Próxima rota <span aria-hidden="true">→</span></button><button type="button" className="btn btn--ghost" onClick={onMenu}>Voltar à base</button></div>
    </section>
  );
}
