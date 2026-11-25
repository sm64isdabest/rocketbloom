export function hasLoadedAllImages(result) {
  return result.completed === result.total
    && result.loaded === result.total
    && result.failed === 0;
}

export function preloadImages(urls, { ImageConstructor = globalThis.Image, onProgress = () => {}, concurrency = Infinity, signal } = {}) {
  const uniqueUrls = [...new Set(urls)];
  const result = { total: uniqueUrls.length, loaded: 0, failed: 0, completed: 0 };

  if (!uniqueUrls.length || signal?.aborted) return Promise.resolve(result);

  return new Promise((resolve) => {
    let next = 0;
    let pending = 0;
    const parallel = Math.max(1, Math.floor(concurrency) || 1);
    const complete = () => {
      signal?.removeEventListener("abort", complete);
      resolve({ ...result });
    };
    const finish = (loaded) => {
      if (signal?.aborted) return;
      pending -= 1;
      if (loaded) result.loaded += 1;
      else result.failed += 1;
      result.completed += 1;
      onProgress({ ...result });
      if (result.completed === result.total) complete();
      else pump();
    };

    function pump() {
      while (!signal?.aborted && pending < parallel && next < uniqueUrls.length) {
        const url = uniqueUrls[next++];
        pending += 1;
        const image = new ImageConstructor();
        let settled = false;
        const settle = (loaded) => {
          if (settled) return;
          settled = true;
          finish(loaded);
        };
        image.onload = () => settle(true);
        image.onerror = () => settle(false);
        image.src = url;
      }
    }
    signal?.addEventListener("abort", complete, { once: true });
    pump();
  });
}
