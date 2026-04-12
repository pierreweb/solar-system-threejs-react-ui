/* import {
  getOrbitSpeed,
  getScaledDistance,
  getScaledRadius,
  getSelfRotationSpeed,
  resolveAssetUrl,
} from "./sceneObjectUtils.js"; */

import {
  getOrbitSpeed,
  getSelfRotationSpeed,
  resolveAssetUrl,
} from "./sceneObjectUtils.js";

import { getSimulationBodyVisuals } from "./simulationVisuals.js";
import { simulationBodyConfigs } from "../config/simulationBodyConfigs.js";
import { MOON_ORBIT_DAYS, MOON_ROTATION_DAYS } from "../config/constants.js";

function getMoonConfig() {
  return simulationBodyConfigs.find(
    (body) =>
      body.kind === "satellite" &&
      body.parentName === "Earth" &&
      body.name === "Moon",
  );
}

export function createMoonForEarth(preset, deps) {
  const {
    THREE,
    objectRegistry,
    textureLoader,
    MOON_ORBIT_DAYS,
    MOON_ROTATION_DAYS,
    SHOW_AXES_HELPER,
    clickableMeshes,
    createLabel,
    labelObjects,
    toggleLabelsInput,
  } = deps;

  const earth = objectRegistry.get("Earth");
  if (!earth) return;
  const moonConfig = getMoonConfig();
  const { distance, radius } = getSimulationBodyVisuals(moonConfig);

  const moonOrbit = new THREE.Object3D();
  earth.mesh.add(moonOrbit);

  const moonTexture = textureLoader.load(
    moonConfig?.texture ?? "./textures/2k_moon.jpg",
  );
  const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonTexture,
    emissive: preset.moonEmissiveColor,
    emissiveMap: moonTexture,
    emissiveIntensity: preset.moonEmissiveBoost,
    roughness: 1.0,
    metalness: 1.0,
  });
  //console.log(getPlanetLikeEmissiveIntensity(earth.moon, preset));
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(radius || 0.75, 24, 24),
    moonMaterial,
  );

  moon.userData.bodyName = "Moon";
  moon.userData.clickable = true;

  if (Array.isArray(clickableMeshes)) {
    clickableMeshes.push(moon);
  }

  if (SHOW_AXES_HELPER) {
    const moonAxis = new THREE.AxesHelper(4);
    moon.add(moonAxis);
  }

  moon.position.x = distance || 5.5;
  moonOrbit.add(moon);

  const label = createLabel ? createLabel("Moon", { toggleLabelsInput }) : null;

  earth.moon = {
    name: "Moon",
    visualRole: "moon",
    orbit: moonOrbit,
    mesh: moon,
    material: moonMaterial,
    label,
    orbitAngle: 0,
    selfRotationAngle: 0,
    yearDays: MOON_ORBIT_DAYS,
    dayHours: MOON_ROTATION_DAYS * 24,
  };

  if (Array.isArray(labelObjects) && label) {
    labelObjects.push(earth.moon);
  }
}

/* export function createEarthMoonDescriptor(earthDescriptor) {
  const moonConfig = getMoonConfig();
  const { distance, radius } = getSimulationBodyVisuals(moonConfig);

  return {
    name: "Moon",
    visualRole: "moon",
    textureUrl: resolveAssetUrl(moonConfig?.texture ?? "./textures/2k_moon.jpg"),
    color: moonConfig?.color ?? 0xd0d0d0,
    radiusScaled: getScaledRadius(radius || 0.7155),
    orbitRadius: (earthDescriptor?.radiusScaled && !distance)
      ? earthDescriptor.radiusScaled * 2.9
      : getScaledDistance(distance),
    orbitSpeed: getOrbitSpeed(MOON_ORBIT_DAYS) * 1.4,
    selfRotationSpeed: getSelfRotationSpeed(MOON_ROTATION_DAYS * 24),
  };
} */
export function createEarthMoonDescriptor(earthDescriptor) {
  const moonConfig = getMoonConfig();
  const { distance, radius } = getSimulationBodyVisuals(moonConfig);

  return {
    name: "Moon",
    visualRole: "moon",
    textureUrl: resolveAssetUrl(
      moonConfig?.texture ?? "./textures/2k_moon.jpg",
    ),
    color: moonConfig?.color ?? 0xd0d0d0,
    radiusScaled: radius || 0.7155,
    orbitRadius:
      earthDescriptor?.radiusScaled && !distance
        ? earthDescriptor.radiusScaled * 2.9
        : distance || 5.5,
    orbitSpeed: getOrbitSpeed(moonConfig?.yearDays ?? MOON_ORBIT_DAYS) * 1.4,
    selfRotationSpeed: getSelfRotationSpeed(
      moonConfig?.dayHours ?? MOON_ROTATION_DAYS * 24,
    ),
  };
}
