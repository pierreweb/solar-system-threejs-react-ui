// Transitional helper: runtime reads visual simulation values from here while
// config gradually moves toward reference astronomy fields.
export function getSimulationBodyVisuals(body = {}) {
  const { distance, radius, orbitalDistanceAu, physicalRadiusKm } = body;
  const GLOBAL_DISTANCE_MULTIPLIER = 1.0;
  const GLOBAL_RADIUS_MULTIPLIER = 1.0;
  const resolvedDistance =
    typeof distance === "number"
      ? distance
      : typeof orbitalDistanceAu === "number"
        ? orbitalDistanceAu
        : 0;

  const resolvedRadius =
    typeof radius === "number"
      ? radius
      : typeof physicalRadiusKm === "number"
        ? physicalRadiusKm / 10000
        : 0;

  return {
    distance: resolvedDistance * GLOBAL_DISTANCE_MULTIPLIER,
    radius: resolvedRadius * GLOBAL_RADIUS_MULTIPLIER,
  };
}
