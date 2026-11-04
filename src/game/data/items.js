export const COLLECTIBLES = [
  { id: "coin", name: "Moeda", kind: "coin", width: 38, height: 38 },
  { id: "diamond", name: "Diamante", kind: "diamond", width: 43, height: 50 },
];

export function getCollectibleById(id) {
  return COLLECTIBLES.find((item) => item.id === id) ?? null;
}
