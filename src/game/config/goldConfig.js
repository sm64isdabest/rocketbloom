// Keep goals ordered by amount. Each goal unlocks the decoration defined here.
export const GOLD_GOALS = [
  { amount: 20, id: "aurora", name: "Aurora orbital", color: "#83e6d5",
    cosmetic: { id: "antenna", name: "Antenas de abelha" },
    overlay: new URL("../../assets/gold-floor/100.webp", import.meta.url).href,
    treasure: { level: 1, name: "Primeiro carregamento" } },
  { amount: 45, id: "stars", name: "Chuva de estrelas", color: "#fff1ae",
    cosmetic: { id: "skin", name: "Pintura de abelha" },
    overlay: new URL("../../assets/gold-floor/300.webp", import.meta.url).href,
    treasure: { level: 2, name: "Torres de moedas" } },
  { amount: 75, id: "saturn", name: "Saturno em órbita", color: "#ffbb88",
    cosmetic: { id: "trail", name: "Rastro de mel" },
    overlay: new URL("../../assets/gold-floor/600.webp", import.meta.url).href,
    treasure: { level: 3, name: "Cofre transbordante" } },
  { amount: 110, id: "nebula", name: "Nebulosa violeta", color: "#cfafff",
    overlay: new URL("../../assets/gold-floor/1000.webp", import.meta.url).href,
    treasure: { level: 4, name: "Montanha de ouro" } },
  { amount: 150, id: "frame", name: "Moldura solar", color: "#ffcf69",
    cosmetic: { id: "aura", name: "Aura de abelhas" },
    overlay: new URL("../../assets/gold-floor/2000.webp", import.meta.url).href,
    treasure: { level: 5, name: "Tesouro cósmico" } },
];

export const EMPTY_TREASURE = { level: 0, name: "Cofre de carga" };
export const HONEY_TRAIL_FRAMES = ["trail", "trail-02", "trail-03", "trail-04"];

export const ROCKET_COSMETICS = GOLD_GOALS.flatMap(({ amount, cosmetic }) =>
  cosmetic ? [{ ...cosmetic, amount }] : []);

export function getRocketCosmeticUrl(id, basePath = import.meta.env?.BASE_URL ?? "/") {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${base}assets/cosmetics/rocket-${id}.webp`;
}

export function getEquippedRocketCosmetics(total, preferences) {
  return ROCKET_COSMETICS.filter(({ id, amount }) => total >= amount && preferences?.[id] === true)
    .map(({ id }) => id);
}
