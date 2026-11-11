import { useState } from "react";
import { PLANETS } from "../game/data/planets.js";
import { PLANTS } from "../game/data/plants.js";
import { getLaboratoryPlantImage, getNextPlanetIndex } from "./laboratoryModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const asset = (path) => `${APP_BASE}${path}`;

export function CommandRoomScreen({ progress, onBack, onSettings }) {
  const [planetIndex, setPlanetIndex] = useState(0);
  const planet = PLANETS[planetIndex];
  const plant = PLANTS.find((entry) => entry.id === planet.plantId);
  const rescued = progress.rescuedPlantIds.includes(plant.id);
  const growthStage = rescued
    ? Math.min(plant.growthStages.length - 1, progress.plantGrowthStages?.[plant.id] ?? 0)
    : 0;
  const plantImage = getLaboratoryPlantImage(planet.id, growthStage, APP_BASE);
  const changePlanet = (direction) => setPlanetIndex((index) => getNextPlanetIndex(index, direction, PLANETS.length));

  return (
    <main className={`laboratory-scene laboratory-scene--${planet.id}`} aria-label="Laboratório orbital">
      <img className="laboratory-scene__background" src={asset("assets/laboratory/laboratory-background.png")} alt="" aria-hidden="true" />

      <header className="laboratory-scene__topbar">
        <button type="button" className="laboratory-scene__icon-button" onClick={onBack} aria-label="Voltar à base">
          <span aria-hidden="true">↩</span>
        </button>
        <span className="laboratory-scene__title">Laboratório orbital</span>
        <button type="button" className="laboratory-scene__icon-button" onClick={onSettings} aria-label="Abrir configurações">
          <img src={asset("assets/menu/settings.png")} alt="" aria-hidden="true" />
        </button>
      </header>

      <div className="laboratory-specimen" aria-live="polite" key={planet.id}>
        <img
          className="laboratory-specimen__plant"
          src={plantImage}
          alt={`${plant.name}, ${planet.name}${rescued ? `, ${plant.growthStages[growthStage]}` : ", muda"}`}
        />
      </div>

      <nav className="laboratory-planet-navigation" aria-label="Plantas por planeta">
        <button type="button" className="laboratory-planet-navigation__arrow" onClick={() => changePlanet(-1)} aria-label="Planta do planeta anterior">
          <span aria-hidden="true">◀</span>
        </button>
        <div className="laboratory-planet-display">
          <img src={asset(`assets/ui/planets/${planet.id}-icon.png`)} alt="" aria-hidden="true" />
        </div>
        <button type="button" className="laboratory-planet-navigation__arrow" onClick={() => changePlanet(1)} aria-label="Planta do próximo planeta">
          <span aria-hidden="true">▶</span>
        </button>
      </nav>

      <footer className="laboratory-plant-caption" aria-live="polite">
        <span className="laboratory-plant-caption__eyebrow">{rescued ? `Estágio ${growthStage + 1} de ${plant.growthStages.length}` : "Amostra botânica"}</span>
        <h1>{plant.name}</h1>
        <p>Planeta {planet.name}</p>
      </footer>
    </main>
  );
}
