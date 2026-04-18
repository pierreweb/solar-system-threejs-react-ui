//objects/sunFactory
import { getSimulationBodyVisuals } from "./simulationVisuals.js";
import { resolveAssetUrl } from "./sceneObjectUtils.js";

const DEFAULT_SUN_ROTATION_SPEED = 0.12;
const DEFAULT_SUN_LABEL_OFFSET = 0.8;
const DEFAULT_SUN_HALO_SCALE = 1.08;

export function createSunRenderModel(obj) {
  const { radius } = getSimulationBodyVisuals(obj);
  const radiusScaled = radius;

  return {
    name: obj.name ?? "Sun",
    textureUrl: resolveAssetUrl(obj.texture ?? "./textures/2k_sun.jpg"),
    radiusScaled,
    haloRadiusScaled: radiusScaled * DEFAULT_SUN_HALO_SCALE,
    labelOffsetY: radiusScaled + DEFAULT_SUN_LABEL_OFFSET,
    rotationSpeed: obj.rotationSpeed ?? DEFAULT_SUN_ROTATION_SPEED,
    color: obj.color ?? 0xffcc66,
  };
}
