import { PLANETS } from "./planets.js";
import { QUESTION_BANK, getQuestionsForStage } from "./questions.js";
import { PLANTS } from "./plants.js";
import { OBSTACLES } from "./obstacles.js";
import { COLLECTIBLES } from "./items.js";

function validateStageQuestions(stage, errors) {
  const questions = getQuestionsForStage(stage.id);
  if (questions.length !== 10) errors.push(`Fase ${stage.id} deve possuir exatamente dez perguntas.`);

  const questionIds = new Set();
  for (const question of questions) {
    if (!question || typeof question !== "object") {
      errors.push(`Fase ${stage.id} contém uma pergunta inválida.`);
      continue;
    }
    if (!question.id || questionIds.has(question.id)) {
      errors.push(`Fase ${stage.id} possui ID de pergunta vazio ou duplicado (${question.id ?? "sem ID"}).`);
    }
    questionIds.add(question.id);
    if (typeof question.prompt !== "string" || !question.prompt.trim()) {
      errors.push(`Pergunta ${question.id} da fase ${stage.id} está sem enunciado válido.`);
    }
    if (!stage.questionCategories?.includes(question.category)) {
      errors.push(`Pergunta ${question.id} usa operação inválida na fase ${stage.id}.`);
    }
    if (!Number.isFinite(question.correctAnswer)
      || !Array.isArray(question.choices)
      || question.choices.length !== 4
      || question.choices.some((choice) => !Number.isFinite(choice))
      || new Set(question.choices).size !== 4
      || question.choices.filter((choice) => choice === question.correctAnswer).length !== 1) {
      errors.push(`Pergunta ${question.id} da fase ${stage.id} deve ter quatro alternativas numéricas distintas e uma resposta correta.`);
    }

  }
}

export function validateCatalog() {
  const errors = [];

  if (!PLANETS.length) errors.push("Nenhum planeta configurado.");

  for (const planet of PLANETS) {
    if (planet.stages?.length !== 5) errors.push(`Planeta ${planet.id} deve possuir exatamente cinco fases.`);
    for (const [index, stage] of (planet.stages ?? []).entries()) {
      if (stage.planetId !== planet.id) errors.push(`Fase ${stage.id} aponta para planeta incorreto.`);
      if (!(stage.durationMs > 0) || !(stage.obstacleIntervalMs > 0) || !(stage.speedMultiplier > 0)) {
        errors.push(`Fase ${stage.id} possui parâmetros de campanha inválidos.`);
      }
      if (!stage.questionCategories?.length || !stage.questionLimits || !stage.completion || !stage.rewards) {
        errors.push(`Fase ${stage.id} não possui parâmetros completos de campanha.`);
      }
      validateStageQuestions(stage, errors);
      if (index > 0 && stage.obstacleIntervalMs >= planet.stages[index - 1].obstacleIntervalMs) {
        errors.push(`A frequência de obstáculos não aumenta em ${stage.id}.`);
      }
    }
    if (!PLANTS.some((plant) => plant.id === planet.plantId)) {
      errors.push(`Planeta ${planet.id} aponta para planta inexistente.`);
    }
    const plant = PLANTS.find((entry) => entry.id === planet.plantId);
    if (plant && (plant.planetId !== planet.id || plant.growthStages?.length !== 5 || !plant.palette || !(plant.moneyReward >= 0))) {
      errors.push(`Planta ${plant.id} possui dados de resgate ou crescimento inválidos.`);
    }
    for (const obstacleId of planet.obstacleIds) {
      if (!OBSTACLES.some((obstacle) => obstacle.id === obstacleId)) errors.push(`Obstáculo ${obstacleId} não existe (${planet.id}).`);
    }
  }

  if (PLANETS.reduce((total, planet) => total + planet.stages.length, 0) !== 20) {
    errors.push("A campanha deve possuir exatamente vinte fases.");
  }
  const stageIds = new Set(PLANETS.flatMap((planet) => planet.stages.map((stage) => stage.id)));
  for (const stageId of Object.keys(QUESTION_BANK)) {
    if (!stageIds.has(stageId)) errors.push(`Banco de perguntas contém fase desconhecida: ${stageId}.`);
  }

  if (!COLLECTIBLES.length) errors.push("Itens coletáveis não configurados.");
  return errors;
}
