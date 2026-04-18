//objects/planetFactory.js
import {
  degToRad,
  getOrbitSpeed,
  getPlanetSelfRotationSpeed,
  resolveAssetUrl,
} from "./sceneObjectUtils.js";
import { getSimulationBodyVisuals } from "./simulationVisuals.js";

const DEFAULT_PLANET_LABEL_OFFSET = 0.8;

export function createPlanetDescriptor(obj) {
  const { distance, radius } = getSimulationBodyVisuals(obj);

  return {
    ...obj,
    textureUrl: resolveAssetUrl(obj.texture),
    orbitRadius: distance,
    radiusScaled: radius,
    tiltRad: degToRad(obj.tiltDeg || 0),
    orbitalInclinationRad: degToRad(obj.orbitalInclinationDeg || 0),
    orbitalAscendingNodeRad: degToRad(obj.orbitalAscendingNodeDeg || 0),
    orbitSpeed: getOrbitSpeed(obj.yearDays),
    selfRotationSpeed: getPlanetSelfRotationSpeed(obj.name),
  };
}
