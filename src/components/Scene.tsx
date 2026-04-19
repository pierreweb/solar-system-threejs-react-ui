import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  useTexture,
  //useVideoTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { simulationBodyConfigs } from "../../config/simulationBodyConfigs.js";
import { LIGHT_PRESETS, MOON_ORBIT_DAYS } from "../../config/constants.js";
import { createBeltDescriptor } from "../../objects/beltFactory.js";
import { createEarthMoonDescriptor } from "../../objects/moonFactory.js";
import { createPlanetDescriptor } from "../../objects/planetFactory.js";
import { createRingDescriptor } from "../../objects/ringFactory.js";
import { createSunRenderModel } from "../../objects/sunFactory.js";
import { resolveAssetUrl } from "../../objects/sceneObjectUtils.js";
import type {
  BodyEphemeris,
  SupportedEphemerisBodyName,
} from "../services/ephemerisService";
import { SolarLabel } from "./SolarLabel";

import { SunMaterial } from "../components/SunMaterial";

interface SceneProps {
  onPlanetSelect: (planetName: string) => void;
  ephemerides?: Partial<Record<SupportedEphemerisBodyName, BodyEphemeris>>;
  elapsedSimDays: number;
  language: "EN" | "FR";
  showLabels: boolean;
  showOrbits: boolean;
  showAxis: boolean;
  animationSpeed: number;
  isPaused: boolean;
  isDark: boolean;
  backgroundUrl?: string | null;
  backgroundOpacity: number;
  lightPreset: "normal" | "cinematic" | "boost";
}

interface PlanetRenderModel {
  name: string;
  color: number;
  orbitRadius: number;
  radiusScaled: number;
  yearDays?: number;
  orbitSpeed: number;
  selfRotationSpeed: number;
  tiltRad: number;
  orbitalInclinationRad: number;
  orbitalAscendingNodeRad: number;
  textureUrl?: string | null;
}

interface RingRenderModel {
  parentName: string;
  textureUrl?: string | null;
  innerRadiusScaled: number;
  outerRadiusScaled: number;
  color?: number;
}

interface MoonRenderModel {
  name: string;
  orbitRadius: number;
  radiusScaled: number;
  orbitSpeed: number;
  selfRotationSpeed: number;
  textureUrl?: string | null;
  color: number;
  orbitalInclinationRad?: number;
  orbitalAscendingNodeRad?: number;
}

interface BeltRenderModel {
  name: string;
  color: number;
  count: number;
  thickness: number;
  innerRadiusScaled: number;
  outerRadiusScaled: number;
  orbitSpeed: number;
  asteroidScaleMin: number;
  asteroidScaleMax: number;
  verticalSpread: number;
  radialJitter: number;
  geometryRadius: number;
}

interface SunRenderModel {
  name: string;
  textureUrl?: string | null;
  radiusScaled: number;
  haloRadiusScaled: number;
  //  labelOffsetY: number;
  rotationSpeed: number;
  color: number;
}

const ORBIT_SEGMENTS = 128;
const SELF_ROTATION_VISUAL_SCALE = 6;
const seasonOffsetRad = +Math.PI / 2;

