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
    if (!planet.stages?.length) {
      errors.push(`Planeta ${planet.id} não possui fases.`);
    }
    for (const stage of planet.stages ?? []) {
      if (stage.planetId !== planet.id) errors.push(`Fase ${stage.id} aponta para planeta incorreto.`);
      if (!(stage.durationMs > 0) || !(stage.obstacleIntervalMs > 0) || !(stage.speedMultiplier > 0)) {
        errors.push(`Fase ${stage.id} possui parâmetros de campanha inválidos.`);
      }
      if (!stage.questionCategories?.length || !stage.questionLimits || !stage.completion || !stage.rewards) {
        errors.push(`Fase ${stage.id} não possui parâmetros completos de campanha.`);
      }
    }
    if (!QUESTION_POOLS[planet.questionPoolId]?.length) {
      errors.push(`Planeta ${planet.id} está sem perguntas.`);
    }
    if (!PLANTS.some((plant) => plant.id === planet.plantId)) {
      errors.push(`Planeta ${planet.id} aponta para planta inexistente.`);
    }
    const plant = PLANTS.find((entry) => entry.id === planet.plantId);
    if (plant && (plant.planetId !== planet.id || !plant.growthStages?.length || !plant.palette || !(plant.moneyReward >= 0))) {
      errors.push(`Planta ${plant.id} possui dados de resgate ou crescimento inválidos.`);
    }
    for (const obstacleId of planet.obstacleIds) {
      if (!OBSTACLES.some((obstacle) => obstacle.id === obstacleId)) {
        errors.push(`Obstáculo ${obstacleId} não existe (${planet.id}).`);
      }
    }
  }

  if (!COLLECTIBLES.length) {
    errors.push("Itens coletáveis não configurados.");
  }

  return errors;
}
