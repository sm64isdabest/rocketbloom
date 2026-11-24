export function createGameLoop(tick) {
  let rafId = 0;
  let running = false;
  let lastTime = null;

  function frame(time) {
    rafId = 0;
    if (!running) {
      return;
    }
    const frameSeconds = lastTime === null ? 0 : (time - lastTime) / 1000;
    lastTime = time;
    tick(Math.min(frameSeconds, 0.05), frameSeconds);
    if (running) rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) {
        return;
      }
      running = true;
      lastTime = null;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      lastTime = null;
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
