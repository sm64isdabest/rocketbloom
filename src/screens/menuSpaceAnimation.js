const MAX_DPR = 1.6;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const randomBetween = (random, min, max) => min + random() * (max - min);
const COLORS = ["#c8eaff", "#87c9ff", "#ffffff", "#a7baff", "#b3f0ff"];

function makeStars(width, height, random) {
  const area = width * height;
  const layers = [
    { count: clamp(Math.round(area / 15000), 45, 155), speed: 4, radius: [0.35, 0.85], alpha: [0.22, 0.52] },
    { count: clamp(Math.round(area / 39000), 25, 82), speed: 11, radius: [0.55, 1.25], alpha: [0.28, 0.7] },
    { count: clamp(Math.round(area / 95000), 12, 38), speed: 23, radius: [0.8, 1.8], alpha: [0.35, 0.82] },
  ];

  return layers.map((layer) => Array.from({ length: layer.count }, () => ({
    x: random() * width,
    y: random() * height,
    radius: randomBetween(random, ...layer.radius),
    alpha: randomBetween(random, ...layer.alpha),
    color: COLORS[Math.floor(random() * COLORS.length)],
    speed: layer.speed * randomBetween(random, 0.55, 1.5),
    drift: randomBetween(random, -0.34, 0.34),
    phase: random() * Math.PI * 2,
    twinkleSpeed: randomBetween(random, 0.45, 1.5),
    twinkle: random() > 0.35,
  })));
}

