// Transitional helper: runtime reads visual simulation values from here while
// config gradually moves toward reference astronomy fields.
export function getSimulationBodyVisuals(body = {}) {
  const { distance, radius, orbitalDistanceAu, physicalRadiusKm } = body;

  const GLOBAL_DISTANCE_MULTIPLIER = 1.0;
  const GLOBAL_RADIUS_MULTIPLIER = 1.0;
  const MAX_SIM_RADIUS = body.visualRole === "sun" ? 22.8 : 6.5;
  const MIN_SIM_RADIUS = 0.35;
  //const MAX_SIM_RADIUS = 2.2;
  const LOG_RADIUS_SCALE = 2.2;

  const resolvedDistance =
    typeof distance === "number"
      ? distance
      : typeof orbitalDistanceAu === "number"
        ? orbitalDistanceAu
        : 0;

  /*   const resolvedRadius =
    typeof radius === "number"
      ? radius
      : typeof physicalRadiusKm === "number"
        ? physicalRadiusKm / 10000
        : 0; */

  //const MIN_SIM_RADIUS = 0.1; // Minimum radius based on Mercury's physical radius
  //const MAX_SIM_RADIUS = 15; // Maximum radius based on Sun's visual radius in config

  //const LOG_RADIUS_SCALE = 20.0;

  /*   const resolvedRadius =
    typeof radius === "number"
      ? radius
      : typeof physicalRadiusKm === "number" && physicalRadiusKm > 0
        ? Math.min(
            MAX_SIM_RADIUS,
            Math.max(
              MIN_SIM_RADIUS,
              LOG_RADIUS_SCALE * adaptedLogScaleRadius(physicalRadiusKm),
            ),
          )
        : 0; */
  const resolvedRadius =
    typeof radius === "number"
      ? radius
      : typeof physicalRadiusKm === "number"
        ? getLogScaledRadius(physicalRadiusKm, MAX_SIM_RADIUS, MIN_SIM_RADIUS) *
          LOG_RADIUS_SCALE
        : 0;
  console.log(`Resolved radius for ${body.name}: ${resolvedRadius}`);

  return {
    distance: resolvedDistance * GLOBAL_DISTANCE_MULTIPLIER,
    radius: resolvedRadius * GLOBAL_RADIUS_MULTIPLIER,
  };
}

/* function adaptedLogScaleRadius(physicalRadiusKm) {
  const MIN_RADIUS = 2440 / 10000; // Minimum radius based on Mercury's physical radius
  const MAX_RADIUS = 696340 / 10000; // Maximum radius based on Sun's physical radius
  const r = Math.log10(
    1.4 +
      (20.0 * (physicalRadiusKm / 10000 - MIN_RADIUS)) /
        (MAX_RADIUS - MIN_RADIUS),
  );
  return r;
} 
*/
function getLogScaledRadius(physicalRadiusKm, MAX_SIM_RADIUS, MIN_SIM_RADIUS) {
  if (!Number.isFinite(physicalRadiusKm) || physicalRadiusKm <= 0) {
    return 0;
  }

  const logRadius = Math.log10(physicalRadiusKm);

  return Math.min(MAX_SIM_RADIUS, Math.max(MIN_SIM_RADIUS, logRadius));
}
