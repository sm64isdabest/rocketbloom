import * as THREE from "three";

const standard = (color, roughness = 0.38, metalness = 0.04) => new THREE.MeshStandardMaterial({
  color,
  roughness,
  metalness,
});

function addMesh(group, name, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createFin() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.2);
  shape.quadraticCurveTo(0.31, -0.06, 0.43, -0.76);
  shape.quadraticCurveTo(0.45, -0.94, 0.32, -0.84);
  shape.lineTo(0.02, -0.47);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 6 });
}

export function createRocketModel() {
  const rocket = new THREE.Group();
  rocket.name = "rocket-model";

  const white = standard(0xf7f5ee, 0.3);
  const red = standard(0xf32924, 0.3, 0.06);
  const redDark = standard(0x9f141c, 0.42);
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x079fe8, roughness: 0.16, metalness: 0.16, clearcoat: 1, clearcoatRoughness: 0.1 });
  const blueDark = standard(0x045086, 0.25, 0.1);
  const gold = standard(0xffc533, 0.3);

  addMesh(rocket, "fuselage", new THREE.CylinderGeometry(0.39, 0.33, 1.38, 18, 1), white, [0, 0.02, 0]);
  addMesh(rocket, "shoulder", new THREE.CylinderGeometry(0.34, 0.4, 0.16, 18), white, [0, -0.58, 0]);
  addMesh(rocket, "nose", new THREE.ConeGeometry(0.4, 0.8, 18), red, [0, 1.11, 0]);
  addMesh(rocket, "nose-rim", new THREE.TorusGeometry(0.39, 0.045, 8, 20), redDark, [0, 0.73, 0]);
  addMesh(rocket, "engine", new THREE.CylinderGeometry(0.31, 0.28, 0.32, 16), red, [0, -0.77, 0]);
  addMesh(rocket, "engine-rim", new THREE.TorusGeometry(0.29, 0.035, 7, 18), redDark, [0, -0.91, 0]);

  const leftFin = addMesh(rocket, "left-fin", createFin(), red, [-0.3, -0.16, -0.02]);
  leftFin.rotation.y = Math.PI;
  const rightFin = addMesh(rocket, "right-fin", createFin(), red, [0.3, -0.16, -0.02]);

  const windowFrame = addMesh(rocket, "window-frame", new THREE.TorusGeometry(0.3, 0.07, 10, 28), red, [0, 0.2, 0.33]);
  windowFrame.rotation.x = 0;
  addMesh(rocket, "window", new THREE.SphereGeometry(0.245, 20, 16), blue, [0, 0.2, 0.35], [1, 1, 0.32]);
  addMesh(rocket, "window-shadow", new THREE.TorusGeometry(0.225, 0.025, 8, 24), blueDark, [0, 0.2, 0.36]);
  for (const [index, x, y] of [[0, -0.21, 0.41], [1, 0.21, 0.41], [2, -0.21, -0.01], [3, 0.21, -0.01]]) {
    addMesh(rocket, `rivet-${index}`, new THREE.SphereGeometry(0.035, 8, 8), gold, [x, y, 0.39]);
  }

  const flame = new THREE.Group();
  flame.name = "flame";
  flame.position.y = -0.95;
  flame.userData.animated = true;
  addMesh(flame, "flame-outer", new THREE.ConeGeometry(0.23, 0.86, 12), red, [0, -0.36, 0]);
  addMesh(flame, "flame-middle", new THREE.ConeGeometry(0.17, 0.68, 12), gold, [0, -0.29, 0.015]);
  addMesh(flame, "flame-core", new THREE.ConeGeometry(0.105, 0.49, 12), new THREE.MeshBasicMaterial({ color: 0xfff08a }), [0, -0.19, 0.028]);
  rocket.add(flame);

  const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
  highlight.name = "window-glint";
  highlight.position.set(-0.075, 0.285, 0.435);
  highlight.scale.set(0.75, 1.4, 0.22);
  rocket.add(highlight);

  return rocket;
}
