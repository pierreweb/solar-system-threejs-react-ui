//objects/moonFactory.js
import {
  getOrbitSpeed,
  getSelfRotationSpeed,
  degToRad,
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
    orbitalInclinationRad: degToRad(moonConfig?.orbitalInclinationDeg || 0),
    orbitalAscendingNodeRad: degToRad(moonConfig?.orbitalAscendingNodeDeg || 0),
  };
}
