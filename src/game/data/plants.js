export const PLANTS = [
  {
    id: "victoria-amazonica",
    name: "Vitória-régia",
    planetId: "earth",
    moneyReward: 50,
    sustainabilityPoints: 25,
    form: "water-lily",
    palette: { leaf: "#77c77c", flower: "#f5f1df", accent: "#e7c878" },
    growthStages: ["Muda recém-resgatada", "Broto jovem", "Folhas em desenvolvimento", "Quase adulta", "Vitória-régia adulta"],
  },
  {
    id: "mars-lichen",
    name: "Líquen marciano",
    planetId: "mars",
    moneyReward: 70,
    sustainabilityPoints: 35,
    form: "lichen",
    palette: { leaf: "#a8bd79", flower: "#d5d88b", accent: "#d08b59" },
    growthStages: ["Esporos recém-resgatados", "Crosta inicial", "Colônia em expansão", "Tapete quase maduro", "Tapete maduro"],
  },
  {
    id: "ring-fern",
    name: "Samambaia dos anéis",
    planetId: "saturn",
    moneyReward: 90,
    sustainabilityPoints: 45,
    form: "fern",
    palette: { leaf: "#69ce9a", flower: "#a4efbd", accent: "#d6c27a" },
    growthStages: ["Esporo recém-resgatado", "Fronde jovem", "Frondes em desenvolvimento", "Samambaia quase adulta", "Samambaia adulta"],
  },
  {
    id: "ice-orchid",
    name: "Orquídea de gelo",
    planetId: "neptune",
    moneyReward: 120,
    sustainabilityPoints: 60,
    form: "orchid",
    palette: { leaf: "#67d9c3", flower: "#a8e8ff", accent: "#c5a8ff" },
    growthStages: ["Semente recém-resgatada", "Broto de gelo", "Haste em desenvolvimento", "Quase em floração", "Orquídea ártica adulta"],
  },
];

export function getPlantById(plantId) {
  return PLANTS.find((plant) => plant.id === plantId) ?? null;
}

export function getPlantForPlanet(planetId) {
  return PLANTS.find((plant) => plant.planetId === planetId) ?? null;
}
