export const OBSTACLE_SPRITES = {
  plane: "earth/plane.webp",
  helicopter: "earth/helicopter.webp",
  balloon: "earth/balloon.webp",
  asteroid: "space/asteroid.webp",
  comet: "space/comet.webp",
};

export const OBSTACLES = [
  { id: "plane", name: "Avião", planets: ["earth"], width: 90, height: 85, color: "#d7e5ed", hitbox: { x: 0.1, y: 0.18, width: 0.8, height: 0.64 } },
  { id: "helicopter", name: "Helicóptero", planets: ["earth"], width: 64, height: 86, color: "#e8a84c", hitbox: { x: 0.18, y: 0.28, width: 0.64, height: 0.6 } },
  { id: "balloon", name: "Balão", planets: ["earth"], width: 55, height: 73, color: "#f07e79", hitbox: { x: 0.1, y: 0.04, width: 0.8, height: 0.76 } },
  { id: "asteroid", name: "Asteroide", planets: ["mars", "saturn", "neptune"], width: 60, height: 60, color: "#b98562", hitbox: { x: 0.08, y: 0.08, width: 0.84, height: 0.84 } },
  { id: "comet", name: "Cometa", planets: ["saturn", "neptune"], width: 96, height: 46, color: "#8fe2ed", hitbox: { x: 0.55, y: 0.08, width: 0.44, height: 0.84 } },
];

export function getObstaclesForPlanet(planetId) {
  return OBSTACLES.filter((obstacle) => obstacle.planets.includes(planetId));
}
