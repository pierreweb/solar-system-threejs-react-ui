import { getOrbitSpeed, getScaledDistance } from "./sceneObjectUtils.js";

function auToSceneDistance(radiusAu, scale, minDistance) {
  return minDistance + Math.log1p(radiusAu) * scale;
}

export function createBeltObject(obj, preset, deps) {
  const {
    THREE,
    group,
    objectRegistry,
    logDistanceScale = 70,
    minSceneDistance = 8,
  } = deps;

  const orbit = new THREE.Object3D();
  group.add(orbit);

  const beltGroup = new THREE.Group();
  orbit.add(beltGroup);

  const asteroidGeometry = new THREE.IcosahedronGeometry(0.12, 0);
  const beltMaterial = new THREE.MeshStandardMaterial({
    color: preset.beltTint,
    roughness: 1,
    metalness: 0,
    emissive: preset.beltEmissiveColor,
    emissiveIntensity: preset.beltEmissiveBoost,
  });

  const innerRadius = auToSceneDistance(
    obj.innerAu ?? 2.2,
    logDistanceScale,
    minSceneDistance,
  );

  const outerRadius = auToSceneDistance(
    obj.outerAu ?? 3.2,
    logDistanceScale,
    minSceneDistance,
  );

  for (let i = 0; i < obj.count; i++) {
    const angle = Math.random() * Math.PI * 2;

    const radius = THREE.MathUtils.lerp(
      innerRadius,
      outerRadius,
      Math.random(),
    );

    const y = (Math.random() - 0.5) * obj.thickness;

    const asteroid = new THREE.Mesh(asteroidGeometry, beltMaterial);
    asteroid.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
    );
    asteroid.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );

    const scale = THREE.MathUtils.lerp(0.7, 2.2, Math.random());
    asteroid.scale.setScalar(scale);

    beltGroup.add(asteroid);
  }

  const entry = {
    ...obj,
    orbit,
    group: beltGroup,
    material: beltMaterial,
    orbitAngle: Math.random() * Math.PI * 2,
    innerRadius,
    outerRadius,
  };

  objectRegistry.set(obj.name, entry);
  return entry;
}

export function createBeltDescriptor(obj) {
  const innerDistance =
    obj.innerAu != null ? 47 : getScaledDistance(obj.innerRadius ?? 47);
  const outerDistance =
    obj.outerAu != null ? 58 : getScaledDistance(obj.outerRadius ?? 58);

  return {
    ...obj,
    innerRadiusScaled: getScaledDistance(innerDistance),
    outerRadiusScaled: getScaledDistance(outerDistance),
    orbitSpeed: getOrbitSpeed(obj.yearDays) * 0.12,
  };
}