const EPHEMERIS_LOG_SCALE_OPTIONS = {
  minRadius: 5,
  logStretch: 4,
  distanceScale: 3,
} as const;
const SUPPORTED_EPHEMERIS_PLANET_NAMES: SupportedEphemerisBodyName[] = [
  "Mercury",
  "Venus",
  "Earth",
  "Moon",
  "Mars",
  "Ceres",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

const FIXED_RADIUS_EPHEMERIS_PLANET_NAMES = new Set<SupportedEphemerisBodyName>(
  [
    "Mercury",
    "Venus",
    "Earth",
    "Mars",
    "Ceres",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
  ],
);

const localizedSceneLabels: Record<string, { EN: string; FR: string }> = {
  Sun: { EN: "Sun", FR: "Soleil" },
  Mercury: { EN: "Mercury", FR: "Mercure" },
  Venus: { EN: "Venus", FR: "Vénus" },
  Earth: { EN: "Earth", FR: "Terre" },
  Moon: { EN: "Moon", FR: "Lune" },
  Mars: { EN: "Mars", FR: "Mars" },
  "Asteroid Belt": { EN: "Asteroid Belt", FR: "Ceinture d’astéroïdes" },
  Ceres: { EN: "Ceres", FR: "Cérès" },
  Jupiter: { EN: "Jupiter", FR: "Jupiter" },
  Saturn: { EN: "Saturn", FR: "Saturne" },
  Uranus: { EN: "Uranus", FR: "Uranus" },
  Neptune: { EN: "Neptune", FR: "Neptune" },
  Pluto: { EN: "Pluto", FR: "Pluton" },
};

const getSceneLabel = (name: string, language: "EN" | "FR") =>
  (localizedSceneLabels[name]?.[language] ?? name).toUpperCase();

function scaleEphemerisPositionLog(
  x: number,
  y: number,
  z: number,
  options: {
    minRadius?: number;
    logStretch?: number;
    distanceScale?: number;
  } = {},
) {
  const { minRadius = 5, logStretch = 4, distanceScale = 3 } = options;
  const radius = Math.sqrt(x * x + y * y + z * z);

  if (!Number.isFinite(radius) || radius <= 0) {
    return new THREE.Vector3(0, 0, 0);
  }

  const scaledRadius =
    minRadius + Math.log1p(radius * logStretch) * distanceScale;
  const direction = new THREE.Vector3(x, y, z).normalize();

  return direction.multiplyScalar(scaledRadius);
}

function projectEphemerisToScenePlane(
  x: number,
  y: number,
  z: number,
  options: Parameters<typeof scaleEphemerisPositionLog>[3] = {},
) {
  const scaled = scaleEphemerisPositionLog(x, y, z, options);

  const sceneX = scaled.x;
  const sceneZ = scaled.z;

  return {
    orbitalAngle: Math.atan2(sceneZ, sceneX),
    scaledRadius: Math.hypot(sceneX, sceneZ),
    position: new THREE.Vector3(sceneX, 0, sceneZ),
  };
}

function getOrbitalAngleOffset(
  elapsedSimDays: number,
  orbitalPeriodDays: number,
) {
  if (!Number.isFinite(orbitalPeriodDays) || orbitalPeriodDays === 0) {
    return 0;
  }

  return (Math.PI * 2 * elapsedSimDays) / orbitalPeriodDays;
}

function getProjectedOrbitPosition(
  baseAngle: number,
  scaledRadius: number,
  elapsedSimDays: number,
  orbitalPeriodDays: number,
) {
  const finalAngle =
    baseAngle + getOrbitalAngleOffset(elapsedSimDays, orbitalPeriodDays);

  return new THREE.Vector3(
    Math.cos(finalAngle) * scaledRadius,
    0,
    -Math.sin(finalAngle) * scaledRadius,
  );
}

function getRotationPeriodDaysFromSpeed(selfRotationSpeed: number) {
  if (!Number.isFinite(selfRotationSpeed) || selfRotationSpeed === 0) {
    return null;
  }

  const periodHours = (Math.PI * 2) / Math.abs(selfRotationSpeed);
  return periodHours / 24;
}

function getSelfRotationAngleFromElapsedSimDays(
  elapsedSimDays: number,
  selfRotationSpeed: number,
) {
  const rotationPeriodDays = getRotationPeriodDaysFromSpeed(selfRotationSpeed);

  if (!rotationPeriodDays) {
    return null;
  }

  const direction = selfRotationSpeed < 0 ? -1 : 1;
  return direction * ((Math.PI * 2 * elapsedSimDays) / rotationPeriodDays);
}

function getAxisHelperSize(
  radiusScaled: number,
  kind: "sun" | "planet" | "moon" = "planet",
) {
  switch (kind) {
    case "sun":
      return Math.max(radiusScaled * 1.1, 0.1);

    case "moon":
      return Math.max(radiusScaled * 1.2, 0.1);

    case "planet":
    default:
      return Math.max(radiusScaled * 1.3, 0.1);
  }
}

function getLabelOffsetY(
  radiusScaled: number,
  kind: "sun" | "planet" | "dwarf" | "moon" = "planet",
) {
  switch (kind) {
    case "sun":
      //return radiusScaled + 1.0; // Math.max(radiusScaled * 0.5, 1.2);
      return Math.max(radiusScaled + Math.log(0.6 * radiusScaled), 0.6);

    case "moon":
      return Math.max(radiusScaled + Math.log(1 + radiusScaled), 0.6);

    case "dwarf":
      return Math.max(1.0 + radiusScaled * 1.9, 5.0);

    case "planet":
    default:
      return Math.max(radiusScaled + Math.log(1 + radiusScaled), 0.6);
  }
}

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 10, 34);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function SunNode({
  sun,
  // sunMeshRef,
  language,
  showLabels,
  showAxis,
  isDark,
  animationSpeed,
  isPaused,
  onSelect,
}: {
  sun: SunRenderModel;
  // sunMeshRef: React.MutableRefObject<THREE.Mesh | null>;
  language: "EN" | "FR";
  showLabels: boolean;
  showAxis: boolean;
  isDark: boolean;
  animationSpeed: number;
  isPaused: boolean;
  onSelect: (name: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const axisHelper = useMemo(() => {
    const helper = new THREE.AxesHelper(
      getAxisHelperSize(sun.radiusScaled, "sun"),
    );
    helper.raycast = () => null;
    return helper;
  }, [sun.radiusScaled]);

  const texture = useTexture(
    sun.textureUrl ??
      resolveAssetUrl("./textures/2k_sun.jpg") ??
      "/textures/2k_sun.jpg",
  ) as THREE.Texture;

  useFrame((_, delta) => {
    if (isPaused || !meshRef.current) return;
    meshRef.current.rotation.y += delta * animationSpeed * sun.rotationSpeed;
  });

  return (
    <>
      <mesh
        ref={(node) => {
          meshRef.current = node;
          // sunMeshRef.current = node;
        }}
        scale={hovered ? 1.04 : 1}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(sun.name);
        }}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {/* <sphereGeometry args={[sun.radiusScaled, 48, 48]} />
        <meshBasicMaterial map={texture} color="#ffffff" /> */}

        <sphereGeometry args={[sun.radiusScaled, 96, 96]} />

        {/*   <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.6}
          //NoBlending | NormalBlending | AdditiveBlending | SubtractiveBlending | MultiplyBlending | CustomBlending | MaterialBlending
          blending={THREE.NormalBlending}
          depthWrite={true}
        /> */}

        <SunMaterial map={texture} />

        {showAxis && <primitive object={axisHelper} />}
      </mesh>
      {/* 
      <mesh scale={0.99}>
        <sphereGeometry args={[sun.radiusScaled, 96, 96]} />
        <meshBasicMaterial map={texture} color="#ffffff" />
         <SunMaterial map={texture} plasmaStrength={0.98} /> 
      </mesh> */}

      <mesh>
        <sphereGeometry args={[sun.haloRadiusScaled, 32, 32]} />
        <meshBasicMaterial
          color={sun.color}
          transparent
          opacity={isDark ? 0.08 : 0.04}
          depthWrite={false}
        />
      </mesh>

      {showLabels && (
        <SolarLabel
          text={getSceneLabel(sun.name, language)}
          isDark={isDark}
          position={[0, getLabelOffsetY(sun.radiusScaled, "sun"), 0]}
          distanceFactor={16}
        />
      )}
    </>
  );
}

