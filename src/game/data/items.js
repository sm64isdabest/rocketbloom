export const COLLECTIBLES = [
  { id: "coin", name: "Moeda", kind: "coin", width: 22, height: 22 },
  { id: "diamond", name: "Diamante", kind: "diamond", width: 24, height: 28 },
];

export function getCollectibleById(id) {
  return COLLECTIBLES.find((item) => item.id === id) ?? null;
}
