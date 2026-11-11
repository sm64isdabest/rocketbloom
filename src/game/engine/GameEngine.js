import { COLLECTIBLES } from "../data/items.js";
import { getQuestionsForStage, pickQuestion } from "../data/questions.js";
import { SPEED, SCORE, SPAWN, QUESTION_TIMING, MYSTERY_BOX, POWER_UPS } from "../config/gameConfig.js";
import { Answer } from "../entities/Answer.js";
import { AnswerLaser } from "../entities/AnswerLaser.js";
import { Collectible } from "../entities/Collectible.js";
import { MysteryBox } from "../entities/MysteryBox.js";
import { Obstacle } from "../entities/Obstacle.js";
import { Rocket } from "../entities/Rocket.js";
import { cullOffscreen } from "../systems/spawn.js";
import { completeAnswerRound, createAnswerRound, resolveAnswerRound } from "../systems/answerRound.js";
import { getLaneBounds, getLaneFromCenter, LANE_COLORS, renderLaneColumns } from "../systems/lanes.js";
import { sampleInterQuestionDelayMs } from "../systems/questionTiming.js";
import { aabbOverlaps } from "./collision.js";
import { createSpeedStreaks, createStarfield, renderSpeedStreaks, renderStarfield, updateSpeedStreaks, updateStarfield } from "../systems/stars.js";
import { renderPlanetBackground, renderPlanetScenery } from "../systems/scenery.js";
import { createInputController } from "./input.js";
import { createGameLoop } from "./loop.js";
import { fitCanvasToContainer } from "./resize.js";
import { finishGameAudio, pauseGameAudio, playGameSound, startGameAudio } from "../audio/audioManager.js";
import { activatePowerUp, createPowerUpState, getNextMysteryBoxDelay, getRandomPowerUp, tickPowerUps } from "../systems/powerUps.js";

