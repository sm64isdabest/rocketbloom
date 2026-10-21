export function createGameLoop(tick) {
  let rafId = 0;
  let running = false;
  let lastTime = 0;

  function frame(time) {
    rafId = 0;
    if (!running) {
      return;
    }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    tick(dt);
    if (running) rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) {
        return;
      }
      running = true;
      lastTime = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      lastTime = 0;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
    get isRunning() {
      return running;
    },
  };
}
