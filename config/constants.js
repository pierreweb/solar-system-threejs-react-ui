//config/constants.js

export const SUN_ROTATION_DAYS = 25.0;
export const MOON_ORBIT_DAYS = 27.32;
export const MOON_ROTATION_DAYS = 27.32;
export const SHOW_AXES_HELPER = true;

export const LIGHT_PRESETS = {
  normal: {
    ambientIntensity: 0.5,
    ambientColor: 0xeeeeee,
    cameraFillIntensity: 0.1,
    cameraFillColor: 0xffffff,
    sunIntensity: 20,
    sunLightDecay: 0.3,
    sunLightColor: 0xfff4d6,

    planetEmissiveBoost: 1.0,
    planetEmissiveColor: 0x111111,

    dwarfEmissiveBoost: 0.8,
    dwarfEmissiveColor: 0x333322,

    moonEmissiveBoost: 0.5,
    moonEmissiveColor: 0x111111,

    ringEmissiveBoost: 100.0,
    ringEmissiveColor: 0x333333,
    ringOpacity: 0.8,
    ringTint: 0xaa8899,

    beltEmissiveBoost: 0.3,
    beltEmissiveColor: 0x443322,
    beltTint: 0x8f8476,

    orbitRing: 0x8d85aa,
    emissiveDistanceFactor: 20,
  },

  boost: {
    ambientIntensity: 0.28,
    ambientColor: 0xffffff,
    cameraFillIntensity: 0.24,
    cameraFillColor: 0xffffff,
    sunIntensity: 800,
    sunLightDecay: 0.3,
    sunLightColor: 0xfff4d6,

    planetEmissiveBoost: 2.0,
    planetEmissiveColor: 0x0000ff,

    dwarfEmissiveBoost: 10.5,
    dwarfEmissiveColor: 0x0000ff,

    moonEmissiveBoost: 0.18,
    moonEmissiveColor: 0x222244,

    ringEmissiveBoost: 1.6,
    ringEmissiveColor: 0x0000ff,
    ringOpacity: 0.9,
    ringTint: 0x0000ff,

    beltEmissiveBoost: 0.08,
    beltEmissiveColor: 0x222244,
    beltTint: 0xb0a392,

    orbitRing: 0x8d85aa,
    emissiveDistanceFactor: 20,
  },

  cinematic: {
    ambientIntensity: 0.0,
    ambientColor: 0xfff4d6,
    cameraFillIntensity: 0.05,
    cameraFillColor: 0xffffff,
    sunIntensity: 50,
    sunLightDecay: 0.1,
    sunLightColor: 0xfff4d6,

    planetEmissiveBoost: 0.5,
    planetEmissiveColor: 0x111111,

    dwarfEmissiveBoost: 0.8,
    dwarfEmissiveColor: 0x151515,

    moonEmissiveBoost: 0.00001,
    moonEmissiveColor: 0x000000,

    ringEmissiveBoost: 2.8,
    ringEmissiveColor: 0x887722, // 0x332515,
    ringOpacity: 0.7,
    ringTint: 0x624524, //0x322414,

    beltEmissiveBoost: 0.05,
    beltEmissiveColor: 0x221111,
    beltTint: 0x6f675c,

    orbitRing: 0x8d85aa,
    emissiveDistanceFactor: 100,
  },
};

export const LABEL_HEIGHT_FACTOR = 2.0;
