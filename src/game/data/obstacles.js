export const OBSTACLES = [
  { id: "plane", name: "Avião", planets: ["earth"], width: 86, height: 46, color: "#d7e5ed", hitbox: { x: 0.1, y: 0.18, width: 0.8, height: 0.64 } },
  { id: "helicopter", name: "Helicóptero", planets: ["earth"], width: 64, height: 45, color: "#e8a84c", hitbox: { x: 0.18, y: 0.28, width: 0.64, height: 0.6 } },
  { id: "balloon", name: "Balão", planets: ["earth"], width: 40, height: 53, color: "#f07e79", hitbox: { x: 0.1, y: 0.04, width: 0.8, height: 0.76 } },
  { id: "asteroid", name: "Asteroide", planets: ["mars", "saturn"], width: 44, height: 44, color: "#b98562", hitbox: { x: 0.08, y: 0.08, width: 0.84, height: 0.84 } },
  { id: "comet", name: "Cometa", planets: ["saturn", "neptune"], width: 70, height: 34, color: "#8fe2ed", hitbox: { x: 0.42, y: 0.1, width: 0.5, height: 0.8 } },
  { id: "diamond-shard", name: "Fragmento de diamante", planets: ["neptune"], width: 32, height: 40, color: "#7ad4ff", hitbox: { x: 0.16, y: 0.1, width: 0.68, height: 0.8 } },
];

export function getObstaclesForPlanet(planetId) {
  return OBSTACLES.filter((obstacle) => obstacle.planets.includes(planetId));
}