function makeRunId() {
  return globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class GameEngine {
  constructor({ canvas, session, controlMode = "pointer", reducedMotion = false, showHitboxes = false, onHud, onPauseRequest, onOutcome, rng = Math.random, runId = makeRunId(), explosionImage }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.session = session;
    this.reducedMotion = reducedMotion;
    this.showHitboxes = showHitboxes;
    this.onHud = onHud;
    this.onPauseRequest = onPauseRequest;
    this.onOutcome = onOutcome;
    this.rng = rng;
    this.visualRandomState = 0x5eed1234;
    this.visualRng = () => {
      this.visualRandomState = (Math.imul(this.visualRandomState, 1_664_525) + 1_013_904_223) >>> 0;
      return this.visualRandomState / 0x1_0000_0000;
    };
    this.runId = runId;

    this.view = { width: 0, height: 0, dpr: 1 };
    this.rocket = new Rocket();
    this.explosionImage = explosionImage ?? this.createExplosionImage();
    this.outcome = null;
    this.stars = [];
    this.speedStreaks = [];
    this.leaves = [];
    this.answers = [];
    this.answerLasers = [];
    this.obstacles = [];
    this.collectibles = [];
    this.mysteryBox = null;
    this.mysteryBoxAcc = 0;
    this.mysteryBoxDelayMs = getNextMysteryBoxDelay(this.rng);
    this.powerUps = createPowerUpState();
    this.turboSpeedFactor = 1;
    this.pendingPowerUp = null;
    this.hazardClearRemainingMs = 0;
    this.shrinkFlashRemainingMs = 0;
    this.particles = [];
    this.entitySequence = 0;
    this.speed = SPEED.start;
    this.stageDurationMs = session.stage.durationMs;
    this.godmode = false;
    this.backgroundOffsetY = 0;
    this.elapsedMs = 0;
    this.progressMs = 0;
    this.coins = 0;
    this.diamonds = 0;
    this.score = 0;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
    this.paused = false;
    this.ended = false;
    this.pendingOutcome = null;
    this.disposed = false;
    this.hudAcc = 0;
    this.obstacleAcc = 0;
    this.collectibleAcc = 0;
    this.interQuestionRemainingMs = 0;
    this.roundNumber = 0;
    this.lastQuestionId = null;
    this.answerChoiceRemainingMs = QUESTION_TIMING.choiceWindowMs;
    this.answerAnimationElapsedMs = 0;
    this.answerFeedbackRemainingMs = 0;
    this.columnFlashLane = -1;
    this.columnFlashColor = null;
    this.columnFlashRemainingMs = 0;
    this.currentRound = null;
    this.questionFeedback = "";
    this.feedbackTimerMs = 0;

    this.input = createInputController(canvas, controlMode);
    this.loop = createGameLoop((dt) => this.tick(dt));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !this.paused && !this.ended) {
        this.pause();
        this.onPauseRequest?.();
      }
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.resize();
    this.startNextQuestion();
  }

  createExplosionImage() {
    if (typeof Image === "undefined") return null;
    const image = new Image();
    const basePath = import.meta.env?.BASE_URL ?? "/";
    image.src = `${basePath.endsWith("/") ? basePath : `${basePath}/`}assets/explosion.png`;
    return image;
  }

  resize() {
    this.view = fitCanvasToContainer(this.canvas);
    if (!this.rocket.x && !this.rocket.y) {
      this.rocket.place(this.view.width, this.view.height);
    } else {
      this.rocket.y = this.view.height - Math.min(96, this.view.height * 0.13) - this.rocket.height;
      this.rocket.clamp(this.view.width);
    }
    this.stars = createStarfield(70, this.view.width, this.view.height, this.session.planet.theme.starAlpha, this.rng);
    this.speedStreaks = createSpeedStreaks(54, this.view.width, this.view.height, this.rng);
    for (const answer of this.answers) {
      const lane = answer.lane ?? 1.5;
      answer.x = clamp(this.view.width * ((lane + 0.5) / 4) - answer.width / 2, 0, this.view.width - answer.width);
    }
    for (const laser of this.answerLasers) {
      const { left, width } = getLaneBounds(this.view.width, laser.lane);
      laser.x = left + 6;
      laser.width = Math.max(20, width - 12);
    }
    const fallingEntities = [...this.obstacles, ...this.collectibles];
    if (this.mysteryBox) fallingEntities.push(this.mysteryBox);
    for (const entity of fallingEntities) {
      entity.x = clamp(entity.x, 0, this.view.width - entity.width);
    }
    if (!this.disposed) this.render();
  }

  start() {
    if (this.ended || this.disposed) return;
    this.paused = false;
    this.input.setEnabled(true);
    startGameAudio();
    this.render();
    this.loop.start();
    this.emitHud(true);
  }

  pause() {
    if (this.ended || this.disposed || this.paused) return;
    this.paused = true;
    this.input.setEnabled(false);
    pauseGameAudio();
    this.loop.stop();
    this.emitHud(true);
  }

  resume() {
    if (this.ended || this.disposed || !this.paused) return;
    this.paused = false;
    this.input.setEnabled(true);
    startGameAudio();
    this.loop.start();
  }

  setControlMode(controlMode) {
    this.input.setControlMode(controlMode);
  }

  setDebugSpeed(speed) {
    if (!Number.isFinite(speed)) return;
    this.speed = clamp(speed, SPEED.min, SPEED.max);
    this.emitHud(true);
  }

  setDebugGodmode(enabled) {
    this.godmode = Boolean(enabled);
    this.emitHud(true);
  }

  setDebugDuration(durationMs) {
    if (durationMs === 0 || durationMs === Infinity) this.stageDurationMs = Infinity;
    else if (Number.isFinite(durationMs) && durationMs > 0) this.stageDurationMs = durationMs;
    else return;
    this.emitHud(true);
  }

  grantDebugPowerUp(power) {
    if (!Object.hasOwn(POWER_UPS, power)) throw new Error("Poder de debug inválido.");
    if (power === "shrink") {
      for (const obstacle of this.obstacles) obstacle.startShrink(POWER_UPS.shrink.shrinkMs);
      this.hazardClearRemainingMs = POWER_UPS.shrink.durationMs;
      this.shrinkFlashRemainingMs = 180;
    } else {
      this.powerUps = activatePowerUp(this.powerUps, power);
    }
    this.questionFeedback = ({ turbo: "TURBO!", star: "ESTRELA! Invencível", bubble: "Bolha ativada", shrink: "Raio encolhedor!" })[power];
    this.feedbackTimerMs = 1200;
    this.emitHud(true);
  }

  stop() {
    if (this.disposed) return;
    this.disposed = true;
    pauseGameAudio();
    this.loop.stop();
    this.input.destroy();
    this.resizeObserver.disconnect();
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  startNextQuestion() {
    if (this.ended || this.disposed) return;
    if (this.currentRound && this.currentRound.status !== "waiting-next-question") return;
    if (this.currentRound && this.interQuestionRemainingMs > 0) return;
    this.rocket.clearDamageFeedback();
    this.roundNumber += 1;
    const questions = this.session.questions ?? getQuestionsForStage(this.session.stage.id);
    const question = pickQuestion(questions, {
      previousId: this.lastQuestionId,
      rng: this.rng,
    });
    if (!question) {
      throw new Error(`Nenhuma pergunta disponível para a fase ${this.session.stage.id}.`);
    }
    this.lastQuestionId = question.id;
    this.currentRound = createAnswerRound(question, {
      width: this.view.width,
      id: `${this.runId}-round-${this.roundNumber}`,
      rng: this.rng,
      fallSpeed: this.getEntitySpeed(SPAWN.answerFallSpeed),
    });
    this.answers = this.currentRound.answers;
    this.answerLasers = this.answers.map((answer) => {
      const { left, width } = getLaneBounds(this.view.width, answer.lane);
      return new AnswerLaser({
        lane: answer.lane,
        x: left + 6,
        y: answer.y + answer.height + 12,
        width: Math.max(20, width - 12),
        color: LANE_COLORS[answer.lane],
        speed: 90,
      });
    });
    this.answerChoiceRemainingMs = QUESTION_TIMING.choiceWindowMs;
    this.answerAnimationElapsedMs = 0;
    this.answerFeedbackRemainingMs = 0;
    this.interQuestionRemainingMs = 0;
    this.columnFlashLane = -1;
    this.columnFlashColor = null;
    this.columnFlashRemainingMs = 0;
    this.questionFeedback = "";
    this.feedbackTimerMs = 0;
  }

  tick(dt) {
    if (this.ended || this.disposed || this.paused) return;
    if (this.input.wantsPause()) {
      this.input.consumePause();
      this.onPauseRequest?.();
      return;
    }

    const frameSeconds = clamp(dt, 0, 0.05);
    if (!frameSeconds) return;
    const frameMs = frameSeconds * 1000;
    this.elapsedMs += frameMs;
    // Os temporizadores avançam somente dentro do loop ativo; em pausa, tick retorna acima.
    const rouletteWasActive = this.powerUps.rouletteMs > 0;
    this.powerUps = tickPowerUps(this.powerUps, frameMs);
    const turboTarget = this.powerUps.turboMs > 0 ? POWER_UPS.turbo.speedMultiplier : 1;
    this.turboSpeedFactor += (turboTarget - this.turboSpeedFactor) * (1 - Math.exp(-frameSeconds / 0.45));
    this.hazardClearRemainingMs = Math.max(0, this.hazardClearRemainingMs - frameMs);
    this.shrinkFlashRemainingMs = Math.max(0, this.shrinkFlashRemainingMs - frameMs);
    if (rouletteWasActive && this.powerUps.rouletteMs <= 0) this.revealPendingPowerUp();
    if (this.pendingOutcome) {
      this.rocket.updateDamageFeedback(frameSeconds);
      this.updateParticles(frameSeconds);
      this.presentPendingOutcome();
      return;
    }
    this.input.apply(this.rocket, this.canvas, frameSeconds);
    this.rocket.clamp(this.view.width);
    this.rocket.update(frameSeconds);
    this.rocket.updateDamageFeedback(frameSeconds);

    const progressMultiplier = clamp(
      this.speed / SPEED.start,
      SPEED.minProgressMultiplier,
      SPEED.maxProgressMultiplier,
    );
    this.progressMs += frameMs * progressMultiplier * this.turboSpeedFactor;
    const backgroundScrollSpeed = 90 * progressMultiplier * this.turboSpeedFactor;
    this.backgroundOffsetY -= backgroundScrollSpeed * frameSeconds;
    updateStarfield(this.stars, frameSeconds, this.view.width, this.view.height,
      (0.35 + progressMultiplier * 0.58) * this.turboSpeedFactor, this.visualRng);
    if (!this.reducedMotion) {
      updateSpeedStreaks(this.speedStreaks, frameSeconds, this.view.width, this.view.height,
        this.speed * this.turboSpeedFactor, this.visualRng);
    }

    this.updateQuestions(frameSeconds, frameMs);
    if (this.ended) return;
    if (this.pendingOutcome) {
      this.updateParticles(frameSeconds);
      this.presentPendingOutcome();
      return;
    }
    this.updatePickupsAndHazards(frameSeconds, frameMs);
    if (this.ended) return;
    if (this.pendingOutcome) {
      this.presentPendingOutcome();
      return;
    }

    if (!this.godmode && this.speed <= SPEED.defeatAtOrBelow && !this.isQuestionResolving()) {
      this.pendingOutcome = "defeat";
      this.presentPendingOutcome();
      return;
    }
    if (Number.isFinite(this.stageDurationMs) && this.progressMs >= this.stageDurationMs && !this.isQuestionResolving()) {
      this.progressMs = this.stageDurationMs;
      this.finish("victory");
      return;
    }

    this.render();
    this.hudAcc += frameSeconds;
    if (this.hudAcc >= 0.2) {
      this.hudAcc = 0;
      this.emitHud();
    }
  }

  updateQuestions(dt, frameMs) {
    if (!this.currentRound) return;
    if (this.currentRound.status === "awaiting-resolution") {
      for (const laser of this.answerLasers) {
        if (!laser.alive) continue;
        laser.update(dt);
        const answer = this.currentRound.answers.find((candidate) => candidate.lane === laser.lane);
        if (answer) {
          answer.x = laser.x + (laser.width - answer.width) / 2;
          answer.y = laser.y - answer.height - 8;
        }
        if (aabbOverlaps(this.rocket, laser)) {
          const selected = answer;
          laser.alive = false;
          this.spawnParticles(
            this.rocket.x + this.rocket.width / 2,
            this.rocket.y + this.rocket.height / 2,
            laser.color,
            18,
          );
          this.resolveCurrentAnswer(selected);
          return;
        }
      }
      this.answerChoiceRemainingMs -= frameMs;
      if (this.answerChoiceRemainingMs <= 0) {
        const lane = getLaneFromCenter(this.rocket.x + this.rocket.width / 2, this.view.width);
        const selected = this.currentRound.answers.find((answer) => answer.lane === lane);
        this.resolveCurrentAnswer(selected);
      }
      return;
    }

    if (this.currentRound.status === "animating-correct") {
      this.answerAnimationElapsedMs += frameMs;
      if (this.answerAnimationElapsedMs >= QUESTION_TIMING.perspectiveAnimationMs) {
        this.currentRound.status = "feedback";
        this.answerFeedbackRemainingMs = QUESTION_TIMING.resolutionFeedbackMs;
        this.columnFlashLane = this.currentRound.result.lane;
        this.columnFlashColor = "#00FF00";
        this.columnFlashRemainingMs = QUESTION_TIMING.resolutionFeedbackMs;
        this.speed = clamp(this.speed + SPEED.correctAnswerBonus, SPEED.min, SPEED.max);
        this.questionFeedback = "Resposta correta!";
        playGameSound("correct");
      }
      return;
    }

    if (this.currentRound.status === "animating-incorrect") {
      this.answerFeedbackRemainingMs -= frameMs;
      this.columnFlashRemainingMs = Math.max(0, this.answerFeedbackRemainingMs);
      if (this.answerFeedbackRemainingMs <= 0) this.finishAnswerFeedback();
      return;
    }

    if (this.currentRound.status === "feedback") {
      this.answerFeedbackRemainingMs -= frameMs;
      this.columnFlashRemainingMs = Math.max(0, this.answerFeedbackRemainingMs);
      if (this.answerFeedbackRemainingMs <= 0) this.finishAnswerFeedback();
      return;
    }

    if (this.currentRound.status === "waiting-next-question") {
      this.interQuestionRemainingMs -= frameMs;
      if (this.interQuestionRemainingMs <= 0) this.startNextQuestion();
    }
  }

  isQuestionResolving() {
    return ["animating-correct", "animating-incorrect", "feedback"].includes(this.currentRound?.status);
  }

  finishAnswerFeedback() {
    if (!completeAnswerRound(this.currentRound)) return;
    this.answers = [];
    this.answerLasers = [];
    this.columnFlashRemainingMs = 0;
    this.interQuestionRemainingMs = sampleInterQuestionDelayMs(this.rng);
    this.questionFeedback = "";
    if (!this.godmode && this.speed <= SPEED.defeatAtOrBelow) this.pendingOutcome = "defeat";
  }

  presentPendingOutcome() {
    this.render();
    if (this.rocket.damageFeedbackRemainingMs <= 0) {
      const outcome = this.pendingOutcome;
      this.pendingOutcome = null;
      this.finish(outcome);
    }
  }

  resolveCurrentAnswer(answer) {
    const result = resolveAnswerRound(this.currentRound, answer);
    if (!result) return false;
    if (result.correct) {
      this.correctAnswers += 1;
      this.score += SCORE.correctAnswer;
      this.answerAnimationElapsedMs = 0;
      this.questionFeedback = "";
    } else {
      this.incorrectAnswers += 1;
      const bubbleAbsorbs = this.powerUps.starMs <= 0 && this.powerUps.bubble;
      const protectedByPower = this.protectFromPenalty("question");
      if (!protectedByPower) {
        this.rocket.triggerDamageFeedback();
        this.score = Math.max(0, this.score + SCORE.incorrectAnswer);
        this.speed = clamp(this.speed - SPEED.wrongAnswerPenalty * (this.session.stage.speedLossMultiplier ?? 1), SPEED.min, SPEED.max);
      }
      this.answerFeedbackRemainingMs = QUESTION_TIMING.resolutionFeedbackMs;
      this.columnFlashLane = result.lane;
      this.columnFlashColor = protectedByPower ? "#83f4ff" : "#FF3030";
      this.columnFlashRemainingMs = QUESTION_TIMING.resolutionFeedbackMs;
      this.questionFeedback = protectedByPower
        ? (bubbleAbsorbs ? "Bolha estourou e absorveu a penalidade" : "Protegido pelo poder")
        : (result.unanswered ? "Alternativas perdidas" : "Resposta incorreta");
      playGameSound(protectedByPower ? "discovery" : "incorrect");
    }
    this.emitHud(true);
    return true;
  }

  updatePickupsAndHazards(dt, frameMs) {
    const stageProgress = Number.isFinite(this.stageDurationMs) ? clamp(this.progressMs / this.stageDurationMs, 0, 1) : 0;
    const spawnRate = this.session.difficulty.spawnRateMultiplier;
    const baseInterval = this.session.stage.obstacleIntervalMs ?? SPAWN.obstacleIntervalMs / spawnRate;
    const minInterval = this.session.stage.obstacleMinIntervalMs ?? SPAWN.obstacleMinIntervalMs;
    const interval = Math.max(minInterval,
      baseInterval * (1 - stageProgress * SPAWN.obstacleDifficultyIntervalFactor));
    this.obstacleAcc += frameMs;
    this.collectibleAcc += frameMs;
    const maxActiveObstacles = this.session.stage.maxActiveObstacles ?? 4;
    const activeObstacles = this.obstacles.filter((obstacle) => obstacle.alive).length;
    if (this.session.obstacles.length && this.hazardClearRemainingMs <= 0 && activeObstacles < maxActiveObstacles && this.obstacleAcc >= interval) {
      this.obstacleAcc = 0;
      this.spawnObstacle();
      if (stageProgress >= SPAWN.obstaclePairAfterProgress
        && this.rng() < (stageProgress - SPAWN.obstaclePairAfterProgress) * 0.45
        && this.obstacles.filter((obstacle) => obstacle.alive).length < maxActiveObstacles) this.spawnObstacle();
    }
    if (this.collectibleAcc >= SPAWN.collectibleIntervalMs / spawnRate) {
      this.collectibleAcc = 0;
      this.spawnCollectible();
    }

    this.mysteryBoxAcc += frameMs;
    if (!this.mysteryBox && this.mysteryBoxAcc >= this.mysteryBoxDelayMs) {
      if (this.spawnMysteryBox()) {
        this.mysteryBoxAcc = 0;
        this.mysteryBoxDelayMs = getNextMysteryBoxDelay(this.rng);
      }
    }

    for (const obstacle of this.obstacles) {
      if (!obstacle.alive) continue;
      const stageProgress = Number.isFinite(this.stageDurationMs) ? clamp(this.progressMs / this.stageDurationMs, 0, 1) : 0;
      obstacle.speed = this.getEntitySpeed(SPAWN.obstacleFallSpeed)
        * (this.session.stage.speedMultiplier ?? this.session.difficulty.speedMultiplier ?? 1)
        * (this.session.stage.obstacleSpeedMultiplier ?? 1)
        * (1 + stageProgress * SPAWN.obstacleDifficultySpeedFactor);
      obstacle.update(dt);
      if (obstacle.isDamaging && aabbOverlaps(this.rocket, obstacle.collisionBox)) {
        obstacle.alive = false;
        const protectedByPower = this.protectFromPenalty("obstacle");
        if (!protectedByPower) {
          this.rocket.triggerDamageFeedback();
          this.speed = clamp(this.speed - SPEED.obstaclePenalty
            * (this.session.stage.speedLossMultiplier ?? 1)
            * (this.session.stage.obstaclePenaltyMultiplier ?? 1), SPEED.min, SPEED.max);
          this.questionFeedback = "Impacto! Velocidade reduzida";
          this.feedbackTimerMs = 900;
          playGameSound("collision");
          this.spawnParticles(this.rocket.x + this.rocket.width / 2, this.rocket.y + this.rocket.height / 2, "#ff653c", 24);
        }
        this.emitHud(true);
      }
    }
    for (const collectible of this.collectibles) {
      if (!collectible.alive) continue;
      collectible.speed = this.getEntitySpeed(SPAWN.collectibleFallSpeed);
      collectible.update(dt);
      if (aabbOverlaps(this.rocket, collectible)) {
        collectible.alive = false;
        if (collectible.kind === "diamond") this.diamonds += 1;
        else this.coins += 1;
        playGameSound(collectible.kind === "diamond" ? "diamond" : "coin");
        this.questionFeedback = collectible.kind === "diamond" ? "Diamante coletado +1" : "Moeda coletada +1";
        this.feedbackTimerMs = 700;
        this.spawnParticles(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2,
          collectible.kind === "diamond" ? "#7ad4ff" : "#f6ce62", 8);
        this.emitHud(true);
      }
    }

    if (this.mysteryBox?.alive) {
      this.mysteryBox.speed = this.getEntitySpeed(MYSTERY_BOX.fallSpeed);
      this.mysteryBox.update(dt);
      if (this.mysteryBox.y > this.view.height + this.mysteryBox.height) {
        this.mysteryBox.alive = false;
        this.mysteryBox = null;
      } else if (aabbOverlaps(this.rocket, this.mysteryBox)) {
        const { x, y, width, height } = this.mysteryBox;
        this.mysteryBox.alive = false;
        this.mysteryBox = null;
        this.spawnParticles(x + width / 2, y + height / 2, "#ffe45e", 22);
        playGameSound("discovery");
        this.pendingPowerUp = getRandomPowerUp(this.rng);
        this.powerUps = { ...this.powerUps, rouletteMs: MYSTERY_BOX.rouletteMs, rouletteElapsedMs: 0 };
        this.emitHud(true);
      }
    }

    this.obstacles = cullOffscreen(this.obstacles, this.view.height);
    this.collectibles = cullOffscreen(this.collectibles, this.view.height);
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.alive);
    this.updateParticles(dt);
    if (this.feedbackTimerMs > 0) {
      this.feedbackTimerMs -= frameMs;
      if (this.feedbackTimerMs <= 0) this.questionFeedback = "";
    }
    if (!this.godmode && this.speed <= SPEED.defeatAtOrBelow && !this.isQuestionResolving()) this.pendingOutcome = "defeat";
  }

  getEntitySpeed(baseSpeed) {
    const factor = clamp(this.speed / SPEED.start, 0.65, 1.8);
    return baseSpeed * factor * this.turboSpeedFactor;
  }

  spawnMysteryBox() {
    // Tenta posições afastadas da nave e dos obstáculos que ocupam o topo da fase.
    const maxX = Math.max(0, this.view.width - MYSTERY_BOX.size);
    const candidates = Array.from({ length: 9 }, (_, index) => maxX * index / 8);
    const safe = candidates.filter((x) => Math.abs(x + MYSTERY_BOX.size / 2 - (this.rocket.x + this.rocket.width / 2)) >= MYSTERY_BOX.safeDistance
      && this.obstacles.every((obstacle) => !obstacle.alive || obstacle.y >= MYSTERY_BOX.size + SPAWN.obstacleSafeGap
        || x + MYSTERY_BOX.size + SPAWN.obstacleSafeGap <= obstacle.x
        || obstacle.x + obstacle.width + SPAWN.obstacleSafeGap <= x));
    if (!safe.length) return false;
    const x = safe[Math.floor(this.rng() * safe.length)];
    this.mysteryBox = new MysteryBox({ x, speed: this.getEntitySpeed(MYSTERY_BOX.fallSpeed) });
    return true;
  }

  protectFromPenalty(source) {
    // A estrela sempre protege primeiro; a bolha só é consumida se a estrela estiver inativa.
    if (this.godmode) return true;
    if (this.powerUps.starMs > 0) return true;
    if (!this.powerUps.bubble) return false;
    this.powerUps = activatePowerUp(this.powerUps, "consume-bubble");
    this.spawnParticles(this.rocket.x + this.rocket.width / 2, this.rocket.y + this.rocket.height / 2, "#8cecff", 20);
    this.questionFeedback = source === "question" ? "Bolha estourou e absorveu a penalidade" : "Bolha estourou e protegeu a nave";
    this.feedbackTimerMs = 900;
    playGameSound("discovery");
    this.emitHud(true);
    return true;
  }

  revealPendingPowerUp() {
    const power = this.pendingPowerUp;
    this.pendingPowerUp = null;
    if (!power) return;
    if (power === "shrink") {
      for (const obstacle of this.obstacles) obstacle.startShrink(POWER_UPS.shrink.shrinkMs);
      this.hazardClearRemainingMs = POWER_UPS.shrink.durationMs;
      this.shrinkFlashRemainingMs = 180;
    } else {
      this.powerUps = activatePowerUp(this.powerUps, power);
    }
    this.questionFeedback = ({ turbo: "TURBO!", star: "ESTRELA! Invencível", bubble: "Bolha ativada" })[power] ?? "Raio encolhedor!";
    this.feedbackTimerMs = 1200;
    playGameSound("discovery");
    this.emitHud(true);
  }

  spawnObstacle() {
    const catalog = this.session.obstacles;
    const obstacle = catalog[Math.floor(this.rng() * catalog.length)];
    const maxX = Math.max(0, this.view.width - obstacle.width);
    const candidates = Array.from({ length: 7 }, (_, index) => maxX * index / 6);
    const safe = candidates.filter((x) => Math.abs(x + obstacle.width / 2 - (this.rocket.x + this.rocket.width / 2)) >= SPAWN.obstacleMinLaneDistance
      && this.obstacles.every((active) => !active.alive || active.y > obstacle.height + SPAWN.obstacleSafeGap
        || Math.abs(x - active.x) >= (obstacle.width + active.width) / 2 + SPAWN.obstacleSafeGap));
    const pool = safe.length ? safe : candidates;
    const x = pool[Math.floor(this.rng() * pool.length)];
    const stageProgress = Number.isFinite(this.stageDurationMs) ? clamp(this.progressMs / this.stageDurationMs, 0, 1) : 0;
    const speed = this.getEntitySpeed(SPAWN.obstacleFallSpeed)
      * (this.session.stage.speedMultiplier ?? this.session.difficulty.speedMultiplier ?? 1)
      * (this.session.stage.obstacleSpeedMultiplier ?? 1)
      * (1 + stageProgress * SPAWN.obstacleDifficultySpeedFactor);
    const movementTypes = ["straight", "diagonal", "zigzag", "curve", "drift"];
    const movementType = movementTypes[Math.floor(this.rng() * movementTypes.length)];
    const movement = {
      type: movementType,
      direction: this.rng() < 0.5 ? -1 : 1,
      amplitude: Math.min(68, maxX * 0.22),
      frequency: movementType === "zigzag" ? 3.2 + this.rng() * 1.8 : 0.9 + this.rng() * 0.7,
      phase: this.rng() * Math.PI * 2,
    };
    this.obstacles.push(new Obstacle({ ...obstacle, x, y: -obstacle.height, speed, movement, viewWidth: this.view.width }));
  }

  spawnCollectible() {
    const descriptor = COLLECTIBLES[Math.floor(this.rng() * COLLECTIBLES.length)];
    const x = this.rng() * Math.max(0, this.view.width - descriptor.width);
    this.collectibles.push(new Collectible({
      ...descriptor,
      pickupId: `${this.runId}-pickup-${++this.entitySequence}`,
      x,
      y: -descriptor.height,
      speed: SPAWN.collectibleFallSpeed,
    }));
  }

  spawnParticles(x, y, color, count, rng = this.rng) {
    if (this.reducedMotion) return;
    const available = Math.max(0, SPAWN.maxParticles - this.particles.length);
    for (let i = 0; i < Math.min(count, available); i += 1) {
      const angle = Math.PI * 2 * i / count + rng() * 0.4;
      const speed = 35 + rng() * 95;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.42 + rng() * 0.22, maxLife: 0.64, size: 2 + rng() * 3, color });
    }
  }

  updateParticles(dt) {
    let retained = 0;
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life > 0) {
        this.particles[retained] = particle;
        retained += 1;
      }
    }
    this.particles.length = retained;
  }

  finish(outcome) {
    if (this.ended || this.disposed) return;
    this.ended = true;
    this.outcome = outcome;
    this.paused = false;
    this.pendingOutcome = null;
    finishGameAudio(outcome);
    this.loop.stop();
    this.answers = [];
    this.particles = [];
    this.mysteryBox = null;
    this.pendingPowerUp = null;
    this.powerUps = createPowerUpState();
    this.turboSpeedFactor = 1;
    this.hazardClearRemainingMs = 0;
    this.shrinkFlashRemainingMs = 0;
    this.currentRound && (this.currentRound.status = "resolved");
    this.interQuestionRemainingMs = 0;
    this.answerChoiceRemainingMs = 0;
    this.render();
    this.onOutcome?.(outcome, this.getSnapshot());
  }

  emitHud(force = false) {
    this.onHud?.(this.getSnapshot(), force);
  }

  getSnapshot() {
    return {
      runId: this.runId,
      speed: Math.round(this.speed),
      coins: this.coins,
      diamonds: this.diamonds,
      score: this.score,
      correctAnswers: this.correctAnswers,
      incorrectAnswers: this.incorrectAnswers,
      elapsedMs: this.elapsedMs,
      progressMs: this.progressMs,
      stageProgress: Number.isFinite(this.stageDurationMs) ? clamp(this.progressMs / this.stageDurationMs, 0, 1) : 0,
      stageDurationMs: this.stageDurationMs,
      godmode: this.godmode,
      planetId: this.session.planet.id,
      stageId: this.session.stage.id,
      question: this.currentRound?.status === "waiting-next-question" ? null : this.currentRound?.question ?? null,
      answerState: this.currentRound?.status ?? "preparing",
      selectedLane: this.currentRound?.result?.lane ?? getLaneFromCenter(this.rocket.x + this.rocket.width / 2, this.view.width),
      feedback: this.questionFeedback,
      paused: this.paused,
      powerUps: [
        ...(this.powerUps.turboMs > 0 ? [{ id: "turbo", icon: "⚡", label: "Turbo", remainingMs: this.powerUps.turboMs, durationMs: POWER_UPS.turbo.durationMs }] : []),
        ...(this.powerUps.starMs > 0 ? [{ id: "star", icon: "★", label: "Estrela", remainingMs: this.powerUps.starMs, durationMs: POWER_UPS.star.durationMs }] : []),
        ...(this.powerUps.bubble ? [{ id: "bubble", icon: "●", label: "Bolha" }] : []),
        ...(this.hazardClearRemainingMs > 0 ? [{ id: "shrink", icon: "✦", label: "Raio encolhedor", remainingMs: this.hazardClearRemainingMs, durationMs: POWER_UPS.shrink.durationMs }] : []),
      ],
      mysteryBoxVisible: Boolean(this.mysteryBox?.alive),
      rouletteIcon: this.powerUps.rouletteMs > 0 ? ["⚡", "★", "●", "✦"][Math.floor(this.elapsedMs / 90) % 4] : null,
    };
  }

  render() {
    const { ctx, view, session } = this;
    if (!ctx || view.width <= 0 || view.height <= 0) return;
    const gradient = ctx.createLinearGradient(0, 0, 0, view.height);
    gradient.addColorStop(0, session.planet.theme.skyTop);
    gradient.addColorStop(1, session.planet.theme.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, view.width, view.height);

    const horizontalOffset = (view.width / 2 - (this.rocket.x + this.rocket.width / 2)) * 0.22;
    if (!renderPlanetBackground(ctx, view, session.planet, { offsetX: horizontalOffset, offsetY: this.backgroundOffsetY })) {
      renderStarfield(ctx, this.stars);
      renderPlanetScenery(ctx, view, session.planet, this.progressMs);
    }
    if (!this.reducedMotion) {
      renderSpeedStreaks(ctx, this.speedStreaks, session.planet.theme.accent, this.speed * this.turboSpeedFactor);
    }
    const flashAlpha = this.columnFlashRemainingMs > 0
      ? 0.3 + Math.max(0, Math.sin(this.elapsedMs * 0.025)) * 0.15
      : 0;
    renderLaneColumns(ctx, view.width, view.height, {
      visible: this.currentRound?.status === "awaiting-resolution",
      flashLane: this.columnFlashLane,
      flashColor: this.columnFlashColor,
      flashAlpha,
    });
    for (const obstacle of this.obstacles) obstacle.render(ctx);
    for (const collectible of this.collectibles) collectible.render(ctx);
    if (this.mysteryBox?.alive) this.mysteryBox.render(ctx);
    if (this.currentRound?.status === "animating-correct") {
      this.currentRound.selectedAnswer?.renderPerspective(ctx, this.answerAnimationElapsedMs / QUESTION_TIMING.perspectiveAnimationMs, view.height);
    } else if (this.currentRound?.status === "awaiting-resolution") {
      for (const answer of this.answers) if (answer.alive) answer.render(ctx);
      for (const laser of this.answerLasers) laser.render(ctx);
    }
    for (const particle of this.particles) {
      ctx.save(); ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1); ctx.fillStyle = particle.color;
      ctx.beginPath();
      if (particle.color === "#ffe66d") {
        for (let point = 0; point < 10; point += 1) {
          const radius = point % 2 ? particle.size * 0.42 : particle.size;
          const angle = -Math.PI / 2 + point * Math.PI / 5;
          const x = particle.x + Math.cos(angle) * radius;
          const y = particle.y + Math.sin(angle) * radius;
          if (point === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    this.renderPowerUpRocketEffects();
    if (this.outcome === "defeat") {
      if (this.explosionImage?.complete && this.explosionImage.naturalWidth > 0) {
        const size = Math.max(this.rocket.width, this.rocket.height) * 1.7;
        ctx.drawImage(this.explosionImage, this.rocket.x + (this.rocket.width - size) / 2, this.rocket.y + (this.rocket.height - size) / 2, size, size);
      }
    } else {
      this.rocket.render(ctx, this.elapsedMs, this.reducedMotion);
    }
    if (this.powerUps.bubble) {
      ctx.save();
      ctx.strokeStyle = "rgba(116, 226, 255, .78)";
      ctx.fillStyle = "rgba(116, 226, 255, .12)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#72e6ff";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(this.rocket.x + this.rocket.width / 2, this.rocket.y + this.rocket.height / 2,
        this.rocket.width * 0.72, this.rocket.height * 0.63, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (this.powerUps.rouletteMs > 0) this.renderPowerRoulette();
    if (this.shrinkFlashRemainingMs > 0) {
      ctx.save(); ctx.fillStyle = `rgba(205, 240, 255, ${this.shrinkFlashRemainingMs / 360})`;
      ctx.fillRect(0, 0, view.width, view.height); ctx.restore();
    }
    if (this.showHitboxes) {
      for (const obstacle of this.obstacles) {
        if (obstacle.alive) this.renderCollisionBox(obstacle.collisionBox, "#f97316");
      }
      for (const collectible of this.collectibles) {
        if (!collectible.alive) continue;
        this.renderCollisionBox(collectible, collectible.kind === "diamond" ? "#38bdf8" : "#facc15");
      }
      for (const laser of this.answerLasers) {
        if (laser.alive) this.renderCollisionBox(laser, laser.color);
      }
      this.renderCollisionBox(this.rocket, "#fb7185");
    }
  }

  renderCollisionBox(box, color) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.restore();
  }

  renderPowerUpRocketEffects() {
    const { ctx, rocket } = this;
    if (!ctx) return;
    if (this.powerUps.turboMs > 0 || this.turboSpeedFactor > 1.03) {
      ctx.save();
      const flicker = this.reducedMotion ? 1 : 0.8 + Math.sin(this.elapsedMs * 0.04) * 0.2;
      ctx.fillStyle = `rgba(255, 142, 48, ${flicker * Math.min(1, (this.turboSpeedFactor - 1) / (POWER_UPS.turbo.speedMultiplier - 1))})`;
      ctx.shadowColor = "#ff7c2a"; ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(rocket.x + rocket.width * 0.34, rocket.y + rocket.height * 0.76);
      ctx.lineTo(rocket.x + rocket.width * 0.5, rocket.y + rocket.height * 1.5);
      ctx.lineTo(rocket.x + rocket.width * 0.66, rocket.y + rocket.height * 0.76);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    if (this.powerUps.starMs > 0) {
      const fastBlink = this.powerUps.starMs <= POWER_UPS.star.warningMs;
      const blink = fastBlink && Math.floor(this.elapsedMs / 85) % 2 === 0;
      if (!blink) {
        ctx.save();
        ctx.strokeStyle = `hsl(${Math.floor(this.elapsedMs * 0.18) % 360} 100% 70%)`;
        ctx.lineWidth = 4; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2, rocket.width * 0.7, rocket.height * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke(); ctx.restore();
      }
      if (!this.reducedMotion && this.visualRng() < 0.2) {
        this.spawnParticles(rocket.x + this.visualRng() * rocket.width, rocket.y + this.visualRng() * rocket.height,
          "#ffe66d", 1, this.visualRng);
      }
    }
  }

  renderPowerRoulette() {
    const { ctx, view } = this;
    ctx.save();
    ctx.fillStyle = "rgba(5, 23, 54, .62)";
    ctx.fillRect(view.width * 0.25, view.height * 0.42, view.width * 0.5, 72);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(this.getSnapshot().rouletteIcon, view.width / 2, view.height * 0.42 + 36);
    ctx.restore();
  }

}
