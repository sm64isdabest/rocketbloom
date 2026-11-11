import { useState } from "react";
import { PLANETS } from "../game/data/planets.js";
import { PLANTS } from "../game/data/plants.js";
import { getLaboratoryPlantImage, getNextPlanetIndex, shouldShowLaboratoryPlant } from "./laboratoryModel.js";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const asset = (path) => `${APP_BASE}${path}`;

export function CommandRoomScreen({ progress, onBack, onSettings }) {
  const [planetIndex, setPlanetIndex] = useState(0);
  const planet = PLANETS[planetIndex];
  const plant = PLANTS.find((entry) => entry.id === planet.plantId);
  const plantVisible = shouldShowLaboratoryPlant(planet, progress.completedStageIds);
  const growthStage = plantVisible
    ? Math.min(plant.growthStages.length - 1, progress.plantGrowthStages?.[plant.id] ?? 0)
    : 0;
  const plantImage = getLaboratoryPlantImage(planet.id, growthStage, APP_BASE);
  const changePlanet = (direction) => setPlanetIndex((index) => getNextPlanetIndex(index, direction, PLANETS.length));

  return (
    <main className={`laboratory-scene laboratory-scene--${planet.id}`} aria-label="Laboratório orbital">
      <img className="laboratory-scene__background" src={asset("assets/laboratory/laboratory-background.png")} alt="" aria-hidden="true" />

      <header className="laboratory-scene__topbar">
        <button type="button" className="laboratory-scene__icon-button" onClick={onBack} aria-label="Voltar à base">
          <img className="laboratory-scene__back-icon" src={asset("assets/laboratory/back.png")} alt="" aria-hidden="true" />
        </button>
        <span className="laboratory-scene__title">Laboratório orbital</span>
        <button type="button" className="laboratory-scene__icon-button laboratory-scene__icon-button--settings" onClick={onSettings} aria-label="Abrir configurações">
          <img src={asset("assets/menu/settings.png")} alt="" aria-hidden="true" />
        </button>
      </header>

      <div className={`laboratory-specimen ${plantVisible ? "is-visible" : "is-empty"}`} aria-live="polite" key={planet.id}>
        {plantVisible ? (
          <img
            className="laboratory-specimen__plant"
            src={plantImage}
            alt={`${plant.name}, ${planet.name}, ${plant.growthStages[growthStage]}`}
          />
        ) : null}
      </div>

      <nav className="laboratory-planet-navigation" aria-label="Plantas por planeta">
        <button type="button" className="laboratory-planet-navigation__arrow" onClick={() => changePlanet(-1)} aria-label="Planta do planeta anterior">
          <img src={asset("assets/laboratory/arrow-left.png")} alt="" aria-hidden="true" />
        </button>
        <div className="laboratory-planet-display">
          <img src={asset(`assets/ui/planets/${planet.id}-icon.png`)} alt="" aria-hidden="true" />
        </div>
        <button type="button" className="laboratory-planet-navigation__arrow" onClick={() => changePlanet(1)} aria-label="Planta do próximo planeta">
          <img src={asset("assets/laboratory/arrow-right.png")} alt="" aria-hidden="true" />
        </button>
      </nav>

      <footer className="laboratory-plant-caption" aria-live="polite">
        <span className="laboratory-plant-caption__eyebrow">{plantVisible ? `Estágio ${growthStage + 1} de ${plant.growthStages.length}` : "Primeira fase pendente"}</span>
        <h1>{plant.name}</h1>
        <p>Planeta {planet.name}</p>
      </footer>
    </main>
  );
}