function MoonNode({
  moon,
  language,
  elapsedSimDays,
  showLabels,
  showAxis,
  animationSpeed,
  isPaused,
  isDark,
  lightPresetConfig,
  ephemerisPosition,
  ephemerisOrbit,
  onSelect,
}: {
  moon: MoonRenderModel;
  language: "EN" | "FR";
  elapsedSimDays: number;
  showLabels: boolean;
  showAxis: boolean;
  animationSpeed: number;
  isPaused: boolean;
  isDark: boolean;
  lightPresetConfig: (typeof LIGHT_PRESETS)["normal"];
  ephemerisPosition?: THREE.Vector3;
  ephemerisOrbit?: { baseAngle: number; scaledRadius: number };
  onSelect: (name: string) => void;
}) {
  const orbitRef = useRef<THREE.Group>(null);
  const moonPositionRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const axisHelper = useMemo(() => {
    const helper = new THREE.AxesHelper(
      getAxisHelperSize(moon.radiusScaled, "moon"),
    );
    helper.raycast = () => null;
    return helper;
  }, [moon.radiusScaled]);

  const texture = useTexture(
    moon.textureUrl ??
      resolveAssetUrl("./textures/2k_moon.jpg") ??
      "/textures/2k_moon.jpg",
  ) as THREE.Texture;
  const moonPosition = ephemerisOrbit
    ? getProjectedOrbitPosition(
        ephemerisOrbit.baseAngle,
        ephemerisOrbit.scaledRadius,
        elapsedSimDays,
        MOON_ORBIT_DAYS,
      )
    : (ephemerisPosition ?? new THREE.Vector3(moon.orbitRadius, 0, 0));

  useFrame((_, delta) => {
    if (!isPaused) {
      if (orbitRef.current && !ephemerisOrbit) {
        orbitRef.current.rotation.y +=
          delta * animationSpeed * moon.orbitSpeed * 0.1;
      }

      if (meshRef.current) {
        const syncedRotationAngle = getSelfRotationAngleFromElapsedSimDays(
          elapsedSimDays,
          moon.selfRotationSpeed,
        );

        if (ephemerisOrbit && syncedRotationAngle !== null) {
          meshRef.current.rotation.y = syncedRotationAngle;
        } else {
          meshRef.current.rotation.y +=
            delta * moon.selfRotationSpeed * SELF_ROTATION_VISUAL_SCALE;
        }
      }
    }

    if (moonPositionRef.current && ephemerisOrbit) {
      moonPositionRef.current.position.copy(moonPosition);
    }
  });

  return (
    <group ref={orbitRef}>
      <group rotation={[0, moon.orbitalAscendingNodeRad ?? 0, 0]}>
        <group rotation={[moon.orbitalInclinationRad ?? 0, 0, 0]}>
          <group
            ref={moonPositionRef}
            position={[moonPosition.x, moonPosition.y, moonPosition.z]}
          >
            <mesh
              ref={meshRef}
              scale={hovered ? 1.06 : 1}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(moon.name);
              }}
              onPointerOver={() => {
                setHovered(true);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHovered(false);
                document.body.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[moon.radiusScaled, 24, 24]} />
              <meshStandardMaterial
                map={texture}
                color={moon.color}
                roughness={0.78}
                metalness={0.04}
                emissive={
                  hovered ? moon.color : lightPresetConfig.moonEmissiveColor
                }
                emissiveIntensity={
                  hovered
                    ? lightPresetConfig.moonEmissiveBoost + 0.12
                    : lightPresetConfig.moonEmissiveBoost
                }
              />

              {showAxis && <primitive object={axisHelper} />}
            </mesh>

            {showLabels && (
              <SolarLabel
                text={getSceneLabel(moon.name, language)}
                isDark={isDark}
                position={[0, getLabelOffsetY(moon.radiusScaled, "moon"), 0]}
                distanceFactor={14}
              />
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

function RingNode({
  ring,
  lightPresetConfig,
  isDark,
}: {
  ring: RingRenderModel;
  lightPresetConfig: (typeof LIGHT_PRESETS)["normal"];
  isDark: boolean;
}) {
  const texture = useTexture(
    ring.textureUrl ??
      resolveAssetUrl("./textures/saturn_small_ring_tex.png") ??
      "/textures/saturn_small_ring_tex.png",
  ) as THREE.Texture;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry
        args={[ring.innerRadiusScaled, ring.outerRadiusScaled, ORBIT_SEGMENTS]}
      />

      <meshStandardMaterial
        map={texture}
        color={isDark ? (lightPresetConfig.ringTint ?? ring.color) : 0x7e7365}
        side={THREE.DoubleSide}
        transparent
        opacity={isDark ? lightPresetConfig.ringOpacity : 0.5}
        roughness={1}
        metalness={0}
        emissive={isDark ? lightPresetConfig.ringEmissiveColor : 0x6e6254}
        emissiveIntensity={isDark ? lightPresetConfig.ringEmissiveBoost : 0.2}
      />
    </mesh>
  );
}

function PlanetNode({
  planet,

  ring,
  moon,
  language,
  orbitRadiusOverride,
  elapsedSimDays,
  showLabels,
  showOrbits,
  showAxis,
  animationSpeed,
  isPaused,
  isDark,
  lightPresetConfig,
  ephemerisPosition,
  ephemerisOrbit,
  moonEphemerisPosition,
  moonEphemerisOrbit,
  onSelect,
}: {
  planet: PlanetRenderModel;

  ring?: RingRenderModel;
  moon?: MoonRenderModel;
  language: "EN" | "FR";
  orbitRadiusOverride?: number;
  elapsedSimDays: number;
  showLabels: boolean;
  showOrbits: boolean;
  showAxis: boolean;
  animationSpeed: number;
  isPaused: boolean;
  isDark: boolean;
  lightPresetConfig: (typeof LIGHT_PRESETS)["normal"];
  ephemerisPosition?: THREE.Vector3;
  ephemerisOrbit?: { baseAngle: number; scaledRadius: number };
  moonEphemerisPosition?: THREE.Vector3;
  moonEphemerisOrbit?: { baseAngle: number; scaledRadius: number };
  onSelect: (name: string) => void;
}) {
  const orbitRef = useRef<THREE.Group>(null);
  const planetPositionRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const axisHelper = useMemo(() => {
    const helper = new THREE.AxesHelper(
      getAxisHelperSize(planet.radiusScaled, "planet"),
    );
    helper.raycast = () => null;
    return helper;
  }, [planet.radiusScaled]);

  const texture = useTexture(
    planet.textureUrl ??
      resolveAssetUrl("./textures/2k_mercury.jpg") ??
      "/textures/2k_mercury.jpg",
  ) as THREE.Texture;
  const visualOrbitRadius = orbitRadiusOverride ?? planet.orbitRadius;
  const planetPosition = ephemerisOrbit
    ? getProjectedOrbitPosition(
        ephemerisOrbit.baseAngle,
        ephemerisOrbit.scaledRadius,
        elapsedSimDays,
        planet.yearDays ?? 365.25,
      )
    : (ephemerisPosition ?? new THREE.Vector3(visualOrbitRadius, 0, 0));

  useFrame((_, delta) => {
    if (!isPaused) {
      if (orbitRef.current && !ephemerisOrbit) {
        orbitRef.current.rotation.y +=
          delta * animationSpeed * planet.orbitSpeed * 0.08;
      }

      if (meshRef.current) {
        const syncedRotationAngle = getSelfRotationAngleFromElapsedSimDays(
          elapsedSimDays,
          planet.selfRotationSpeed,
        );

        if (ephemerisOrbit && syncedRotationAngle !== null) {
          meshRef.current.rotation.y = syncedRotationAngle;
        } else {
          meshRef.current.rotation.y +=
            delta * planet.selfRotationSpeed * SELF_ROTATION_VISUAL_SCALE;
        }
      }
    }

    if (planetPositionRef.current && ephemerisOrbit) {
      planetPositionRef.current.position.copy(planetPosition);
    }
  });
  return (
    <>
      {showOrbits && (
        <group rotation={[0, planet.orbitalAscendingNodeRad ?? 0, 0]}>
          <group rotation={[planet.orbitalInclinationRad ?? 0, 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry
                args={[
                  visualOrbitRadius - 0.03,
                  visualOrbitRadius + 0.03,
                  ORBIT_SEGMENTS,
                ]}
              />
              <meshBasicMaterial
                color={isDark ? "#fce803" : "#0257c6"}
                transparent
                opacity={isDark ? 0.6 : 0.9}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        </group>
      )}

      <group ref={orbitRef}>
        <group rotation={[0, planet.orbitalAscendingNodeRad ?? 0, 0]}>
          <group rotation={[planet.orbitalInclinationRad ?? 0, 0, 0]}>
            <group
              ref={planetPositionRef}
              position={[planetPosition.x, planetPosition.y, planetPosition.z]}
            >
              <group rotation={[0, seasonOffsetRad, 0]}>
                <group rotation={[0, 0, -planet.tiltRad]}>
                  <mesh
                    ref={meshRef}
                    scale={hovered ? 1.08 : 1}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(planet.name);
                    }}
                    onPointerOver={() => {
                      setHovered(true);
                      document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={() => {
                      setHovered(false);
                      document.body.style.cursor = "auto";
                    }}
                  >
                    <sphereGeometry args={[planet.radiusScaled, 40, 40]} />
                    <meshStandardMaterial
                      map={texture}
                      color={planet.color}
                      roughness={0.72}
                      metalness={0.05}
                      emissive={
                        hovered
                          ? planet.color
                          : lightPresetConfig.planetEmissiveColor
                      }
                      emissiveIntensity={
                        hovered
                          ? lightPresetConfig.planetEmissiveBoost + 0.25
                          : lightPresetConfig.planetEmissiveBoost
                      }
                    />
                    {showAxis && <primitive object={axisHelper} />}
                  </mesh>

                  {ring && (
                    <RingNode
                      ring={ring}
                      lightPresetConfig={lightPresetConfig}
                      isDark={isDark}
                    />
                  )}
                </group>
              </group>

              {moon && (
                <MoonNode
                  moon={moon}
                  language={language}
                  elapsedSimDays={elapsedSimDays}
                  showLabels={showLabels}
                  showAxis={showAxis}
                  animationSpeed={animationSpeed}
                  isPaused={isPaused}
                  isDark={isDark}
                  lightPresetConfig={lightPresetConfig}
                  ephemerisPosition={moonEphemerisPosition}
                  ephemerisOrbit={moonEphemerisOrbit}
                  onSelect={onSelect}
                />
              )}

              {showLabels && (
                <SolarLabel
                  text={getSceneLabel(planet.name, language)}
                  isDark={isDark}
                  // position={[0, planet.radiusScaled + 0.4, 0]}
                  position={[
                    0,
                    getLabelOffsetY(planet.radiusScaled, "planet"),
                    0,
                  ]}
                  distanceFactor={14}
                />
              )}
            </group>
          </group>
        </group>
      </group>
    </>
  );
}

function AsteroidBeltNode({
  belt,
  animationSpeed,
  isPaused,
  lightPresetConfig,
}: {
  belt: BeltRenderModel;
  animationSpeed: number;
  isPaused: boolean;
  lightPresetConfig: (typeof LIGHT_PRESETS)["normal"];
}) {
  const beltRef = useRef<THREE.Group>(null);
  const instancesRef = useRef<THREE.InstancedMesh>(null);

  const asteroidTransforms = useMemo(() => {
    return Array.from({ length: belt.count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const radialSpread = Math.random();
      const radius = THREE.MathUtils.lerp(
        belt.innerRadiusScaled,
        belt.outerRadiusScaled,
        radialSpread,
      );
      const verticalOffset = (Math.random() - 0.5) * belt.verticalSpread;
      const radialOffset = (Math.random() - 0.5) * belt.radialJitter;
      const scale = THREE.MathUtils.lerp(
        belt.asteroidScaleMin,
        belt.asteroidScaleMax,
        Math.pow(Math.random(), 1.8),
      );

      return {
        position: new THREE.Vector3(
          Math.cos(angle) * (radius + radialOffset),
          verticalOffset,
          Math.sin(angle) * (radius + radialOffset),
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ),
        scale,
      };
    });
  }, [
    belt.count,
    belt.innerRadiusScaled,
    belt.outerRadiusScaled,
    belt.verticalSpread,
    belt.radialJitter,
    belt.asteroidScaleMin,
    belt.asteroidScaleMax,
  ]);

  const asteroidGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(belt.geometryRadius, 0),
    [belt.geometryRadius],
  );

  useLayoutEffect(() => {
    if (!instancesRef.current) return;

    const tempObject = new THREE.Object3D();

    asteroidTransforms.forEach(({ position, rotation, scale }, index) => {
      tempObject.position.copy(position);
      tempObject.rotation.copy(rotation);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      instancesRef.current?.setMatrixAt(index, tempObject.matrix);
    });

    instancesRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidTransforms]);

  useFrame((_, delta) => {
    if (isPaused || !beltRef.current) return;
    beltRef.current.rotation.y +=
      delta * animationSpeed * belt.orbitSpeed * 0.1;
  });

  return (
    <group ref={beltRef}>
      <instancedMesh
        ref={instancesRef}
        args={[asteroidGeometry, undefined, asteroidTransforms.length]}
        castShadow={false}
        receiveShadow={false}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color={belt.color}
          roughness={0.95}
          metalness={0.02}
          emissive={lightPresetConfig.beltEmissiveColor}
          emissiveIntensity={lightPresetConfig.beltEmissiveBoost}
        />
      </instancedMesh>
    </group>
  );
}

export const Scene: React.FC<SceneProps> = ({
  onPlanetSelect,
  ephemerides,
  elapsedSimDays,
  language,
  showLabels,
  showOrbits,
  showAxis,
  animationSpeed,
  isPaused,
  isDark,
  backgroundUrl,
  backgroundOpacity,
  lightPreset,
}) => {
  const backgroundTexture = useTexture(
    backgroundUrl ??
      resolveAssetUrl("./textures/sky/2k_stars.jpg") ??
      "/textures/sky/2k_stars.jpg",
  ) as THREE.Texture;
  const activeLightPreset = LIGHT_PRESETS[lightPreset] ?? LIGHT_PRESETS.normal;
  const sceneModel = useMemo(() => {
    const sun = createSunRenderModel(
      simulationBodyConfigs.find((obj) => obj.kind === "star") ?? {
        name: "Sun",
        texture: "./textures/2k_sun.jpg",
        radius: 12.1875,
        color: 0xffcc66,
        rotationSpeed: 0.12,
      },
    ) as SunRenderModel;
    const planets = simulationBodyConfigs
      .filter((obj) => obj.kind === "planet" || obj.kind === "dwarf")
      .map((obj) => createPlanetDescriptor(obj)) as PlanetRenderModel[];

    const rings = simulationBodyConfigs
      .filter(
        (obj) =>
          (obj.kind === "planet" || obj.kind === "dwarf") && obj.rings?.enabled,
      )
      .map((obj) => createRingDescriptor(obj)) as RingRenderModel[];

    //console.log("RINGS", rings);

    const belt = simulationBodyConfigs
      .filter((obj) => obj.kind === "belt")
      .map((obj) => createBeltDescriptor(obj))[0] as
      | BeltRenderModel
      | undefined;

    const ringByParent = new Map<string, RingRenderModel>();
    rings.forEach((ring) => {
      ringByParent.set(ring.parentName, ring);
    });

    const moonByParent = new Map<string, MoonRenderModel>();
    const earth = planets.find((planet) => planet.name === "Earth");
    if (earth) {
      moonByParent.set(
        "Earth",
        createEarthMoonDescriptor(earth) as MoonRenderModel,
      );
    }

    return { sun, planets, belt, ringByParent, moonByParent };
  }, []);
  const projectedEphemerides = useMemo(() => {
    const entries = SUPPORTED_EPHEMERIS_PLANET_NAMES.flatMap((bodyName) => {
      const entry = ephemerides?.[bodyName];
      if (!entry) {
        return [];
      }

      const { x, y, z } = entry.coordinates;
      const projected = projectEphemerisToScenePlane(
        x,
        y,
        z,
        EPHEMERIS_LOG_SCALE_OPTIONS,
      );

      return [[bodyName, projected] as const];
    });

    return Object.fromEntries(entries) as Partial<
      Record<
        SupportedEphemerisBodyName,
        {
          orbitalAngle: number;
          scaledRadius: number;
          position: THREE.Vector3;
        }
      >
    >;
  }, [ephemerides]);
  const projectedPlanetEphemerisOrbits = useMemo(() => {
    const entries = sceneModel.planets.flatMap((planet) => {
      const bodyName = planet.name as SupportedEphemerisBodyName;
      const projectedEphemeris = projectedEphemerides[bodyName];

      if (!projectedEphemeris) {
        return [];
      }

      const scaledRadius = FIXED_RADIUS_EPHEMERIS_PLANET_NAMES.has(bodyName)
        ? planet.orbitRadius
        : projectedEphemeris.scaledRadius;

      return [
        [
          bodyName,
          {
            baseAngle: projectedEphemeris.orbitalAngle,
            scaledRadius,
          },
        ] as const,
      ];
    });

    return Object.fromEntries(entries) as Partial<
      Record<
        SupportedEphemerisBodyName,
        { baseAngle: number; scaledRadius: number }
      >
    >;
  }, [projectedEphemerides, sceneModel.planets]);
  const moonRelativeEphemerisPosition = useMemo(() => {
    const earthProjection = projectedEphemerides.Earth;
    const moonProjection = projectedEphemerides.Moon;

    if (!earthProjection || !moonProjection) {
      return undefined;
    }

    const relativeOffset = moonProjection.position
      .clone()
      .sub(earthProjection.position);
    relativeOffset.y = 0;

    const relativeLength = relativeOffset.length();
    const fallbackMoon =
      sceneModel.moonByParent.get("Earth")?.orbitRadius ?? 0.5;

    if (!Number.isFinite(relativeLength) || relativeLength <= 0) {
      return new THREE.Vector3(fallbackMoon, 0, 0);
    }

    const clampedLength = Math.min(
      Math.max(relativeLength, fallbackMoon * 0.6),
      fallbackMoon * 1.6,
    );

    return relativeOffset.normalize().multiplyScalar(clampedLength);
  }, [projectedEphemerides, sceneModel.moonByParent]);
  const moonRelativeEphemerisOrbit = useMemo(() => {
    if (!moonRelativeEphemerisPosition) {
      return undefined;
    }

    return {
      baseAngle: Math.atan2(
        moonRelativeEphemerisPosition.z,
        moonRelativeEphemerisPosition.x,
      ),
      scaledRadius: moonRelativeEphemerisPosition.length(),
    };
  }, [moonRelativeEphemerisPosition]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <>
      <CameraSetup />

      <color attach="background" args={[isDark ? "#050505" : "#f0f4f8"]} />

      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[80, 64, 64]} />
        <meshBasicMaterial
          map={backgroundTexture}
          side={THREE.BackSide}
          transparent
          opacity={backgroundOpacity}
          depthWrite={false}
        />
      </mesh>

      <Stars
        radius={120}
        depth={80}
        count={isDark ? 5000 : 2000}
        factor={4}
        saturation={0}
        fade
        speed={0.8}
      />

      <ambientLight
        intensity={
          isDark
            ? activeLightPreset.ambientIntensity
            : activeLightPreset.ambientIntensity * 0.8
        }
        color={activeLightPreset.ambientColor}
      />

      <hemisphereLight
        intensity={activeLightPreset.cameraFillIntensity}
        color={activeLightPreset.cameraFillColor}
        groundColor={isDark ? "#1a2230" : "#bfc7d5"}
      />

      <pointLight
        position={[0, 0, 0]}
        intensity={
          isDark
            ? activeLightPreset.sunIntensity
            : activeLightPreset.sunIntensity * 0.6
        }
        distance={220}
        decay={activeLightPreset.sunLightDecay}
        color={activeLightPreset.sunLightColor}
      />

      <directionalLight
        position={[18, 10, 14]}
        intensity={isDark ? 0.9 : 0.45}
        color="#ffffff"
      />

      <SunNode
        sun={sceneModel.sun}
        // sunMeshRef={sunMeshRef}
        language={language}
        showLabels={showLabels}
        showAxis={showAxis}
        isDark={isDark}
        animationSpeed={animationSpeed}
        isPaused={isPaused}
        onSelect={onPlanetSelect}
      />

      {sceneModel.belt && (
        <AsteroidBeltNode
          belt={sceneModel.belt}
          animationSpeed={animationSpeed}
          isPaused={isPaused}
          lightPresetConfig={activeLightPreset}
        />
      )}

      {sceneModel.planets.map((planet) => (
        <PlanetNode
          key={planet.name}
          // sunMeshRef={sunMeshRef}
          // sunOcclusionReady={sunOcclusionReady}
          planet={planet}
          ring={sceneModel.ringByParent.get(planet.name)}
          moon={sceneModel.moonByParent.get(planet.name)}
          ephemerisPosition={
            projectedEphemerides[planet.name as SupportedEphemerisBodyName]
              ?.position
          }
          ephemerisOrbit={
            projectedPlanetEphemerisOrbits[
              planet.name as SupportedEphemerisBodyName
            ]
          }
          orbitRadiusOverride={
            FIXED_RADIUS_EPHEMERIS_PLANET_NAMES.has(
              planet.name as SupportedEphemerisBodyName,
            )
              ? undefined
              : projectedEphemerides[
                  planet.name as SupportedEphemerisBodyName
                ]?.position.length()
          }
          moonEphemerisPosition={
            planet.name === "Earth" ? moonRelativeEphemerisPosition : undefined
          }
          moonEphemerisOrbit={
            planet.name === "Earth" ? moonRelativeEphemerisOrbit : undefined
          }
          language={language}
          elapsedSimDays={elapsedSimDays}
          showLabels={showLabels}
          showOrbits={showOrbits}
          showAxis={showAxis}
          animationSpeed={animationSpeed}
          isPaused={isPaused}
          isDark={isDark}
          lightPresetConfig={activeLightPreset}
          onSelect={onPlanetSelect}
        />
      ))}

      <OrbitControls enablePan={true} minDistance={8} maxDistance={100} />
    </>
  );
};
