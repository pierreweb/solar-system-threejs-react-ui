//objects/simulationVisual.js
const RADIUS_SCALE_CORRECTION = 0.5;
const DISTANCE_SCALE_CORRECTION = 5.0;
const MIN_SIM_RADIUS = 0.045;
const MIN_DISTANCE_FROM_SUN = 3.0; // petite marge visuelle optionnelle
const MAX_SUN_RADIUS = 5.0;
const MIN_SUN_RADIUS = 4.0;
const MAX_PLANET_RADIUS = 3.0;
const MIN_PLANET_RADIUS = 0.05;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getSunMaxRadius() {
  return MAX_SUN_RADIUS;
}

function getSunMinRadius() {
  return MIN_SUN_RADIUS;
}
function getPlanetMinRadius() {
  return MIN_SIM_RADIUS;
}

function getPlanetMaxRadius() {
  return MAX_PLANET_RADIUS;
}
function getResolvedSunRadius() {
  const sunPhysicalRadiusKm = 696_340;
  const maxSimRadius = getSunMaxRadius();

  return Math.min(
    maxSimRadius,
    Math.max(
      MIN_SIM_RADIUS,
      RADIUS_SCALE_CORRECTION * adaptedScaledRadius(sunPhysicalRadiusKm),
    ),
  );
}
function adaptedScaledRadius(physicalRadiusKm) {
  const adaptedRadius =
    0.05 + 0.8987 * Math.log10(0.1 + physicalRadiusKm) - 2.3541;

  //console.log(`Adapted  radius for ${physicalRadiusKm}: ${adaptedRadius}`);
  return adaptedRadius;
}

function adaptedLogScaleDistance(physicalDistanceAu = 0) {
  const adaptedDistance =
    getSunMinRadius() +
    MIN_DISTANCE_FROM_SUN +
    DISTANCE_SCALE_CORRECTION * Math.log(2.0 * physicalDistanceAu); //Math.log10(1.4 + 20.0 * ratio);
  //console.log(`Adapted distance for ${physicalDistanceAu} AU: ${adaptedDistance}`);
  return adaptedDistance;
}

export function getSimulationBodyVisuals(body = {}) {
  const {
    name,
    visualRole,
    distance,
    radius,
    orbitalDistanceAu,
    physicalRadiusKm,
  } = body;

  const maxSimRadius =
    visualRole === "sun" ? getSunMaxRadius() : getPlanetMaxRadius();
  // visualRole === "sun" ? getResolvedSunRadius() : getPlanetMaxRadius();
  const minSimRadius =
    visualRole === "sun" ? getSunMinRadius() : getPlanetMinRadius();

  const resolvedRadius =
    typeof radius === "number"
      ? radius
      : typeof physicalRadiusKm === "number" && physicalRadiusKm > 0
        ? Math.min(
            maxSimRadius,
            Math.max(
              minSimRadius,
              RADIUS_SCALE_CORRECTION * adaptedScaledRadius(physicalRadiusKm),
            ),
          )
        : 0;

  const resolvedDistance =
    typeof distance === "number"
      ? distance
      : typeof orbitalDistanceAu === "number" && orbitalDistanceAu >= 0
        ? visualRole === "sun"
          ? 0
          : Math.max(
              //getResolvedSunRadius() + MIN_DISTANCE_FROM_SUN,
              // getResolvedSunRadius(),
              0.0,
              adaptedLogScaleDistance(orbitalDistanceAu),
            )
        : 0;

  // console.log(`Resolved radius for ${name}: ${resolvedRadius}`);
  //console.log(`Resolved distance for ${name}: ${resolvedDistance}`);
  //console.log(`Sun max radius: ${getSunMaxRadius()}`); */

  return {
    distance: resolvedDistance,
    radius: resolvedRadius,
  };
}

export function getSimulationBeltVisuals(obj = {}) {
  const { innerAu, outerAu } = obj;

  const resolvedInner =
    typeof innerAu === "number" && innerAu >= 0
      ? adaptedLogScaleDistance(innerAu)
      : 0;

  const resolvedOuter =
    typeof outerAu === "number" && outerAu >= 0
      ? adaptedLogScaleDistance(outerAu)
      : 0;

  // console.log(`Resolved belt inner radius: ${resolvedInner}`);
  //console.log(`Resolved belt outer radius: ${resolvedOuter}`);
  return {
    innerRadius: resolvedInner,
    outerRadius: resolvedOuter,
  };
}
