import { pickObstacle } from "../data/obstacles.js";
import { COLLECTIBLES } from "../data/items.js";
import { getQuestionsForStage, pickQuestion } from "../data/questions.js";
import { SPEED, SCORE, ENDLESS, SPAWN, QUESTION_TIMING, MYSTERY_BOX, POWER_UPS, REWARDS } from "../config/gameConfig.js";
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
import { finishGameAudio, pauseGameAudio, playGameSound, playVictoryLaunchSound, startGameAudio } from "../audio/audioManager.js";
import { activatePowerUp, createPowerUpState, getFlightPowerUps, getNextMysteryBoxDelay, getRandomPowerUp, tickPowerUps } from "../systems/powerUps.js";
import { renderPowerUpIntro } from "../systems/powerUpPresentation.js";
import { createCollisionImpactState, getCollisionImpactSpeedFactor, tickCollisionImpact, triggerCollisionImpact } from "../systems/collisionImpact.js";
import { collectCoins } from "../systems/coinManager.js";

const VICTORY_LAUNCH = { chargeMs: 900, ascentMs: 1900, tailMs: 350 };
const VICTORY_ASCENT_END_MS = VICTORY_LAUNCH.chargeMs + VICTORY_LAUNCH.ascentMs;
const VICTORY_LAUNCH_DURATION_MS = VICTORY_ASCENT_END_MS + VICTORY_LAUNCH.tailMs;
const LOW_SPEED_ALERT_ENTER_KMH = 60;
const LOW_SPEED_ALERT_EXIT_KMH = 70;
const POWER_ART_SCALE = { turbo: 0.84, bubble: 0.86, magnet: 0.88, doubler: 0.82, freeze: 0.87 };

