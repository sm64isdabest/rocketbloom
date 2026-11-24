export const PLANTS = [
  {
    id: "victoria-amazonica",
    name: "Girassol terrestre",
    planetId: "earth",
    moneyReward: 50,
    sustainabilityPoints: 25,
    form: "water-lily",
    palette: { leaf: "#77c77c", flower: "#f5f1df", accent: "#e7c878" },
    growthStages: ["Muda recém-resgatada", "Folhas em desenvolvimento", "Planta adulta"],
    growthArt: [2, 3, 5],
  },
  {
    id: "mars-lichen",
    name: "Flor carmesim marciana",
    planetId: "mars",
    moneyReward: 70,
    sustainabilityPoints: 35,
    form: "lichen",
    palette: { leaf: "#a8bd79", flower: "#d5d88b", accent: "#d08b59" },
    growthStages: ["Broto recém-resgatado", "Colônia em expansão", "Tapete maduro"],
    growthArt: [7, 8, 10],
  },
  {
    id: "ring-fern",
    name: "Flor dourada dos anéis",
    planetId: "saturn",
    moneyReward: 90,
    sustainabilityPoints: 45,
    form: "fern",
    palette: { leaf: "#69ce9a", flower: "#a4efbd", accent: "#d6c27a" },
    growthStages: ["Fronde jovem", "Frondes em desenvolvimento", "Samambaia adulta"],
    growthArt: [17, 18, 20],
  },
  {
    id: "ice-orchid",
    name: "Flor cristalina de Netuno",
    planetId: "neptune",
    moneyReward: 120,
    sustainabilityPoints: 60,
    form: "orchid",
    palette: { leaf: "#67d9c3", flower: "#a8e8ff", accent: "#c5a8ff" },
    growthStages: ["Broto de gelo", "Haste em desenvolvimento", "Orquídea ártica adulta"],
    growthArt: [12, 13, 15],
  },
];

export function getPlantById(plantId) {
  return PLANTS.find((plant) => plant.id === plantId) ?? null;
}

export function getPlantForPlanet(planetId) {
  return PLANTS.find((plant) => plant.planetId === planetId) ?? null;
}
