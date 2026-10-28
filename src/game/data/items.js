export const COLLECTIBLES = [
  { id: "coin", name: "Moeda", kind: "coin", width: 30, height: 30 },
  { id: "diamond", name: "Diamante", kind: "diamond", width: 34, height: 40 },
];

export function getCollectibleById(id) {
  return COLLECTIBLES.find((item) => item.id === id) ?? null;
}
