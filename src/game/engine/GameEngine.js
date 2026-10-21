import { COLLECTIBLES } from "../data/items.js";
import { SPEED, SCORE, SPAWN } from "../config/gameConfig.js";
import { Answer } from "../entities/Answer.js";
import { Collectible } from "../entities/Collectible.js";
import { Obstacle } from "../entities/Obstacle.js";
import { Rocket } from "../entities/Rocket.js";
import { cullOffscreen } from "../systems/spawn.js";
import { createAnswerRound, resolveAnswerRound } from "../systems/answerRound.js";
import { generateQuestion } from "../systems/questions.js";
import { aabbOverlaps } from "./collision.js";
import { createStarfield, renderStarfield, updateStarfield } from "../systems/stars.js";
import { renderPlanetScenery } from "../systems/scenery.js";
import { createInputController } from "./input.js";
import { createGameLoop } from "./loop.js";
import { fitCanvasToContainer } from "./resize.js";
import { finishGameAudio, pauseGameAudio, playGameSound, startGameAudio } from "../audio/audioManager.js";

function makeRunId() {
  return globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class GameEngine {
  constructor({ canvas, session, controlMode = "pointer", reducedMotion = false, onHud, onPauseRequest, onOutcome, rng = Math.random, runId = makeRunId() }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.session = session;
    this.reducedMotion = reducedMotion;
    this.onHud = onHud;
    this.onPauseRequest = onPauseRequest;
    this.onOutcome = onOutcome;
    this.rng = rng;
    this.runId = runId;

    this.view = { width: 0, height: 0, dpr: 1 };
    this.rocket = new Rocket();
    this.stars = [];
    this.answers = [];
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.entitySequence = 0;
    this.speed = SPEED.start;
    this.elapsedMs = 0;
    this.progressMs = 0;
    this.coins = 0;
    this.diamonds = 0;
    this.score = 0;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
    this.paused = false;
    this.ended = false;
    this.disposed = false;
    this.hudAcc = 0;
    this.obstacleAcc = 0;
    this.collectibleAcc = 0;
    this.nextQuestionInMs = 0;
    this.roundNumber = 0;
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

  resize() {
    this.view = fitCanvasToContainer(this.canvas);
    if (!this.rocket.x && !this.rocket.y) {
      this.rocket.place(this.view.width, this.view.height);
    } else {
      this.rocket.y = this.view.height - Math.min(96, this.view.height * 0.13) - this.rocket.height;
      this.rocket.clamp(this.view.width);
    }
    this.stars = createStarfield(70, this.view.width, this.view.height, this.session.planet.theme.starAlpha, this.rng);
    for (const answer of this.answers) {
      const lane = answer.lane ?? 1.5;
      answer.x = clamp(this.view.width * ((lane + 0.5) / 4) - answer.width / 2, 0, this.view.width - answer.width);
    }
    for (const entity of [...this.obstacles, ...this.collectibles]) {
      entity.x = clamp(entity.x, 0, this.view.width - entity.width);
    }
    if (!this.disposed) this.render();
  }

  start() {
    if (this.ended || this.disposed) return;
    this.paused = false;
    startGameAudio();
    this.render();
    this.loop.start();
    this.emitHud(true);
  }

  pause() {
    if (this.ended || this.disposed || this.paused) return;
    this.paused = true;
    pauseGameAudio();
    this.loop.stop();
    this.emitHud(true);
  }

  resume() {
    if (this.ended || this.disposed || !this.paused) return;
    this.paused = false;
    startGameAudio();
    this.loop.start();
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
    this.roundNumber += 1;
    const question = generateQuestion({
      difficulty: this.session.difficulty.mathTier,
      categories: this.session.stage.questionCategories,
      limits: this.session.stage.questionLimits,
      rng: this.rng,
      id: `${this.session.stage.id}-q${this.roundNumber}`,
    });
    this.currentRound = createAnswerRound(question, {
      width: this.view.width,
      id: `${this.runId}-round-${this.roundNumber}`,
      rng: this.rng,
      fallSpeed: this.getEntitySpeed(SPAWN.answerFallSpeed),
    });
    this.answers = this.currentRound.answers;
    this.nextQuestionInMs = 0;
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
    this.input.apply(this.rocket, this.canvas, frameSeconds);
    this.rocket.clamp(this.view.width);
    this.rocket.update(frameSeconds);

    const progressMultiplier = clamp(
      this.speed / SPEED.start,
      SPEED.minProgressMultiplier,
      SPEED.maxProgressMultiplier,
    );
    this.progressMs += frameMs * progressMultiplier;
    updateStarfield(this.stars, frameSeconds, this.view.width, this.view.height, 0.35 + progressMultiplier * 0.58, this.rng);

    this.updateQuestions(frameSeconds, frameMs);
    if (this.ended) return;
    this.updatePickupsAndHazards(frameSeconds, frameMs);
    if (this.ended) return;

    if (this.speed <= SPEED.defeatAtOrBelow) {
      this.finish("defeat");
      return;
    }
    if (this.progressMs >= this.session.stage.durationMs) {
      this.progressMs = this.session.stage.durationMs;
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
    if (!this.currentRound || this.currentRound.status !== "active") {
      this.nextQuestionInMs -= frameMs;
      if (this.nextQuestionInMs <= 0) this.startNextQuestion();
      return;
    }

    for (const answer of this.answers) {
      if (!answer.alive) continue;
      answer.speed = this.getEntitySpeed(SPAWN.answerFallSpeed);
      answer.update(dt);
      if (aabbOverlaps(this.rocket, answer)) {
        this.resolveCurrentAnswer(answer);
        break;
      }
    }

    this.answers = this.answers.filter((answer) => answer.alive && answer.y <= this.view.height + answer.height);
    if (this.currentRound.status === "active" && this.answers.length === 0) {
      this.resolveCurrentAnswer(null);
    }
  }

  resolveCurrentAnswer(answer) {
    const result = resolveAnswerRound(this.currentRound, answer);
    if (!result) return false;
    this.answers = [];
    if (result.correct) {
      this.correctAnswers += 1;
      this.score += SCORE.correctAnswer;
      this.speed = clamp(this.speed + SPEED.correctAnswerBonus, SPEED.min, SPEED.max);
      this.questionFeedback = "Resposta correta!";
      playGameSound("correct");
    } else {
      this.incorrectAnswers += 1;
      this.score = Math.max(0, this.score + SCORE.incorrectAnswer);
      this.speed = clamp(this.speed - SPEED.wrongAnswerPenalty * (this.session.stage.speedLossMultiplier ?? 1), SPEED.min, SPEED.max);
      this.questionFeedback = result.unanswered ? "Alternativas perdidas" : "Resposta incorreta";
      playGameSound("incorrect");
    }
    this.feedbackTimerMs = 1100;
    this.nextQuestionInMs = SPAWN.nextQuestionDelayMs;
    this.emitHud(true);
    if (this.speed <= SPEED.defeatAtOrBelow) this.finish("defeat");
    return true;
  }

  updatePickupsAndHazards(dt, frameMs) {
    const stageProgress = clamp(this.progressMs / this.session.stage.durationMs, 0, 1);
    const spawnRate = this.session.difficulty.spawnRateMultiplier;
    const baseInterval = this.session.stage.obstacleIntervalMs ?? SPAWN.obstacleIntervalMs / spawnRate;
    const interval = Math.max(SPAWN.obstacleMinIntervalMs / spawnRate,
      baseInterval * (1 - stageProgress * SPAWN.obstacleDifficultyIntervalFactor));
    this.obstacleAcc += frameMs;
    this.collectibleAcc += frameMs;
    const activeObstacles = this.obstacles.filter((obstacle) => obstacle.alive).length;
    if (this.session.obstacles.length && activeObstacles < SPAWN.obstacleMaxActive && this.obstacleAcc >= interval) {
      this.obstacleAcc = 0;
      this.spawnObstacle();
      if (stageProgress >= SPAWN.obstaclePairAfterProgress
        && this.rng() < (stageProgress - SPAWN.obstaclePairAfterProgress) * 0.45
        && this.obstacles.filter((obstacle) => obstacle.alive).length < SPAWN.obstacleMaxActive) this.spawnObstacle();
    }
    if (this.collectibleAcc >= SPAWN.collectibleIntervalMs / spawnRate) {
      this.collectibleAcc = 0;
      this.spawnCollectible();
    }

    for (const obstacle of this.obstacles) {
      if (!obstacle.alive) continue;
      const stageProgress = clamp(this.progressMs / this.session.stage.durationMs, 0, 1);
      obstacle.speed = this.getEntitySpeed(SPAWN.obstacleFallSpeed)
        * (this.session.stage.speedMultiplier ?? this.session.difficulty.speedMultiplier ?? 1)
        * (this.session.stage.obstacleSpeedMultiplier ?? 1)
        * (1 + stageProgress * SPAWN.obstacleDifficultySpeedFactor);
      obstacle.update(dt);
      if (aabbOverlaps(this.rocket, obstacle.collisionBox)) {
        obstacle.alive = false;
        this.speed = clamp(this.speed - SPEED.obstaclePenalty * (this.session.stage.speedLossMultiplier ?? 1), SPEED.min, SPEED.max);
        this.questionFeedback = "Impacto! Velocidade reduzida";
        this.feedbackTimerMs = 900;
        playGameSound("collision");
        this.spawnParticles(this.rocket.x + this.rocket.width / 2, this.rocket.y + this.rocket.height / 2, "#ff9b75", 12);
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

    this.obstacles = cullOffscreen(this.obstacles, this.view.height);
    this.collectibles = cullOffscreen(this.collectibles, this.view.height);
    this.updateParticles(dt);
    if (this.feedbackTimerMs > 0) {
      this.feedbackTimerMs -= frameMs;
      if (this.feedbackTimerMs <= 0) this.questionFeedback = "";
    }
    if (this.speed <= SPEED.defeatAtOrBelow) this.finish("defeat");
  }

  getEntitySpeed(baseSpeed) {
    const factor = clamp(this.speed / SPEED.start, 0.65, 1.8);
    return baseSpeed * factor;
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
    const stageProgress = clamp(this.progressMs / this.session.stage.durationMs, 0, 1);
    const speed = this.getEntitySpeed(SPAWN.obstacleFallSpeed)
      * (this.session.stage.speedMultiplier ?? this.session.difficulty.speedMultiplier ?? 1)
      * (this.session.stage.obstacleSpeedMultiplier ?? 1)
      * (1 + stageProgress * SPAWN.obstacleDifficultySpeedFactor);
    this.obstacles.push(new Obstacle({ ...obstacle, x, y: -obstacle.height, speed }));
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

  spawnParticles(x, y, color, count) {
    if (this.reducedMotion) return;
    const available = Math.max(0, SPAWN.maxParticles - this.particles.length);
    for (let i = 0; i < Math.min(count, available); i += 1) {
      const angle = Math.PI * 2 * i / count + this.rng() * 0.4;
      const speed = 35 + this.rng() * 95;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.42 + this.rng() * 0.22, maxLife: 0.64, size: 2 + this.rng() * 3, color });
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
    this.paused = false;
    finishGameAudio(outcome);
    this.loop.stop();
    this.answers = [];
    this.particles = [];
    this.currentRound && (this.currentRound.status = "resolved");
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
      stageProgress: clamp(this.progressMs / this.session.stage.durationMs, 0, 1),
      planetId: this.session.planet.id,
      stageId: this.session.stage.id,
      question: this.currentRound?.question ?? null,
      feedback: this.questionFeedback,
      paused: this.paused,
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

    renderStarfield(ctx, this.stars);
    renderPlanetScenery(ctx, view, session.planet, this.progressMs);
    for (const obstacle of this.obstacles) obstacle.render(ctx);
    for (const collectible of this.collectibles) collectible.render(ctx);
    for (const answer of this.answers) answer.render(ctx);
    for (const particle of this.particles) {
      ctx.save(); ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1); ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    this.rocket.render(ctx, this.elapsedMs, this.reducedMotion);
  }

}
