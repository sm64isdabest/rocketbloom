import assert from "node:assert/strict";
import test from "node:test";
import { getPlanetDifficulty } from "../config/gameConfig.js";
import { PLANETS, getPlanetById } from "../data/planets.js";
import { getObstaclesForPlanet } from "../data/obstacles.js";
import { Obstacle } from "../entities/Obstacle.js";
import { Collectible } from "../entities/Collectible.js";
import { GameEngine } from "./GameEngine.js";
import { aabbOverlaps } from "./collision.js";

function withCanvasEnvironment(run) {
  const original = {
    window: globalThis.window,
    ResizeObserver: globalThis.ResizeObserver,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  const scheduled = new Map();
  let rafId = 0;
  const observers = [];
  const ctx = new Proxy({
    createLinearGradient: () => ({ addColorStop() {} }),
    setTransform() {},
  }, { get(target, key) { return key in target ? target[key] : () => {}; } });
  globalThis.window = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  globalThis.requestAnimationFrame = (callback) => { const id = ++rafId; scheduled.set(id, callback); return id; };
  globalThis.cancelAnimationFrame = (id) => scheduled.delete(id);

  const canvas = {
    width: 0,
    height: 0,
    style: {},
    clientWidth: 320,
    parentElement: { getBoundingClientRect: () => ({ width: 320, height: 640 }) },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 640 }),
    getContext: () => ctx,
    addEventListener() {},
    removeEventListener() {},
  };

  try {
    run({ canvas, scheduled, observers });
  } finally {
    globalThis.window = original.window;
    globalThis.ResizeObserver = original.ResizeObserver;
    globalThis.requestAnimationFrame = original.requestAnimationFrame;
    globalThis.cancelAnimationFrame = original.cancelAnimationFrame;
  }
}

function createSession(durationMs = 60_000) {
  const planet = PLANETS[0];
  return {
    planet,
    stage: { ...planet.stages[0], durationMs },
    difficulty: getPlanetDifficulty(planet.id),
    obstacles: [],
  };
}

function engineOptions(canvas, callbacks = {}, extras = {}) {
  return {
    canvas,
    session: extras.session ?? createSession(extras.durationMs),
    runId: extras.runId ?? "engine-test-run",
    rng: extras.rng ?? (() => 0.43),
    onOutcome: callbacks.onOutcome,
    onHud: callbacks.onHud,
    onPauseRequest: callbacks.onPauseRequest,
  };
}

function moveRocketToLane(engine, lane) {
  const laneWidth = engine.view.width / 4;
  engine.rocket.x = lane * laneWidth + laneWidth / 2 - engine.rocket.width / 2;
  engine.rocket.targetX = engine.rocket.x;
}

function tickFor(engine, durationMs) {
  for (let elapsed = 0; elapsed < durationMs; elapsed += 50) engine.tick(0.05);
}

function getSafeLaneIndexes(engine) {
  const laneWidth = engine.view.width / 4;
  const samples = [0, 0.25, 0.5, 0.75, 1, 1.25];
  return [0, 1, 2, 3].filter((lane) => {
    const candidate = { x: lane * laneWidth + laneWidth / 2 - engine.rocket.width / 2, y: engine.rocket.y,
      width: engine.rocket.width, height: engine.rocket.height };
    return engine.obstacles.every((obstacle) => {
      if (!obstacle.alive) return true;
      const collisionBox = obstacle.collisionBox;
      return samples.every((seconds) => !aabbOverlaps(candidate, {
        ...collisionBox,
        y: collisionBox.y + obstacle.speed * seconds,
      }));
    });
  });
}

test("a seleção pelo centro do foguete registra acerto uma vez e recompensa após a animação", () => {
  withCanvasEnvironment(({ canvas }) => {
    const engine = new GameEngine(engineOptions(canvas));
    const correct = engine.answers.find((answer) => answer.correct);
    moveRocketToLane(engine, correct.lane);
    engine.answerChoiceRemainingMs = 1;
    engine.tick(0.016);
    engine.tick(0.016);
    assert.equal(engine.correctAnswers, 1);
    assert.equal(engine.incorrectAnswers, 0);
    assert.equal(engine.score, 100);
    assert.equal(engine.speed, 120);
    assert.equal(engine.currentRound.status, "animating-correct");
    tickFor(engine, 1450);
    assert.equal(engine.currentRound.status, "feedback");
    assert.equal(engine.speed, 154);
    assert.equal(engine.columnFlashColor, "#00FF00");
    engine.stop();
  });
});

