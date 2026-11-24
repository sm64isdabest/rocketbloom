import { useState } from "react";
import { PLANETS } from "../game/data/planets.js";
import { getPlantForPlanet } from "../game/data/plants.js";
import { getLaboratoryGrowthIndex, getPendingLaboratoryStage } from "../utils/laboratoryProgress.js";
import { getLaboratoryPlantImage, getLaboratoryPlantScale, getNextPlanetIndex, shouldShowLaboratoryPlant } from "./laboratoryModel.js";
import { getPauseAssetUrl, RETURN_ICON_FILE } from "./pauseModel.js";
import { PlantCareGame } from "./PlantCareGame.jsx";

const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const asset = (path) => `${APP_BASE}${path}`;

export function CommandRoomScreen({ progress, onBack, onSettings, decoration, initialPlanetId, onVisitPlanet, onCareComplete }) {
  const [planetIndex, setPlanetIndex] = useState(() => Math.max(0, PLANETS.findIndex(({ id }) => id === initialPlanetId)));
  const planet = PLANETS[planetIndex];
  const [activeStageId, setActiveStageId] = useState(() => getPendingLaboratoryStage(planet, progress)?.id ?? null);
  const plant = getPlantForPlanet(planet.id);
  const plantVisible = shouldShowLaboratoryPlant(planet, progress.completedStageIds);
  const growthStage = getLaboratoryGrowthIndex(planet, progress);
  const plantStageScale = getLaboratoryPlantScale(growthStage);
  const plantImage = getLaboratoryPlantImage(planet.id, growthStage, APP_BASE);
  const pendingStage = getPendingLaboratoryStage(planet, progress);
  const activityIndex = planet.stages.findIndex(({ id }) => id === activeStageId);
  const gameId = activityIndex > 0 ? progress.laboratoryActivities?.[activeStageId] : null;

  const changePlanet = (direction) => {
    const nextIndex = getNextPlanetIndex(planetIndex, direction, PLANETS.length);
    setActiveStageId(null);
    setPlanetIndex(nextIndex);
    onVisitPlanet(PLANETS[nextIndex].id);
  };

  const startCare = () => {
    if (!pendingStage) return;
    onVisitPlanet(planet.id);
    setActiveStageId(pendingStage.id);
  };

  return (
    <main className={`laboratory-scene laboratory-scene--${planet.id}`} aria-label="Laboratório orbital">
      <img className="laboratory-scene__background" src={asset("assets/laboratory/laboratory-background-clean.png")} alt="" aria-hidden="true" />
      {decoration}

      <header className="laboratory-scene__topbar">
        <button type="button" className="laboratory-scene__icon-button" onClick={onBack} aria-label="Voltar à base">
          <img className="laboratory-scene__back-icon" src={getPauseAssetUrl(RETURN_ICON_FILE, APP_BASE)} alt="" aria-hidden="true" />
        </button>
        <span className="laboratory-scene__title">Laboratório orbital</span>
        <button type="button" className="laboratory-scene__icon-button laboratory-scene__icon-button--settings" onClick={onSettings} aria-label="Abrir configurações">
          <img src={asset("assets/menu/settings.webp")} alt="" aria-hidden="true" />
        </button>
      </header>

      <div className="laboratory-equipment">
        <img className="laboratory-equipment__base" src={asset("assets/laboratory/laboratory-equipment-base.png")} alt="" aria-hidden="true" />
        <img className="laboratory-equipment__dome laboratory-equipment__dome--back" src={asset("assets/laboratory/laboratory-dome-back.png")} alt="" aria-hidden="true" />

        <div className={`laboratory-specimen ${plantVisible ? "is-visible" : "is-empty"}`} aria-live="polite" key={`${planet.id}-${growthStage}`}>
          {plantVisible ? (
            <img
              className="laboratory-specimen__plant"
              src={plantImage}
              alt={`${plant.name}, ${planet.name}, ${plant.growthStages[growthStage]}`}
              style={{ width: `${plantStageScale * 100}%` }}
            />
          ) : null}
        </div>

        <img className="laboratory-equipment__dome laboratory-equipment__dome--front" src={asset("assets/laboratory/laboratory-dome-front.png")} alt="" aria-hidden="true" />

        <div className="laboratory-planet-display">
          <img src={asset(`assets/ui/planets/${planet.id}-icon.webp`)} alt="" aria-hidden="true" />
        </div>
      </div>

      <nav className="laboratory-planet-navigation" aria-label="Plantas por planeta">
        <button type="button" className="laboratory-planet-navigation__arrow" onClick={() => changePlanet(-1)} aria-label="Planta do planeta anterior">
          <img src={asset("assets/laboratory/arrow-left.webp")} alt="" aria-hidden="true" />
        </button>
        <button type="button" className="laboratory-planet-navigation__arrow" onClick={() => changePlanet(1)} aria-label="Planta do próximo planeta">
          <img src={asset("assets/laboratory/arrow-right.webp")} alt="" aria-hidden="true" />
        </button>
      </nav>

      <footer className="laboratory-plant-caption" aria-live="polite">
        <span className="laboratory-plant-caption__eyebrow">{plantVisible ? `Estágio ${growthStage + 1} de ${plant.growthStages.length}` : "Primeira fase pendente"}</span>
        <h1>{plant.name}</h1>
        <p>Planeta {planet.name}</p>
        {pendingStage ? (
          <button className="btn laboratory-care-button" type="button" onClick={startCare}>
            Cuidar da planta
          </button>
        ) : null}
      </footer>
      {gameId ? (
        <PlantCareGame
          key={activeStageId}
          gameId={gameId}
          planetName={planet.name}
          plantName={plant.name}
          currentPlantImage={getLaboratoryPlantImage(planet.id, activityIndex - 1, APP_BASE)}
          nextPlantImage={getLaboratoryPlantImage(planet.id, activityIndex, APP_BASE)}
          targetStage={activityIndex + 1}
          onComplete={() => onCareComplete(planet.id, activeStageId, gameId)}
          onClose={() => setActiveStageId(null)}
        />
      ) : null}
    </main>
  );
}
