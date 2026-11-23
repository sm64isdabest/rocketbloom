// Keep goals ordered by amount. Each goal unlocks the decoration defined here.
export const GOLD_GOALS = [
  { amount: 100, id: "aurora", name: "Aurora orbital", color: "#83e6d5",
    overlay: new URL("../../assets/gold-floor/100.webp", import.meta.url).href,
    treasure: { level: 1, name: "Primeiro carregamento" } },
  { amount: 300, id: "stars", name: "Chuva de estrelas", color: "#fff1ae",
    overlay: new URL("../../assets/gold-floor/300.webp", import.meta.url).href,
    treasure: { level: 2, name: "Torres de moedas" } },
  { amount: 600, id: "saturn", name: "Saturno em órbita", color: "#ffbb88",
    overlay: new URL("../../assets/gold-floor/600.webp", import.meta.url).href,
    treasure: { level: 3, name: "Cofre transbordante" } },
  { amount: 1000, id: "nebula", name: "Nebulosa violeta", color: "#cfafff",
    overlay: new URL("../../assets/gold-floor/1000.webp", import.meta.url).href,
    treasure: { level: 4, name: "Montanha de ouro" } },
  { amount: 2000, id: "frame", name: "Moldura solar", color: "#ffcf69",
    overlay: new URL("../../assets/gold-floor/2000.webp", import.meta.url).href,
    treasure: { level: 5, name: "Tesouro cósmico" } },
];

export const EMPTY_TREASURE = { level: 0, name: "Cofre de carga" };