test("resposta incorreta pisca vermelho sem recompensa e acerto respeita o limite de velocidade", () => {
  withCanvasEnvironment(({ canvas }) => {
    const engine = new GameEngine(engineOptions(canvas));
    const wrong = engine.answers.find((answer) => !answer.correct);
    moveRocketToLane(engine, wrong.lane);
    engine.answerChoiceRemainingMs = 1;
    engine.tick(0.016);
    engine.tick(0.016);
    assert.equal(engine.incorrectAnswers, 1);
    assert.equal(engine.speed, 82);
    assert.equal(engine.currentRound.status, "animating-incorrect");
    assert.equal(engine.columnFlashColor, "#FF3030");
    tickFor(engine, 700);
    assert.equal(engine.currentRound.status, "waiting-next-question");
    engine.stop();

    const capped = new GameEngine(engineOptions(canvas, {}, { runId: "speed-cap-test" }));
    const correct = capped.answers.find((answer) => answer.correct);
    moveRocketToLane(capped, correct.lane);
    capped.answerChoiceRemainingMs = 1;
    capped.speed = 315;
    capped.tick(0.016);
    tickFor(capped, 1450);
    assert.equal(capped.speed, 320);
    capped.stop();
  });
});

test("velocidade zerada causa derrota e uma fase concluída causa vitória", () => {
  withCanvasEnvironment(({ canvas }) => {
    const outcomes = [];
    const defeated = new GameEngine(engineOptions(canvas, { onOutcome: (outcome) => outcomes.push(outcome) }, { runId: "defeat-test" }));
    const wrong = defeated.answers.find((answer) => !answer.correct);
    moveRocketToLane(defeated, wrong.lane);
    defeated.answerChoiceRemainingMs = 1;
    defeated.speed = 20;
    defeated.tick(0.016);
    tickFor(defeated, 700);
    defeated.tick(0.016);
    assert.equal(outcomes.filter((outcome) => outcome === "defeat").length, 1);
    assert.equal(defeated.ended, true);
    defeated.stop();

    const victory = new GameEngine(engineOptions(canvas, { onOutcome: (outcome) => outcomes.push(outcome) }, { durationMs: 10, runId: "victory-test" }));
    victory.tick(0.02);
    victory.tick(0.02);
    assert.equal(outcomes.filter((outcome) => outcome === "victory").length, 1);
    assert.equal(victory.getSnapshot().progressMs, 10);
    victory.stop();
  });
});

test("pausa, retomada e reinício não deixam frames nem estado antigos ativos", () => {
  withCanvasEnvironment(({ canvas, scheduled, observers }) => {
    const first = new GameEngine(engineOptions(canvas, {}, { runId: "first-attempt" }));
    first.start();
    assert.equal(scheduled.size, 1);
    first.pause();
    first.pause();
    assert.equal(scheduled.size, 0);
    first.resume();
    first.resume();
    assert.equal(scheduled.size, 1);
    first.stop();
    first.stop();
    assert.equal(scheduled.size, 0);
    assert.equal(observers[0].disconnected, true);

    const restarted = new GameEngine(engineOptions(canvas, {}, { runId: "second-attempt" }));
    assert.equal(restarted.getSnapshot().runId, "second-attempt");
    assert.equal(restarted.speed, 120);
    assert.equal(restarted.score, 0);
    assert.equal(restarted.elapsedMs, 0);
    restarted.start();
    assert.equal(scheduled.size, 1);
    restarted.stop();
    assert.equal(scheduled.size, 0);
  });
});

test("pausa congela a janela de resposta e a animação de perspectiva", () => {
  withCanvasEnvironment(({ canvas }) => {
    const engine = new GameEngine(engineOptions(canvas));
    engine.answerChoiceRemainingMs = 20;
    engine.pause();
    engine.tick(0.05);
    assert.equal(engine.answerChoiceRemainingMs, 20);
    assert.equal(engine.currentRound.status, "awaiting-resolution");

    const correct = engine.answers.find((answer) => answer.correct);
    moveRocketToLane(engine, correct.lane);
    engine.resume();
    engine.answerChoiceRemainingMs = 1;
    engine.tick(0.016);
    assert.equal(engine.currentRound.status, "animating-correct");
    const animationTime = engine.answerAnimationElapsedMs;
    engine.pause();
    engine.tick(0.05);
    assert.equal(engine.answerAnimationElapsedMs, animationTime);
    assert.equal(engine.correctAnswers, 1);
    engine.stop();
  });
});

