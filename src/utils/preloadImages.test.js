import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import test from "node:test";
import { PROJECT_IMAGES } from "../game/data/projectImages.js";
import { preloadImages } from "./preloadImages.js";

class MockImage {
  static instances = [];

  constructor() {
    MockImage.instances.push(this);
  }

  set src(value) {
    this.url = value;
    queueMicrotask(() => (value.includes("broken") ? this.onerror() : this.onload()));
  }
}

async function findImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findImages(path);
    return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

test("pré-carrega cada imagem única e reporta progresso mesmo em caso de falha", async () => {
  MockImage.instances = [];
  const progress = [];
  const result = await preloadImages(["/rocket.png", "/broken.png", "/rocket.png"], {
    ImageConstructor: MockImage,
    onProgress: (value) => progress.push(value),
  });

  assert.deepEqual(result, { total: 2, loaded: 1, failed: 1, completed: 2 });
  assert.equal(MockImage.instances.length, 2);
  assert.deepEqual(progress.map(({ completed }) => completed), [1, 2]);
});

test("manifesto contém todas as imagens de public/assets", async () => {
  const assetsDirectory = fileURLToPath(new URL("../../public/assets/", import.meta.url));
  const files = await findImages(assetsDirectory);
  const expected = files.map((file) => `/assets/${relative(assetsDirectory, file).replaceAll("\\", "/")}`).sort();

  assert.deepEqual([...PROJECT_IMAGES].sort(), expected);
});
