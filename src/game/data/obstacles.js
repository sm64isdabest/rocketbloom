export const OBSTACLE_SPRITES = {
  plane: "earth/plane.webp",
  helicopter: "earth/helicopter.webp",
  balloon: "earth/balloon.webp",
  asteroid: "mars/asteroid.webp",
  comet: "neptune/comet.webp",
  "ring-asteroid": "saturn/ring-asteroid.webp",
  "alien-purple": "space/alien-purple.webp",
  "alien-cyclops": "space/alien-cyclops.webp",
  "ufo-disc": "space/ufo-disc.webp",
  "ufo-winged": "space/ufo-winged.webp",
  "alien-drone": "space/alien-drone.webp",
};

const SPACE_PLANETS = ["mars", "saturn", "neptune"];

export const OBSTACLES = [
  { id: "plane", name: "Avião", planets: ["earth"], width: 90, height: 85, color: "#d7e5ed", hitbox: { x: 0.1, y: 0.18, width: 0.8, height: 0.64 } },
  { id: "helicopter", name: "Helicóptero", planets: ["earth"], width: 64, height: 86, color: "#e8a84c", hitbox: { x: 0.18, y: 0.28, width: 0.64, height: 0.6 } },
  { id: "balloon", name: "Balão", planets: ["earth"], width: 55, height: 73, color: "#f07e79", hitbox: { x: 0.1, y: 0.04, width: 0.8, height: 0.76 } },
  { id: "asteroid", name: "Asteroide vermelho", planets: ["mars"], width: 60, height: 60, color: "#b98562", hitbox: { x: 0.08, y: 0.08, width: 0.84, height: 0.84 } },
  { id: "comet", name: "Cometa azul", planets: ["neptune"], width: 96, height: 46, color: "#8fe2ed", hitbox: { x: 0.55, y: 0.08, width: 0.44, height: 0.84 } },
  { id: "ring-asteroid", name: "Asteroide com anel", planets: ["saturn"], width: 94, height: 62, color: "#ffbd54", hitbox: { x: 0.25, y: 0.14, width: 0.50, height: 0.72 } },
  { id: "alien-purple", name: "Visitante violeta", planets: SPACE_PLANETS, width: 49, height: 65, color: "#ba71ff", hitbox: { x: 0.19, y: 0.1, width: 0.62, height: 0.77 } },
  { id: "alien-cyclops", name: "Visitante cíclope", planets: SPACE_PLANETS, width: 58, height: 69, color: "#37c8ff", hitbox: { x: 0.15, y: 0.1, width: 0.7, height: 0.73 } },
  { id: "ufo-disc", name: "Disco voador", planets: SPACE_PLANETS, width: 74, height: 39, color: "#bb78ff", hitbox: { x: 0.08, y: 0.17, width: 0.84, height: 0.63 } },
  { id: "ufo-winged", name: "Nave alada", planets: SPACE_PLANETS, width: 77, height: 41, color: "#7ae4ff", hitbox: { x: 0.10, y: 0.17, width: 0.80, height: 0.65 } },
  { id: "alien-drone", name: "Sonda alienígena", planets: SPACE_PLANETS, width: 67, height: 43, color: "#a293ff", hitbox: { x: 0.12, y: 0.19, width: 0.76, height: 0.64 } },
];

export function getObstaclesForPlanet(planetId) {
  return OBSTACLES.filter((obstacle) => obstacle.planets.includes(planetId));
}
