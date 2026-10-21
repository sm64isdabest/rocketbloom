import { PLANETS } from "../game/data/planets.js";
import { PLANTS } from "../game/data/plants.js";
import { PlantGrowthArt } from "../components/PlantGrowthArt.jsx";

export function CommandRoomScreen({ progress, onBack }) {
  const rescuedCount = progress.rescuedPlantIds.length;
  return (
    <main className="screen screen--section laboratory-screen">
      <header className="section-head">
        <button type="button" className="btn btn--back" onClick={onBack}>← Base</button>
        <div><p className="eyebrow">Laboratório orbital · biodiversidade</p><h1>Jardim de resgate</h1><p className="muted">Acompanhe as espécies salvas e veja a vida crescer a cada missão.</p></div>
      </header>

      <section className="command-summary laboratory-summary" aria-label="Progresso sustentável e recursos">
        <div><span className="eyebrow">Impacto sustentável</span><strong>{progress.sustainabilityPoints ?? 0}</strong><span>pontos ecológicos</span></div>
        <div><span className="eyebrow">Reserva de expedição</span><strong><i className="resource-coin">●</i> {progress.coins}</strong><span>moedas</span></div>
        <div><span className="eyebrow">Amostras raras</span><strong><i className="resource-diamond">◆</i> {progress.diamonds}</strong><span>diamantes</span></div>
        <div><span className="eyebrow">Pesquisa financiada</span><strong>{progress.money}</strong><span>créditos científicos</span></div>
      </section>

      <section className="command-log laboratory-garden" aria-labelledby="garden-title">
        <div className="command-log__head"><div><p className="eyebrow">Coleção da missão</p><h2 id="garden-title">Espécies resgatadas</h2></div><span>{rescuedCount} de {PLANTS.length} florescendo</span></div>
        <div className="plant-list">
          {PLANETS.map((planet) => {
            const plant = PLANTS.find((entry) => entry.id === planet.plantId);
            if (!plant) return null;
            const rescued = progress.rescuedPlantIds.includes(plant.id);
            const unlocked = progress.unlockedPlanetIds.includes(planet.id);
            const growthStage = rescued ? Math.min(plant.growthStages.length - 1, progress.plantGrowthStages?.[plant.id] ?? 0) : 0;
            const growthLabel = rescued ? plant.growthStages[growthStage] : unlocked ? "Missão em andamento" : "Planeta ainda bloqueado";
            return (
              <article key={plant.id} className={`plant-entry plant-specimen ${rescued ? "is-rescued" : "is-undiscovered"}`} style={{ "--plant-leaf": plant.palette.leaf, "--plant-flower": plant.palette.flower }}>
                <div className="plant-entry__art"><PlantGrowthArt plant={plant} stage={growthStage} locked={!rescued} /></div>
                <div className="plant-specimen__details">
                  <span className="eyebrow">Origem · {planet.name}</span>
                  <h3>{plant.name}</h3>
                  <p>{rescued ? `Estágio de crescimento: ${growthLabel}` : `${growthLabel}. Conclua a campanha de ${planet.name} para resgatá-la.`}</p>
                  <div className="growth-track" role="img" aria-label={`${rescued ? growthStage + 1 : 0} de ${plant.growthStages.length} estágios de crescimento`}>
                    {plant.growthStages.map((label, index) => <span key={label} className={rescued && index <= growthStage ? "is-grown" : ""} />)}
                  </div>
                  <small className="growth-caption">{rescued ? `${growthStage + 1}/${plant.growthStages.length} · ${plant.growthStages.length - growthStage - 1} estágio(s) até a maturidade` : `Recompensa de resgate: ${plant.moneyReward} créditos + ${plant.sustainabilityPoints} pontos ecológicos`}</small>
                </div>
                <span className={`plant-entry__status ${rescued ? "" : "plant-entry__status--pending"}`}>{rescued ? "Resgatada" : unlocked ? "Aguardando resgate" : "A descobrir"}</span>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