function drawNebula(ctx, width, height, elapsed) {
  const clouds = [
    { x: 0.23, y: 0.28, rx: 0.44, ry: 0.5, color: "70, 117, 255", phase: 0.2 },
    { x: 0.79, y: 0.62, rx: 0.42, ry: 0.54, color: "72, 73, 220", phase: 2.3 },
  ];
  for (const cloud of clouds) {
    const x = width * (cloud.x + Math.sin(elapsed * 0.018 + cloud.phase) * 0.008);
    const y = height * (cloud.y + Math.cos(elapsed * 0.014 + cloud.phase) * 0.01);
    const radius = Math.max(width * cloud.rx, height * cloud.ry);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${cloud.color}, 0.045)`);
    gradient.addColorStop(0.45, `rgba(${cloud.color}, 0.018)`);
    gradient.addColorStop(1, `rgba(${cloud.color}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}

function spawnStreak(width, height, random, kind) {
  const fromTop = random() < 0.55;
  const x = fromTop ? random() * width : (random() < 0.5 ? -20 : width + 20);
  const y = fromTop ? -20 : random() * height * 0.75;
  const direction = random() < 0.5 ? 1 : -1;
  const speed = kind === "comet" ? randomBetween(random, 48, 78) : kind === "meteor" ? randomBetween(random, 300, 460) : randomBetween(random, 210, 330);
  const angle = direction * randomBetween(random, 0.38, 0.9);
  const lifetime = kind === "comet" ? randomBetween(random, 8, 12) : kind === "meteor" ? randomBetween(random, 1.1, 1.8) : randomBetween(random, 0.7, 1.2);
  return {
    kind,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    age: 0,
    lifetime,
    length: kind === "comet" ? randomBetween(random, 150, 260) : kind === "meteor" ? randomBetween(random, 65, 120) : randomBetween(random, 34, 68),
    radius: kind === "comet" ? randomBetween(random, 2.5, 4) : kind === "meteor" ? randomBetween(random, 1.2, 2.2) : randomBetween(random, 0.6, 1.1),
    color: kind === "meteor" && random() > 0.7 ? "255, 221, 156" : kind === "comet" ? "112, 190, 255" : "210, 235, 255",
    curve: randomBetween(random, -10, 10),
    flicker: random() * Math.PI * 2,
  };
}

function drawStreak(ctx, streak, elapsed) {
  const progress = clamp(streak.age / streak.lifetime, 0, 1);
  const fade = Math.min(clamp(progress * 7, 0, 1), clamp((1 - progress) * 3.5, 0, 1));
  const wobble = streak.kind === "comet" ? Math.sin(progress * Math.PI) * streak.curve : 0;
  const x = streak.x + wobble;
  const y = streak.y - wobble * 0.45;
  const magnitude = Math.hypot(streak.vx, streak.vy) || 1;
  const tailX = x - streak.vx / magnitude * streak.length;
  const tailY = y - streak.vy / magnitude * streak.length;
  const tail = ctx.createLinearGradient(tailX, tailY, x, y);
  tail.addColorStop(0, `rgba(${streak.color}, 0)`);
  tail.addColorStop(0.65, `rgba(${streak.color}, ${fade * (streak.kind === "comet" ? 0.2 : 0.25)})`);
  tail.addColorStop(1, `rgba(255, 255, 255, ${fade * 0.82})`);
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = tail;
  ctx.lineWidth = streak.kind === "comet" ? 2 : streak.kind === "meteor" ? 1.45 : 0.8;
  ctx.stroke();

  if (streak.kind === "comet") {
    for (let i = 0; i < 12; i += 1) {
      const distance = (i / 12) * streak.length * 0.84;
      const offset = Math.sin(elapsed * 2.2 + streak.flicker + i * 1.7) * (2 + i * 0.25);
      const particleX = x - streak.vx / magnitude * distance - streak.vy / magnitude * offset;
      const particleY = y - streak.vy / magnitude * distance + streak.vx / magnitude * offset;
      ctx.globalAlpha = fade * (1 - i / 15) * (0.35 + 0.3 * Math.sin(elapsed * 3 + streak.flicker + i));
      ctx.fillStyle = i % 4 === 0 ? "#d9baff" : "#c9edff";
      ctx.beginPath();
      ctx.arc(particleX, particleY, i % 3 === 0 ? 1.15 : 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const pulse = streak.kind === "comet" ? 1 + Math.sin(elapsed * 4 + streak.flicker) * 0.18 : 1;
  const glowRadius = (streak.kind === "comet" ? 22 : streak.kind === "meteor" ? 9 : 5) * pulse;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glow.addColorStop(0, `rgba(255, 255, 255, ${fade * 0.9})`);
  glow.addColorStop(0.18, `rgba(${streak.color}, ${fade * 0.72})`);
  glow.addColorStop(1, `rgba(${streak.color}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 255, 255, ${fade})`;
  ctx.beginPath();
  ctx.arc(x, y, streak.radius * pulse, 0, Math.PI * 2);
  ctx.fill();
}

export function createMenuSpaceAnimation(canvas, options = {}) {
  const random = options.random ?? Math.random;
  const requestFrame = options.requestAnimationFrame ?? requestAnimationFrame;
  const cancelFrame = options.cancelAnimationFrame ?? cancelAnimationFrame;
  const getDpr = options.getDevicePixelRatio ?? (() => window.devicePixelRatio || 1);
  const reducedMotion = options.reducedMotion ?? false;
  const ctx = canvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let stars = [];
  let streaks = [];
  let elapsed = 0;
  let meteorIn = randomBetween(random, 4, 8);
  let shootingStarIn = randomBetween(random, 2, 4);
  let cometIn = randomBetween(random, 22, 35);
  let frameId = null;
  let running = false;

  function resize() {
    width = Math.max(1, canvas.clientWidth || window.innerWidth);
    height = Math.max(1, canvas.clientHeight || window.innerHeight);
    const dpr = clamp(getDpr(), 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = makeStars(width, height, random);
    draw();
  }

  function update(dt) {
    elapsed += dt;
    for (let layerIndex = 0; layerIndex < stars.length; layerIndex += 1) {
      const layer = stars[layerIndex];
      for (const star of layer) {
        star.x += (star.speed + layerIndex * 3) * dt;
        star.y += star.drift * 11 * dt;
        if (star.x > width + 2) star.x = -2;
        if (star.y > height + 2) star.y = -2;
        if (star.y < -2) star.y = height + 2;
      }
    }
    if (reducedMotion) return;

    meteorIn -= dt;
    shootingStarIn -= dt;
    cometIn -= dt;
    if (meteorIn <= 0) {
      if (streaks.filter((streak) => streak.kind === "meteor").length < 2) streaks.push(spawnStreak(width, height, random, "meteor"));
      meteorIn = randomBetween(random, 6, 13);
    }
    if (shootingStarIn <= 0) {
      if (streaks.filter((streak) => streak.kind === "shooting-star").length < 2) streaks.push(spawnStreak(width, height, random, "shooting-star"));
      shootingStarIn = randomBetween(random, 4, 10);
    }
    if (cometIn <= 0) {
      if (!streaks.some((streak) => streak.kind === "comet")) streaks.push(spawnStreak(width, height, random, "comet"));
      cometIn = randomBetween(random, 34, 54);
    }
    for (const streak of streaks) {
      streak.age += dt;
      streak.x += streak.vx * dt;
      streak.y += streak.vy * dt;
    }
    streaks = streaks.filter((streak) => streak.age < streak.lifetime && streak.x > -width * 0.4 && streak.x < width * 1.4 && streak.y < height * 1.4);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawNebula(ctx, width, height, elapsed);
    for (let layerIndex = 0; layerIndex < stars.length; layerIndex += 1) {
      for (const star of stars[layerIndex]) {
        const twinkle = star.twinkle ? 0.68 + Math.sin(elapsed * star.twinkleSpeed + star.phase) * 0.24 : 1;
        ctx.globalAlpha = star.alpha * twinkle;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * (star.twinkle ? 0.92 + twinkle * 0.12 : 1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const streak of streaks) drawStreak(ctx, streak, elapsed);
    ctx.globalAlpha = 1;
  }

  function animate(timestamp) {
    if (!running) return;
    const dt = Math.min(Math.max((timestamp - (animate.previousTimestamp ?? timestamp)) / 1000, 0), 0.05);
    animate.previousTimestamp = timestamp;
    update(dt);
    draw();
    frameId = requestFrame(animate);
  }

  return {
    resize,
    start() {
      if (running) return;
      running = true;
      resize();
      if (!reducedMotion) frameId = requestFrame(animate);
    },
    stop() {
      running = false;
      animate.previousTimestamp = undefined;
      if (frameId !== null) cancelFrame(frameId);
      frameId = null;
    },
  };
}
