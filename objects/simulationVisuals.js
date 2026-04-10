// Transitional helper: runtime reads visual simulation values from here while
// config gradually moves toward reference astronomy fields.
export function getSimulationBodyVisuals(body = {}) {
  const { distance, radius, orbitalDistanceAu, physicalRadiusKm } = body;

  return {
    distance:
      typeof distance === "number"
        ? distance
        : typeof orbitalDistanceAu === "number"
          ? orbitalDistanceAu
          : 0,
    radius:
      typeof radius === "number"
        ? radius
        : typeof physicalRadiusKm === "number"
          ? physicalRadiusKm / 10000
          : 0,
  };
}
