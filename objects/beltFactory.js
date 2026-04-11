/* import { getOrbitSpeed, getScaledDistance } from "./sceneObjectUtils.js";
import { getSimulationBeltVisuals } from "./simulationVisuals.js";
 */
import { getOrbitSpeed } from "./sceneObjectUtils.js";
import { getSimulationBeltVisuals } from "./simulationVisuals.js";

export function createBeltObject(obj, preset, deps) {
  const { THREE, group, objectRegistry } = deps;

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

  const { innerRadius, outerRadius } = getSimulationBeltVisuals(obj);

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
    //const scale = THREE.MathUtils.lerp(0.5, 1.16, Math.pow(Math.random(), 1.8));

    asteroid.scale.setScalar(1.0 * scale);

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
  const { innerRadius, outerRadius } = getSimulationBeltVisuals(obj);
  const asteroidScaleMin =
    typeof obj.asteroidScaleMin === "number" ? obj.asteroidScaleMin : 0.035;
  const asteroidScaleMax =
    typeof obj.asteroidScaleMax === "number" ? obj.asteroidScaleMax : 0.11;
  const verticalSpreadFactor =
    typeof obj.verticalSpreadFactor === "number" ? obj.verticalSpreadFactor : 0.22;
  const radialJitter =
    typeof obj.radialJitter === "number" ? obj.radialJitter : 0.12;
  const geometryRadius =
    typeof obj.geometryRadius === "number" ? obj.geometryRadius : 1;

  return {
    ...obj,
    innerRadiusScaled: innerRadius,
    outerRadiusScaled: outerRadius,
    orbitSpeed: getOrbitSpeed(obj.yearDays) * 0.12,
    asteroidScaleMin,
    asteroidScaleMax,
    verticalSpread: (obj.thickness ?? 0) * verticalSpreadFactor,
    radialJitter,
    geometryRadius,
  };
}
