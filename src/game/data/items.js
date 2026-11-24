export const COLLECTIBLES = [
  { id: "coin", name: "Moeda", kind: "coin", width: 38, height: 38 },
];

export function getCollectibleById(id) {
  return COLLECTIBLES.find((item) => item.id === id) ?? null;
}