test("intervalo após resolução esconde opções, respeita pausa e não duplica questões", () => {
  withCanvasEnvironment(({ canvas }) => {
    const engine = new GameEngine(engineOptions(canvas, {}, { runId: "question-gap-test", rng: () => 0.43 }));
    const wrong = engine.answers.find((answer) => !answer.correct);
    moveRocketToLane(engine, wrong.lane);
    engine.answerChoiceRemainingMs = 1;
    engine.tick(0.016);
    tickFor(engine, 700);
    assert.equal(engine.currentRound.status, "waiting-next-question");
    assert.equal(engine.interQuestionRemainingMs, 6010);
    assert.equal(engine.getSnapshot().question, null);
    assert.ok(engine.answers.every((answer) => !answer.alive));

    const resolvedRound = engine.roundNumber;
    engine.startNextQuestion();
    assert.equal(engine.roundNumber, resolvedRound);
    engine.interQuestionRemainingMs = 1000;
    engine.pause();
    engine.tick(0.05);
    assert.equal(engine.interQuestionRemainingMs, 1000);
    engine.resume();
    engine.tick(0.05);
    assert.equal(engine.interQuestionRemainingMs, 950);

    engine.interQuestionRemainingMs = 1;
    engine.tick(0.05);
    assert.equal(engine.roundNumber, resolvedRound + 1);
    assert.equal(engine.currentRound.status, "awaiting-resolution");
    assert.equal(engine.answers.filter((answer) => answer.alive).length, 4);
    engine.finish("defeat");
    const finishedRound = engine.roundNumber;
    assert.equal(engine.interQuestionRemainingMs, 0);
    engine.startNextQuestion();
    engine.tick(0.05);
    assert.equal(engine.roundNumber, finishedRound);
    engine.stop();

    const restarted = new GameEngine(engineOptions(canvas, {}, { runId: "question-gap-restart" }));
    assert.equal(restarted.interQuestionRemainingMs, 0);
    assert.equal(restarted.answerChoiceRemainingMs, 2800);
    restarted.stop();
  });
});

test("obstáculo aplica uma penalidade por colisão e a pausa congela perigos e efeitos", () => {
  withCanvasEnvironment(({ canvas }) => {
    const engine = new GameEngine(engineOptions(canvas));
    const hazard = new Obstacle({ id: "asteroid", x: engine.rocket.x, y: engine.rocket.y, width: 44, height: 44 });
    engine.obstacles.push(hazard);
    const initialSpeed = engine.speed;
    engine.tick(0.016);
    engine.tick(0.016);
    assert.equal(engine.speed, initialSpeed - 44);
    assert.equal(hazard.alive, false);
    assert.ok(engine.particles.length > 0);

    const pausedHazard = new Obstacle({ id: "asteroid", x: 20, y: 10, width: 44, height: 44 });
    engine.obstacles.push(pausedHazard);
    engine.pause();
    const y = pausedHazard.y;
    engine.tick(0.5);
    assert.equal(pausedHazard.y, y);
    engine.stop();
  });
});

test("moedas e diamantes coletados atualizam o HUD uma vez por item", () => {
  withCanvasEnvironment(({ canvas }) => {
    const engine = new GameEngine(engineOptions(canvas));
    engine.collectibles.push(new Collectible({ id: "coin", kind: "coin", x: engine.rocket.x, y: engine.rocket.y, width: 24, height: 24 }));
    engine.collectibles.push(new Collectible({ id: "diamond", kind: "diamond", x: engine.rocket.x, y: engine.rocket.y, width: 24, height: 24 }));
    engine.tick(0.016);
    engine.tick(0.016);
    assert.equal(engine.getSnapshot().coins, 1);
    assert.equal(engine.getSnapshot().diamonds, 1);
    assert.equal(engine.collectibles.length, 0);
    engine.stop();
  });
});

