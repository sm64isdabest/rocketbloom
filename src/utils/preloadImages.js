export function hasLoadedAllImages(result) {
  return result.completed === result.total
    && result.loaded === result.total
    && result.failed === 0;
}

export function preloadImages(urls, { ImageConstructor = globalThis.Image, onProgress = () => {} } = {}) {
  const uniqueUrls = [...new Set(urls)];
  const result = { total: uniqueUrls.length, loaded: 0, failed: 0, completed: 0 };

  if (!uniqueUrls.length) return Promise.resolve(result);

  return new Promise((resolve) => {
    const finish = (loaded) => {
      if (loaded) result.loaded += 1;
      else result.failed += 1;
      result.completed += 1;
      onProgress({ ...result });
      if (result.completed === result.total) resolve({ ...result });
    };

    uniqueUrls.forEach((url) => {
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
    });
  });
}