function makeRunId() {
  return globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class GameEngine {
  constructor({ canvas, backdrop, session, cosmetics, controlMode = "pointer", reducedMotion = false, showHitboxes = false, onHud, onPauseRequest, onOutcome, onVictoryLaunchComplete, rng = Math.random, runId = makeRunId(), explosionImage, bubbleImage, initialQuestionDelayMs = 3000 }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.backdrop = backdrop;
    this.backdropCtx = backdrop?.getContext("2d");
    this.backdropOutset = 0;
    this.session = session;
    this.endless = session.mode === "endless";
    this.reducedMotion = reducedMotion;
    this.showHitboxes = showHitboxes;
    this.onHud = onHud;
    this.onPauseRequest = onPauseRequest;
    this.onOutcome = onOutcome;
    this.onVictoryLaunchComplete = onVictoryLaunchComplete;
    this.rng = rng;
    this.visualRandomState = 0x5eed1234;
    this.visualRng = () => {
      this.visualRandomState = (Math.imul(this.visualRandomState, 1_664_525) + 1_013_904_223) >>> 0;
      return this.visualRandomState / 0x1_0000_0000;
    };
    this.runId = runId;

    this.view = { width: 0, height: 0, dpr: 1 };
    this.rocket = new Rocket({ cosmetics });
    this.explosionImage = explosionImage ?? this.createExplosionImage();
    this.bubbleImage = bubbleImage ?? this.createBubbleImage();
    this.powerUpImages = this.createPowerUpImages();
    this.powerUpReveal = null;
    this.outcome = null;
    this.victoryLaunchMs = null;
    this.victoryLaunchSpeed = null;
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
    this.particles = [];
    this.entitySequence = 0;
    this.speed = this.endless ? ENDLESS.speed : SPEED.start;
    this.lives = this.endless ? ENDLESS.lives : null;
    this.lowSpeedAlert = false;
    this.collisionImpact = createCollisionImpactState();
    this.collisionAlertRemainingMs = 0;
    this.collisionAlertSequence = 0;
    this.stageDurationMs = this.endless ? Infinity : session.stage.durationMs;
    this.godmode = false;
    this.backgroundOffsetY = 0;
    this.elapsedMs = 0;
    this.progressMs = 0;
    this.coins = 0;
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
    this.initialQuestionRemainingMs = Math.max(0, initialQuestionDelayMs);
    this.roundNumber = 0;
    this.lastQuestionId = null;
    this.answerChoiceRemainingMs = QUESTION_TIMING.choiceWindowMs;
    this.answerAnimationElapsedMs = 0;
    this.answerFeedbackRemainingMs = 0;
    this.columnFlashLane = -1;
    this.columnFlashColor = null;
    this.columnFlashRemainingMs = 0;
    this.currentRound = null;
    this.input = createInputController(canvas, controlMode, (x, y) => this.prepareAnswerSelection(x, y));
    this.loop = createGameLoop((dt, frameSeconds) => this.tick(dt, frameSeconds));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      if (this.victoryLaunchMs !== null && this.victoryLaunchMs < VICTORY_LAUNCH_DURATION_MS) {
        this.completeVictoryLaunch();
      } else if (!this.paused && !this.ended) {
        this.pause();
        this.onPauseRequest?.();
      }
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    if (backdrop) this.resizeObserver.observe(backdrop);
    this.resize();
    if (this.initialQuestionRemainingMs === 0) this.startNextQuestion();
  }

  createExplosionImage() {
    if (typeof Image === "undefined") return null;
    const image = new Image();
    const basePath = import.meta.env?.BASE_URL ?? "/";
    image.src = `${basePath.endsWith("/") ? basePath : `${basePath}/`}assets/explosion.webp`;
    return image;
  }

  createBubbleImage() {
    if (typeof Image === "undefined") return null;
    const image = new Image();
    const basePath = import.meta.env?.BASE_URL ?? "/";
    image.src = `${basePath.endsWith("/") ? basePath : `${basePath}/`}assets/powerups/bubble-shield.webp`;
    return image;
  }

  createPowerUpImages() {
    if (typeof Image === "undefined") return {};
    const basePath = import.meta.env?.BASE_URL ?? "/";
    const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
    return Object.fromEntries(Object.keys(POWER_UPS).map((power) => {
      const image = new Image();
      image.src = `${base}assets/powerups/${power}.webp`;
      return [power, image];
    }));
  }

  resize() {
    this.view = fitCanvasToContainer(this.canvas);
    this.resizeBackdrop();
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

  resizeBackdrop() {
    if (!this.backdropCtx) return;
    const { clientWidth, clientHeight } = this.backdrop;
    const { scale, width, height } = this.view;
    this.backdropOutset = Math.max(0, (clientWidth / scale - width) / 2);
    if (!this.backdropOutset) return;
    // The blurred scenery is rendered at half resolution and shares the stage's camera.
    this.backdrop.width = Math.ceil(clientWidth / 2);
    this.backdrop.height = Math.ceil(clientHeight / 2);
    const backdropScale = scale / 2;
    this.backdropCtx.setTransform(backdropScale, 0, 0, backdropScale,
      (this.backdrop.width - width * backdropScale) / 2,
      (this.backdrop.height - height * backdropScale) / 2);
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
    if (this.endless || !Number.isFinite(speed)) return;
    this.speed = clamp(speed, SPEED.min, SPEED.max);
    this.emitHud(true);
  }

  setDebugGodmode(enabled) {
    this.godmode = Boolean(enabled);
    this.emitHud(true);
  }

  setDebugDuration(durationMs) {
    if (this.endless) return;
    if (durationMs === 0 || durationMs === Infinity) this.stageDurationMs = Infinity;
    else if (Number.isFinite(durationMs) && durationMs > 0) this.stageDurationMs = durationMs;
    else return;
    this.emitHud(true);
  }

  grantDebugPowerUp(power) {
    if (!Object.hasOwn(POWER_UPS, power)) throw new Error("Poder de debug inválido.");
    this.receivePowerUp(power);
  }

  grantDebugCoins(amount) {
    if (this.ended || this.disposed) return;
    this.coins = collectCoins(this.coins, amount);
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
        y: 0,
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
  }

  tick(dt, presentationSeconds = dt) {
    if (this.disposed || this.paused) return;
    const frameSeconds = clamp(dt, 0, 0.05);
    if (this.ended) {
      if (this.victoryLaunchMs !== null && this.victoryLaunchMs < VICTORY_LAUNCH_DURATION_MS) {
        this.tickVictoryLaunch(Math.max(0, presentationSeconds));
      }
      return;
    }
    if (this.input.wantsPause()) {
      this.input.consumePause();
      this.onPauseRequest?.();
      return;
    }

    if (!frameSeconds) return;
    if (this.pendingOutcome) {
      this.rocket.updateDamageFeedback(frameSeconds);
      this.updateParticles(frameSeconds);
      this.presentPendingOutcome();
      return;
    }
    const frameMs = frameSeconds * 1000;
    this.elapsedMs += frameMs;
    this.collisionImpact = tickCollisionImpact(this.collisionImpact, frameMs, true);
    this.collisionAlertRemainingMs = Math.max(0, this.collisionAlertRemainingMs - frameMs);
    // Os temporizadores avançam somente dentro do loop ativo; em pausa, tick retorna acima.
    const rouletteWasActive = this.powerUps.rouletteMs > 0;
    this.powerUps = tickPowerUps(this.powerUps, frameMs);
    if (this.powerUpReveal) {
      this.powerUpReveal.elapsedMs = Math.min(MYSTERY_BOX.selectionRevealMs, this.powerUpReveal.elapsedMs + frameMs);
      if (this.powerUpReveal.elapsedMs >= MYSTERY_BOX.selectionRevealMs) this.powerUpReveal = null;
    }
    const turboTarget = this.powerUps.turboMs > 0 ? POWER_UPS.turbo.speedMultiplier : 1;
    this.turboSpeedFactor += (turboTarget - this.turboSpeedFactor) * (1 - Math.exp(-frameSeconds / 0.45));
    if (rouletteWasActive && this.powerUps.rouletteMs <= 0) this.revealPendingPowerUp();
    this.input.apply(this.rocket, this.canvas, frameSeconds, this.view.scale);
    this.rocket.clamp(this.view.width);
    this.rocket.update(frameSeconds);
    this.rocket.updateDamageFeedback(frameSeconds);
    if (!this.endless && !this.godmode && this.getFlightSpeed() <= SPEED.criticalThreshold) {
      this.speed = Math.max(SPEED.min, this.speed - SPEED.criticalLossPerSecond * frameSeconds);
    }

    const progressMultiplier = clamp(
      this.getEffectiveSpeed() / SPEED.start,
      SPEED.minProgressMultiplier,
      SPEED.maxProgressMultiplier,
    );
    this.progressMs += frameMs * progressMultiplier * this.turboSpeedFactor;
    this.advanceScenery(frameSeconds, progressMultiplier * this.turboSpeedFactor, this.getFlightSpeed());

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

    const alertChanged = this.updateLowSpeedAlert();
    this.render();
    this.hudAcc += frameSeconds;
    if (alertChanged || this.hudAcc >= 0.2) {
      this.hudAcc = 0;
      this.emitHud(alertChanged);
    }
  }

  updateQuestions(dt, frameMs) {
    for (const laser of this.answerLasers) {
      if (laser.alive && laser.fadeOutElapsedMs !== null) laser.update(dt);
    }
    if (!this.currentRound) {
      this.initialQuestionRemainingMs = Math.max(0, this.initialQuestionRemainingMs - frameMs);
      if (this.initialQuestionRemainingMs === 0) this.startNextQuestion();
      return;
    }
    if (this.currentRound.status === "awaiting-resolution") {
      for (const laser of this.answerLasers) {
        if (!laser.alive || laser.fadeOutElapsedMs !== null) continue;
        laser.update(dt);
        const answer = this.currentRound.answers.find((candidate) => candidate.lane === laser.lane);
        if (answer) {
          answer.x = laser.x + (laser.width - answer.width) / 2;
          answer.y = laser.y - answer.height - 8;
        }
        if (aabbOverlaps(this.rocket, laser)) {
          this.spawnParticles(
            this.rocket.x + this.rocket.width / 2,
            this.rocket.y + this.rocket.height / 2,
            laser.color,
            18,
          );
          this.resolveCurrentAnswer(answer);
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
        if (!this.endless) this.speed = clamp(this.speed + SPEED.correctAnswerBonus, SPEED.min, SPEED.max);
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

  prepareAnswerSelection(clientX, clientY) {
    const round = this.currentRound;
    if (this.paused || this.ended || this.disposed || this.pendingOutcome
      || round?.status !== "awaiting-resolution") return undefined;

    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return undefined;
    const pointer = {
      x: (clientX - rect.left) * this.view.width / rect.width,
      y: (clientY - rect.top) * this.view.height / rect.height,
      width: 0,
      height: 0,
    };
    const laser = this.answerLasers.find((beam) => {
      const bounds = beam.drawBounds;
      return beam.alive && bounds && aabbOverlaps(pointer, bounds);
    });
    const answer = this.answers.find((card) => card.alive && (card.lane === laser?.lane || aabbOverlaps(pointer, card)));
    if (!answer) return undefined;
    return () => {
      if (this.currentRound === round && !this.pendingOutcome) this.resolveCurrentAnswer(answer);
    };
  }

  resolveCurrentAnswer(answer) {
    const result = resolveAnswerRound(this.currentRound, answer);
    if (!result) return false;
    for (const laser of this.answerLasers) laser.beginFadeOut();
    if (result.correct) {
      this.correctAnswers += 1;
      this.score += SCORE.correctAnswer;
      this.answerAnimationElapsedMs = 0;
    } else {
      this.incorrectAnswers += 1;
      const protectedByPower = this.protectFromPenalty();
      if (!protectedByPower) {
        this.rocket.triggerDamageFeedback();
        this.score = Math.max(0, this.score + SCORE.incorrectAnswer);
        if (this.endless) this.loseLife();
        else this.speed = clamp(this.speed - SPEED.wrongAnswerPenalty * (this.session.stage.speedLossMultiplier ?? 1), SPEED.min, SPEED.max);
      }
      this.answerFeedbackRemainingMs = QUESTION_TIMING.resolutionFeedbackMs;
      this.columnFlashLane = result.lane;
      this.columnFlashColor = protectedByPower ? "#83f4ff" : "#FF3030";
      this.columnFlashRemainingMs = QUESTION_TIMING.resolutionFeedbackMs;
      playGameSound(protectedByPower ? "discovery" : "incorrect");
    }
    this.emitHud(true);
    return true;
  }

  updatePickupsAndHazards(dt, frameMs) {
    const stageProgress = this.getDifficultyProgress();
    const spawnRate = this.session.difficulty.spawnRateMultiplier;
    const baseInterval = this.session.stage.obstacleIntervalMs ?? SPAWN.obstacleIntervalMs / spawnRate;
    const minInterval = this.session.stage.obstacleMinIntervalMs ?? SPAWN.obstacleMinIntervalMs;
    const interval = Math.max(minInterval,
      baseInterval * (1 - stageProgress * SPAWN.obstacleDifficultyIntervalFactor));
    this.obstacleAcc += frameMs;
    this.collectibleAcc += frameMs;
    const maxActiveObstacles = this.session.stage.maxActiveObstacles ?? 4;
    const activeObstacles = this.obstacles.filter((obstacle) => obstacle.alive).length;
    if (this.session.obstacles.length && activeObstacles < maxActiveObstacles && this.obstacleAcc >= interval) {
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
      const stageProgress = this.getDifficultyProgress();
      obstacle.speed = this.getEntitySpeed(SPAWN.obstacleFallSpeed)
        * (this.session.stage.speedMultiplier ?? this.session.difficulty.speedMultiplier ?? 1)
        * (this.session.stage.obstacleSpeedMultiplier ?? 1)
        * (1 + stageProgress * SPAWN.obstacleDifficultySpeedFactor);
      if (this.powerUps.freezeMs <= 0) obstacle.update(dt);
      if (obstacle.isDamaging && aabbOverlaps(this.rocket, obstacle.collisionBox)) {
        obstacle.alive = false;
        const protectedByPower = this.protectFromPenalty();
        if (!protectedByPower) {
          this.rocket.triggerDamageFeedback();
          if (this.endless) {
            this.loseLife();
          } else {
            const obstaclePenalty = SPEED.obstaclePenalty
              * (this.session.stage.speedLossMultiplier ?? 1)
              * (this.session.stage.obstaclePenaltyMultiplier ?? 1);
            const impactFactor = clamp(1 - obstaclePenalty / Math.max(1, this.speed), 0.32, 1);
            this.collisionImpact = triggerCollisionImpact(impactFactor);
          }
          this.collisionAlertRemainingMs = 1500;
          this.collisionAlertSequence += 1;
          playGameSound("collision");
          this.spawnParticles(this.rocket.x + this.rocket.width / 2, this.rocket.y + this.rocket.height / 2, "#ff653c", 24);
        }
        this.emitHud(true);
        if (this.pendingOutcome) return;
      }
    }
    for (const collectible of this.collectibles) {
      if (!collectible.alive) continue;
      collectible.speed = this.getEntitySpeed(SPAWN.collectibleFallSpeed);
      collectible.update(dt, this.reducedMotion, this.powerUps.magnetMs > 0 ? this.rocket : null);
      if (aabbOverlaps(this.rocket, collectible)) {
        collectible.alive = false;
        const amount = REWARDS.coinValue * (this.powerUps.doublerMs > 0 ? 2 : 1);
        this.coins = collectCoins(this.coins, amount);
        playGameSound("coin");
        this.spawnParticles(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2,
          "#f6ce62", 8);
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
        this.pendingPowerUp = getRandomPowerUp(this.rng, getFlightPowerUps(this.endless));
        this.powerUps = { ...this.powerUps, rouletteMs: MYSTERY_BOX.rouletteMs, rouletteElapsedMs: 0 };
        this.emitHud(true);
      }
    }

    this.obstacles = cullOffscreen(this.obstacles, this.view.height);
    this.collectibles = cullOffscreen(this.collectibles, this.view.height);
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.alive);
    this.updateParticles(dt);
  }

  getEntitySpeed(baseSpeed) {
    const factor = clamp(this.getEffectiveSpeed() / SPEED.start, 0.65, 1.8);
    return baseSpeed * factor * this.turboSpeedFactor;
  }

  getEffectiveSpeed() {
    return this.speed * getCollisionImpactSpeedFactor(this.collisionImpact);
  }

  getFlightSpeed() {
    return this.getEffectiveSpeed() * this.turboSpeedFactor;
  }

  loseLife() {
    this.lives -= 1;
    if (this.lives === 0) this.pendingOutcome = "defeat";
  }

  advanceScenery(dt, scroll, streakSpeed) {
    this.backgroundOffsetY -= 90 * scroll * dt;
    updateStarfield(this.stars, dt, this.view.width, this.view.height, 0.35 + scroll * 0.58, this.visualRng);
    if (!this.reducedMotion) {
      updateSpeedStreaks(this.speedStreaks, dt, this.view.width, this.view.height, streakSpeed, this.visualRng);
    }
  }

  updateLowSpeedAlert() {
    const speed = this.getFlightSpeed();
    const nextAlert = this.lowSpeedAlert ? speed < LOW_SPEED_ALERT_EXIT_KMH : speed <= LOW_SPEED_ALERT_ENTER_KMH;
    const changed = nextAlert !== this.lowSpeedAlert;
    this.lowSpeedAlert = nextAlert;
    return changed;
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

  protectFromPenalty() {
    if (this.godmode) return true;
    if (!this.powerUps.bubble) return false;
    this.powerUps = activatePowerUp(this.powerUps, "consume-bubble");
    this.spawnParticles(this.rocket.x + this.rocket.width / 2, this.rocket.y + this.rocket.height / 2, "#8cecff", 20);
    playGameSound("discovery");
    this.emitHud(true);
    return true;
  }

  revealPendingPowerUp() {
    const power = this.pendingPowerUp;
    this.pendingPowerUp = null;
    if (!power) return;
    this.receivePowerUp(power);
  }

  receivePowerUp(power) {
    if (this.endless && power === "turbo") return;
    this.powerUpReveal = { id: power, elapsedMs: 0 };
    this.powerUps = activatePowerUp(this.powerUps, power);
    playGameSound(power);
    this.emitHud(true);
  }

  spawnObstacle() {
    const obstacle = pickObstacle(this.session.obstacles, this.rng);
    if (!obstacle) return;
    const maxX = Math.max(0, this.view.width - obstacle.width);
    const candidates = Array.from({ length: 7 }, (_, index) => maxX * index / 6);
    const safe = candidates.filter((x) => Math.abs(x + obstacle.width / 2 - (this.rocket.x + this.rocket.width / 2)) >= SPAWN.obstacleMinLaneDistance
      && this.obstacles.every((active) => !active.alive || active.y > obstacle.height + SPAWN.obstacleSafeGap
        || Math.abs(x - active.x) >= (obstacle.width + active.width) / 2 + SPAWN.obstacleSafeGap));
    const pool = safe.length ? safe : candidates;
    const x = pool[Math.floor(this.rng() * pool.length)];
    const stageProgress = this.getDifficultyProgress();
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
    this.input.setEnabled(false);
    const launching = outcome === "victory" && !this.reducedMotion && Boolean(this.onVictoryLaunchComplete);
    if (launching) {
      this.victoryLaunchMs = 0;
      this.victoryLaunchSpeed = Math.max(SPEED.start, this.getFlightSpeed());
      this.rocket.clearDamageFeedback();
      playVictoryLaunchSound(VICTORY_LAUNCH);
    } else {
      if (outcome !== "victory") finishGameAudio(outcome);
      this.loop.stop();
    }
    this.answers = [];
    this.particles = [];
    this.mysteryBox = null;
    this.pendingPowerUp = null;
    this.powerUps = createPowerUpState();
    this.turboSpeedFactor = 1;
    this.powerUpReveal = null;
    this.currentRound && (this.currentRound.status = "resolved");
    this.interQuestionRemainingMs = 0;
    this.answerChoiceRemainingMs = 0;
    this.updateLowSpeedAlert();
    this.render();
    this.onOutcome?.(outcome, this.getSnapshot(), { launching });
  }

  tickVictoryLaunch(dt) {
    this.victoryLaunchMs += dt * 1000;
    if (this.reducedMotion || this.victoryLaunchMs >= VICTORY_LAUNCH_DURATION_MS) {
      this.completeVictoryLaunch();
      return;
    }
    this.rocket.rotation *= Math.exp(-12 * dt);
    const speed = this.getVictoryScenerySpeed();
    this.advanceScenery(dt, speed / SPEED.start, speed);
    this.render();
  }

  getVictoryScenerySpeed() {
    const ascent = clamp((this.victoryLaunchMs - VICTORY_LAUNCH.chargeMs) / VICTORY_LAUNCH.ascentMs, 0, 1);
    return Math.max(this.victoryLaunchSpeed, SPEED.start + (SPEED.max - SPEED.start) * ascent);
  }

  completeVictoryLaunch() {
    this.victoryLaunchMs = VICTORY_LAUNCH_DURATION_MS;
    this.loop.stop();
    this.onVictoryLaunchComplete();
  }

  emitHud(force = false) {
    const alertChanged = this.updateLowSpeedAlert();
    this.onHud?.(this.getSnapshot(), force || alertChanged);
  }

  getDifficultyProgress() {
    const duration = this.endless ? ENDLESS.difficultyRampMs : this.stageDurationMs;
    return clamp(this.progressMs / duration, 0, 1);
  }

  getSnapshot() {
    return {
      runId: this.runId,
      speed: Math.round(this.getFlightSpeed()),
      lowSpeedAlert: this.lowSpeedAlert,
      collisionAlertRemainingMs: this.collisionAlertRemainingMs,
      collisionAlertSequence: this.collisionAlertSequence,
      coins: this.coins,
      score: this.score,
      correctAnswers: this.correctAnswers,
      incorrectAnswers: this.incorrectAnswers,
      elapsedMs: this.elapsedMs,
      progressMs: this.progressMs,
      stageProgress: this.endless ? 0 : this.getDifficultyProgress(),
      stageDurationMs: this.stageDurationMs,
      godmode: this.godmode,
      planetId: this.session.planet.id,
      stageId: this.endless ? null : this.session.stage.id,
      ...(this.endless ? {
        mode: "endless",
        lives: this.lives,
        endlessScore: Math.floor(this.elapsedMs / 1000) * ENDLESS.pointsPerSecond
          + this.correctAnswers * ENDLESS.correctAnswerPoints
          + this.coins * ENDLESS.coinPoints,
      } : {}),
      question: this.currentRound?.status === "waiting-next-question" ? null : this.currentRound?.question ?? null,
      answerState: this.currentRound?.status ?? "preparing",
      selectedLane: this.currentRound?.result?.lane ?? getLaneFromCenter(this.rocket.x + this.rocket.width / 2, this.view.width),
      paused: this.paused,
      powerUps: [
        ...(this.powerUps.turboMs > 0 ? [{ id: "turbo", label: "Turbo", remainingMs: this.powerUps.turboMs, durationMs: POWER_UPS.turbo.durationMs }] : []),
        ...(this.powerUps.bubble ? [{ id: "bubble", label: "Bolha" }] : []),
        ...(this.powerUps.magnetMs > 0 ? [{ id: "magnet", label: "Ímã", remainingMs: this.powerUps.magnetMs, durationMs: POWER_UPS.magnet.durationMs }] : []),
        ...(this.powerUps.doublerMs > 0 ? [{ id: "doubler", label: "Moedas x2", remainingMs: this.powerUps.doublerMs, durationMs: POWER_UPS.doubler.durationMs }] : []),
        ...(this.powerUps.freezeMs > 0 ? [{ id: "freeze", label: "Congelamento", remainingMs: this.powerUps.freezeMs, durationMs: POWER_UPS.freeze.durationMs }] : []),
      ],
      mysteryBoxVisible: Boolean(this.mysteryBox?.alive),
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

    const offsetX = (view.width / 2 - (this.rocket.x + this.rocket.width / 2)) * 0.22;
    const offsetY = this.backgroundOffsetY;
    if (this.backdropOutset) {
      renderPlanetBackground(this.backdropCtx, view, session.planet, { offsetX, offsetY, sideOutset: this.backdropOutset + 1 });
    }
    if (!renderPlanetBackground(ctx, view, session.planet, { offsetX, offsetY })) {
      renderStarfield(ctx, this.stars);
      renderPlanetScenery(ctx, view, session.planet, this.progressMs);
    }
    if (!this.reducedMotion) {
      const streakSpeed = this.victoryLaunchMs === null ? this.getFlightSpeed() : this.getVictoryScenerySpeed();
      renderSpeedStreaks(ctx, this.speedStreaks, session.planet.theme.accent, streakSpeed);
    }
    if (this.victoryLaunchMs !== null) {
      this.renderVictoryLaunch();
      return;
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
    for (const obstacle of this.obstacles) {
      if (obstacle.alive) obstacle.render(ctx);
    }
    for (const collectible of this.collectibles) collectible.render(ctx);
    if (this.mysteryBox?.alive) this.mysteryBox.render(ctx);
    if (this.currentRound?.status === "animating-correct") {
      this.currentRound.selectedAnswer?.renderPerspective(ctx, this.answerAnimationElapsedMs / QUESTION_TIMING.perspectiveAnimationMs, view.height);
    } else if (this.currentRound?.status === "awaiting-resolution") {
      for (const answer of this.answers) if (answer.alive) answer.render(ctx);
    }
    for (const laser of this.answerLasers) laser.render(ctx, this.reducedMotion);
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
    if (this.powerUps.bubble && this.bubbleImage?.complete && this.bubbleImage.naturalWidth > 0) {
      const pulse = this.reducedMotion ? 0 : Math.sin(this.elapsedMs * Math.PI * 2 / 3200);
      const bubbleHeight = this.rocket.height * 1.45 * (1 - pulse * 0.018);
      const bubbleWidth = bubbleHeight * this.bubbleImage.naturalWidth / this.bubbleImage.naturalHeight * (1 + pulse * 0.025);
      const centerX = this.rocket.x + this.rocket.width / 2;
      const centerY = this.rocket.y + this.rocket.height / 2;
      ctx.drawImage(this.bubbleImage, centerX - bubbleWidth / 2, centerY - bubbleHeight / 2, bubbleWidth, bubbleHeight);
    }
    if (this.powerUps.rouletteMs > 0 || this.powerUpReveal) this.renderPowerRoulette();
    if (this.showHitboxes) {
      for (const obstacle of this.obstacles) {
        if (obstacle.alive) this.renderCollisionBox(obstacle.collisionBox, "#f97316");
      }
      for (const collectible of this.collectibles) {
        if (!collectible.alive) continue;
        this.renderCollisionBox(collectible, "#facc15");
      }
      for (const laser of this.answerLasers) {
        if (laser.alive) this.renderCollisionBox(laser, laser.color);
      }
      this.renderCollisionBox(this.rocket, "#fb7185");
    }
  }

  renderVictoryLaunch() {
    if (this.reducedMotion || this.victoryLaunchMs >= VICTORY_LAUNCH_DURATION_MS) return;
    const { ctx, rocket, victoryLaunchMs: elapsed } = this;
    const { chargeMs, ascentMs, tailMs } = VICTORY_LAUNCH;
    const charge = Math.min(1, elapsed / chargeMs);
    const tail = clamp((elapsed - VICTORY_ASCENT_END_MS) / tailMs, 0, 1);
    const distance = rocket.y + rocket.height * 1.45;
    const ascentAt = (time) => Math.max(0, (time - chargeMs) / ascentMs);
    const ascentOffset = -distance * ascentAt(elapsed) ** 2;
    if (rocket.usesHoneyTrail) {
      if (tail === 0) {
        ctx.save();
        ctx.translate(0, ascentOffset);
        rocket.render(ctx, this.elapsedMs + elapsed * 1.4, false);
        ctx.restore();
      }
      return;
    }
    const ascent = Math.min(1, ascentAt(elapsed));
    const centerX = rocket.x + rocket.width / 2;
    const nozzleY = rocket.y + rocket.height * 0.75;

    ctx.save();
    for (let index = 0; index < 24; index += 1) {
      const ageMs = index * 23;
      const emittedAt = elapsed - ageMs;
      if (emittedAt < 0 || emittedAt > VICTORY_ASCENT_END_MS) continue;
      const previousAscent = ascentAt(emittedAt);
      const spread = 5 + index * (1 + previousAscent);
      const x = centerX + Math.sin(index * 2.399 + elapsed * 0.005) * spread;
      const y = nozzleY - distance * previousAscent ** 2 + ageMs * 0.15;
      const size = 1 + (index % 3) * 0.6;
      ctx.globalAlpha = (0.15 + charge * 0.55) * (1 - index / 24) * (1 - tail);
      ctx.fillStyle = index % 3 === 0 ? "#fff3c2" : "#ff9a48";
      ctx.fillRect(x, y, size, size * (1.5 + previousAscent * 2.5));
    }
    ctx.restore();

    const flicker = Math.sin(elapsed * 0.073);
    const length = rocket.height * (0.32 + charge * 0.55 + ascent * 0.86 + flicker * 0.055);
    const width = rocket.width * (0.15 + charge * 0.12);

    ctx.save();
    ctx.translate(0, ascentOffset);
    ctx.save();
    const flame = ctx.createLinearGradient(centerX, nozzleY, centerX, nozzleY + length);
    flame.addColorStop(0, "#fff0b2");
    flame.addColorStop(0.42, "#ff972e");
    flame.addColorStop(1, "#ff4a1d00");
    ctx.fillStyle = flame;
    ctx.shadowColor = "#ff792c";
    ctx.shadowBlur = 12 + charge * 24;
    ctx.globalAlpha = (0.35 + charge * 0.6) * (1 - tail);
    ctx.beginPath();
    ctx.moveTo(centerX - width, nozzleY);
    ctx.quadraticCurveTo(centerX - width * 1.1, nozzleY + length * 0.42, centerX, nozzleY + length);
    ctx.quadraticCurveTo(centerX + width * 1.1, nozzleY + length * 0.42, centerX + width, nozzleY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (tail === 0) this.rocket.render(ctx, this.elapsedMs + elapsed * 1.4, false);
    ctx.restore();
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
    if (!ctx || rocket.usesHoneyTrail) return;
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
  }

  renderPowerRoulette() {
    const { ctx, view } = this;
    const cardSize = Math.min(96, Math.max(64, view.width * 0.23));
    const centerX = view.width / 2;
    const centerY = view.height * 0.42 + 36;
    const powerIds = getFlightPowerUps(this.endless);
    const powerId = this.powerUpReveal?.id
      ?? powerIds[Math.floor(this.powerUps.rouletteElapsedMs / 150) % powerIds.length];
    const image = this.powerUpImages[powerId];

    ctx.save();
    ctx.translate(centerX, centerY);
    let card = { width: cardSize, height: cardSize, color: "#fff" };
    if (this.powerUpReveal && !this.reducedMotion) {
      const progress = clamp(this.powerUpReveal.elapsedMs / MYSTERY_BOX.selectionRevealMs, 0, 1);
      card = renderPowerUpIntro(ctx, powerId, progress, cardSize);
    } else {
      ctx.globalAlpha = 1;
    }
    const { width, height, color } = card;
    ctx.fillStyle = "rgba(5, 23, 54, .9)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, Math.min(width, height) * 0.12);
    ctx.fill();
    ctx.stroke();
    if (image?.complete && image.naturalWidth > 0) {
      const maxImageWidth = width * 0.76;
      const maxImageHeight = height * 0.76;
      const fitScale = Math.min(maxImageWidth / image.naturalWidth, maxImageHeight / image.naturalHeight);
      const imageScale = fitScale * (POWER_ART_SCALE[powerId] ?? 0.85);
      const imageWidth = image.naturalWidth * imageScale;
      const imageHeight = image.naturalHeight * imageScale;
      ctx.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
    }
    ctx.restore();
  }

}