test("Netuno 5 completa em simulação com acertos, erros ocasionais e colisões", () => {
  withCanvasEnvironment(({ canvas }) => {
    const planet = getPlanetById("neptune");
    const stage = planet.stages[4];
    const session = {
      planet,
      stage,
      difficulty: { ...getPlanetDifficulty(planet.id), mathTier: stage.difficulty },
      obstacles: getObstaclesForPlanet(planet.id),
    };
    const metrics = { obstacleSpawns: 0, obstacleSpawnTimes: [], collisions: 0, intervalsMs: [], questionCount: 0, maxSimultaneousObstacles: 0 };
    let rngState = 7919;
    const rng = () => {
      rngState = (rngState * 48271) % 2147483647;
      return rngState / 2147483647;
    };
    const outcomes = [];
    const engine = new GameEngine(engineOptions(canvas, { onOutcome: (outcome) => outcomes.push(outcome) }, {
      session,
      runId: "neptune-5-stress",
      rng,
    }));
    const spawnParticles = engine.spawnParticles.bind(engine);
    engine.spawnParticles = (x, y, color, count) => {
      if (color === "#ff9b75" && count === 12) metrics.collisions += 1;
      spawnParticles(x, y, color, count);
    };
    const spawnObstacle = engine.spawnObstacle.bind(engine);
    engine.spawnObstacle = () => {
      metrics.obstacleSpawns += 1;
      metrics.obstacleSpawnTimes.push(engine.elapsedMs);
      spawnObstacle();
    };

    let lastAnswerRound = 0;
    let nextForcedCollisionMs = 12_000;
    let forcedCollisions = 0;
    let iterations = 0;
    while (!engine.ended && iterations < 30_000) {
      const round = engine.currentRound;
      if (round?.status === "awaiting-resolution") {
        if (round.id !== lastAnswerRound && engine.answerChoiceRemainingMs <= 50) {
          metrics.questionCount += 1;
          lastAnswerRound = round.id;
          const isOccasionalError = metrics.questionCount % 5 === 0;
          let answer = round.answers.find((option) => isOccasionalError ? !option.correct : option.correct);
          const safeLanes = getSafeLaneIndexes(engine);
          if (!safeLanes.includes(answer.lane) && safeLanes.length) {
            answer = round.answers.find((option) => safeLanes.includes(option.lane) && !option.correct)
              ?? round.answers.find((option) => safeLanes.includes(option.lane));
          }
          moveRocketToLane(engine, answer.lane);
        } else if (engine.answerChoiceRemainingMs > 50) {
          const safeLanes = getSafeLaneIndexes(engine);
          if (safeLanes.length) moveRocketToLane(engine, safeLanes[0]);
        }
      }

      if (forcedCollisions < 2 && engine.elapsedMs >= nextForcedCollisionMs && engine.currentRound?.status === "awaiting-resolution"
        && engine.answerChoiceRemainingMs > 300) {
        const hazard = new Obstacle({ id: "diamond-shard", x: engine.rocket.x, y: engine.rocket.y - 28, width: 40, height: 40 });
        engine.obstacles.push(hazard);
        forcedCollisions += 1;
        nextForcedCollisionMs += 12_000;
      }

      const activeBefore = engine.obstacles.filter((obstacle) => obstacle.alive);
      metrics.maxSimultaneousObstacles = Math.max(metrics.maxSimultaneousObstacles, activeBefore.length);
      const previousRoundStatus = engine.currentRound?.status;
      engine.tick(0.05);
      if (previousRoundStatus !== "waiting-next-question" && engine.currentRound?.status === "waiting-next-question") {
        metrics.intervalsMs.push(engine.interQuestionRemainingMs);
      }
      iterations += 1;
    }

    metrics.result = outcomes.at(-1) ?? null;
    metrics.elapsedSeconds = engine.elapsedMs / 1000;
    metrics.finalSpeed = engine.speed;
    metrics.correctAnswers = engine.correctAnswers;
    metrics.incorrectAnswers = engine.incorrectAnswers;
    metrics.progressMs = engine.progressMs;
    assert.equal(metrics.result, "victory", JSON.stringify(metrics));
    assert.ok(metrics.correctAnswers > metrics.incorrectAnswers, JSON.stringify(metrics));
    assert.ok(metrics.collisions >= 1, JSON.stringify(metrics));
    assert.ok(metrics.obstacleSpawns > 10, JSON.stringify(metrics));
    assert.ok(metrics.intervalsMs.every((interval) => interval >= 3000 && interval <= 10000), JSON.stringify(metrics));
    assert.ok(metrics.elapsedSeconds < 600, JSON.stringify(metrics));
    engine.stop();
  });
});
