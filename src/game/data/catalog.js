import { PLANETS } from "./planets.js";
import { QUESTION_POOLS } from "./questions.js";
import { PLANTS } from "./plants.js";
import { OBSTACLES } from "./obstacles.js";
import { COLLECTIBLES } from "./items.js";

export function validateCatalog() {
  const errors = [];

  if (!PLANETS.length) {
    errors.push("Nenhum planeta configurado.");
  }

  for (const planet of PLANETS) {
    if (planet.stages?.length !== 5) {
      errors.push(`Planeta ${planet.id} deve possuir exatamente cinco fases.`);
    }
    for (const [index, stage] of (planet.stages ?? []).entries()) {
      if (stage.planetId !== planet.id) errors.push(`Fase ${stage.id} aponta para planeta incorreto.`);
      if (!(stage.durationMs > 0) || !(stage.obstacleIntervalMs > 0) || !(stage.speedMultiplier > 0)) {
        errors.push(`Fase ${stage.id} possui parâmetros de campanha inválidos.`);
      }
      if (!stage.questionCategories?.length || !stage.questionLimits || !stage.completion || !stage.rewards) {
        errors.push(`Fase ${stage.id} não possui parâmetros completos de campanha.`);
      }
      if (index > 0 && stage.obstacleIntervalMs >= planet.stages[index - 1].obstacleIntervalMs) {
        errors.push(`A frequência de obstáculos não aumenta em ${stage.id}.`);
      }
    }
    if (!QUESTION_POOLS[planet.questionPoolId]?.length) {
      errors.push(`Planeta ${planet.id} está sem perguntas.`);
    }
    if (!PLANTS.some((plant) => plant.id === planet.plantId)) {
      errors.push(`Planeta ${planet.id} aponta para planta inexistente.`);
    }
    const plant = PLANTS.find((entry) => entry.id === planet.plantId);
    if (plant && (plant.planetId !== planet.id || plant.growthStages?.length !== 5 || !plant.palette || !(plant.moneyReward >= 0))) {
      errors.push(`Planta ${plant.id} possui dados de resgate ou crescimento inválidos.`);
    }
    for (const obstacleId of planet.obstacleIds) {
      if (!OBSTACLES.some((obstacle) => obstacle.id === obstacleId)) {
        errors.push(`Obstáculo ${obstacleId} não existe (${planet.id}).`);
      }
    }
  }

  if (PLANETS.reduce((total, planet) => total + planet.stages.length, 0) !== 20) {
    errors.push("A campanha deve possuir exatamente vinte fases.");
  }

  if (!COLLECTIBLES.length) {
    errors.push("Itens coletáveis não configurados.");
  }

  return errors;
}
