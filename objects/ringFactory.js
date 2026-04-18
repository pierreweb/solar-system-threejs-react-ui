//objects/ringFactory.js
import { getSimulationBodyVisuals } from "./simulationVisuals.js";

import { resolveAssetUrl } from "./sceneObjectUtils.js";

export function createRingObject(obj, preset, deps) {
  const { THREE, objectRegistry, textureLoader } = deps;

  const ringConfig = obj.rings ?? obj;
  const parentName = obj.parentName ?? obj.name;
  const parent = objectRegistry.get(parentName);
  if (!parent) {
    console.warn(`Parent not found for ring: ${obj.name}`);
    return null;
  }

  const { radius } = getSimulationBodyVisuals(obj);
  const innerRadius =
    typeof ringConfig.innerRadius === "number"
      ? ringConfig.innerRadius
      : radius * (ringConfig.innerRadiusRelativeToPlanet ?? 1.3);
  const outerRadius =
    typeof ringConfig.outerRadius === "number"
      ? ringConfig.outerRadius
      : radius * (ringConfig.outerRadiusRelativeToPlanet ?? 2.1);
  const ringTexture = ringConfig.texture
    ? textureLoader.load(resolveAssetUrl(ringConfig.texture))
    : null;

  const ringMaterial = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: preset.ringOpacity,
    map: ringTexture,
    emissiveMap: ringTexture,
    roughness: 1,
    metalness: 1,
    color: ringConfig.color ?? preset.ringTint,
    emissiveIntensity: preset.ringEmissiveBoost,
    emissive: preset.ringEmissiveColor,
  });

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, 96),
    ringMaterial,
  );
  ring.rotation.x = Math.PI / 2;
  parent.mesh.add(ring);

  const entry = {
    ...obj,
    name: `${parentName} Ring`,
    mesh: ring,
    parent,
  };

  objectRegistry.set(entry.name, entry);
  return entry;
}

export function createRingDescriptor(obj) {
  const ringConfig = obj.rings ?? {};
  const { radius } = getSimulationBodyVisuals(obj);

  const innerRadius =
    typeof ringConfig.innerRadius === "number"
      ? ringConfig.innerRadius
      : radius * (ringConfig.innerRadiusRelativeToPlanet ?? 1.3);

  const outerRadius =
    typeof ringConfig.outerRadius === "number"
      ? ringConfig.outerRadius
      : radius * (ringConfig.outerRadiusRelativeToPlanet ?? 2.1);

  return {
    name: `${obj.name} Ring`,
    parentName: obj.name,
    textureUrl: resolveAssetUrl(
      ringConfig.texture ?? "./textures/saturn_small_ring_tex.png",
    ),
    color: ringConfig.color,
    innerRadiusScaled: innerRadius,
    outerRadiusScaled: outerRadius,
  };
}
