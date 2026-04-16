import {
  degToRad,
  getOrbitSpeed,
  getPlanetSelfRotationSpeed,
  // getScaledDistance,
  //getScaledRadius,
  resolveAssetUrl,
} from "./sceneObjectUtils.js";
import { getSimulationBodyVisuals } from "./simulationVisuals.js";

export function createPlanetObject(obj, preset, deps) {
  const { distance, radius } = getSimulationBodyVisuals(obj);
  const {
    THREE,
    group,
    objectRegistry,
    animatedObjects,
    labelObjects,
    clickableMeshes,
    createPlanetLikeMaterial,
    createOrbitRing,
    createLabel,
    textureLoader,
    toggleLabelsInput,
    orbitRingObjects,
    SHOW_AXES_HELPER,
  } = deps;

  const orbit = new THREE.Object3D();
  group.add(orbit);

  const tiltPivot = new THREE.Object3D();
  tiltPivot.position.x = distance;
  tiltPivot.rotation.z = THREE.MathUtils.degToRad(obj.tiltDeg || 0);
  orbit.add(tiltPivot);

  const material = createPlanetLikeMaterial(obj, preset, { textureLoader });

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    material,
  );

  tiltPivot.add(mesh);

  mesh.userData.bodyName = obj.name;
  mesh.userData.clickable = true;
  clickableMeshes.push(mesh);

  if (SHOW_AXES_HELPER) {
    const axisLine = new THREE.AxesHelper(radius * 2.2);
    mesh.add(axisLine);
  }

  const orbitRing = obj.hasOrbitRing
    ? createOrbitRing(distance, { group, orbitRingObjects })
    : null;
  const label = obj.hasLabel
    ? createLabel(obj.name, { toggleLabelsInput })
    : null;

  const entry = {
    ...obj,
    orbit,
    tiltPivot,
    mesh,
    orbitRing,
    label,
    moon: null,
    orbitAngle: Math.random() * Math.PI * 2,
    selfRotationAngle: Math.random() * Math.PI * 2,
  };

  objectRegistry.set(obj.name, entry);
  animatedObjects.push(entry);
  labelObjects.push(entry);

  return entry;
}

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
