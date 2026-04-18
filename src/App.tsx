import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Play,
  Pause,
  Globe,
  Calendar as CalendarIcon,
  Video,
  Info,
  Sun,
  Moon,
  Music,
  HelpCircle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Orbit,
  Image as ImageIcon,
} from "lucide-react";
import { Scene } from "./components/Scene";
import { DatePickerModal } from "./components/DatePickerModal";
import { cn } from "./lib/utils";
import { getPlanetInfo } from "../data/planetInfodata.js";
import { resolveAssetUrl } from "../objects/sceneObjectUtils.js";
import {
  fetchEphemeridesForDate,
  type BodyEphemeris,
  type SupportedEphemerisBodyName,
} from "./services/ephemerisService";

const planetDrawerTranslations = {
  EN: {
    drawerTitle: "PLANET INFO",
    selectedObject: "Selected object",
    noSelection: "No selection",
    noSelectionHint: "Select a planet to view information",
    overview: "Overview",
    emptyOverview:
      "Select a planet in the scene to populate this drawer with its information.",
    extendedMetrics: "EXTENDED_METRICS",
    fieldLabels: {
      mass: "Mass",
      equatorialRadius: "Radius",
      density: "Density",
      volume: "Volume",
      orbitalPeriod: "Orbital Period",
      orbitalInclination: "Orbital inclination",
      orbitalAscendingNode: "Longitude of ascending node",
      rotationPeriod: "Rotation Period",
      distanceFromSun: "Distance from Sun",
      albedo: "Albedo",
      gravity: "Gravity",
      escapeVelocity: "Escape Velocity",
      meanTemperature: "Mean Temperature",
      minTemperature: "Min Temperature",
      maxTemperature: "Max Temperature",
      moons: "Moons",
    },
    earthWord: "Earth",
    auUnit: "AU",
  },
  FR: {
    drawerTitle: "PLANÈTES INFOS",
    selectedObject: "Objet sélectionné",
    noSelection: "Aucune sélection",
    noSelectionHint: "Sélectionnez une planète pour voir les infos",
    overview: "Aperçu",
    emptyOverview:
      "Sélectionnez une planète dans la scène pour afficher ses informations ici.",
    extendedMetrics: "MESURES_AVANCÉES",
    fieldLabels: {
      mass: "Masse",
      equatorialRadius: "Rayon équatorial",
      density: "Densité",
      volume: "Volume",
      orbitalPeriod: "Période orbitale",
      orbitalInclination: "Inclinaison orbitale",
      orbitalAscendingNode: "Longitude du nœud ascendant",

      rotationPeriod: "Période de rotation",
      distanceFromSun: "Distance au Soleil",
      albedo: "Albédo",
      gravity: "Gravité",
      escapeVelocity: "Vitesse de libération",
      meanTemperature: "Température moyenne",
      minTemperature: "Température min",
      maxTemperature: "Température max",
      moons: "Lunes",
    },
    earthWord: "Terre",
    auUnit: "UA",
  },
} as const;

const missionControlTranslations = {
  EN: {
    title: "MISSION CONTROL",
    audioTrack: "AUDIO TRACK",
    systemAudio: "SYSTEM AUDIO",
    orbitPath: "ORBIT PATH",
    axialGuides: "AXIAL GUIDE",
    dataLabels: "PLANET LABEL",
    temporalFlux: "TEMPORAL FLUX",
    resume: "RESUME",
    pause: "PAUSE",
    skyBackground: "SKY BACKGROUND",
    backgroundOpacity: "BACKGROUND OPACITY",
    illumination: "ILLUMINATION",
    scientific: "SCIENTIFIC",
    cinematic: "CINEMATIC",
    boost: "BOOST",
    musicTracks: {
      ambientVoid: "AMBIENT VOID",
      cosmicDrift: "COSMIC DRIFT",
      stellarWind: "STELLAR WIND",
      nebulaMist: "NEBULA MIST",
      deepSpace: "DEEP SPACE",
    },
    backgrounds: {
      stars2k: "STARS 2K",
      nebula40: "NEBULA 40",
      nebula47: "NEBULA 47",
      nebula57: "NEBULA 57",
      galaxy83: "GALAXY 83",
      void98: "VOID 98",
    },
  },
  FR: {
    title: "CONTRÔLE MISSION",
    audioTrack: "PISTE AUDIO",
    systemAudio: "SON",
    orbitPath: "ORBITES",
    axialGuides: "AXES DE ROTATION",
    dataLabels: "NOM PLANÈTE",
    temporalFlux: "FLUX TEMPOREL",
    resume: "LECTURE",
    pause: "PAUSE",
    skyBackground: "FOND CÉLESTE",
    backgroundOpacity: "OPACITÉ DU FOND",
    illumination: "ÉCLAIRAGE",
    scientific: "SCIENTIFIQUE",
    cinematic: "CINÉMATIQUE",
    boost: "BOOST",
    musicTracks: {
      ambientVoid: "VIDE AMBIANT",
      cosmicDrift: "DÉRIVE COSMIQUE",
      stellarWind: "VENT STELLAIRE",
      nebulaMist: "BRUME NÉBULEUSE",
      deepSpace: "ESPACE PROFOND",
    },
    backgrounds: {
      stars2k: "ÉTOILES 2K",
      nebula40: "NÉBULEUSE 40",
      nebula47: "NÉBULEUSE 47",
      nebula57: "NÉBULEUSE 57",
      galaxy83: "GALAXIE 83",
      void98: "VIDE 98",
    },
  },
} as const;

const EPHEMERIS_BODY_NAMES: SupportedEphemerisBodyName[] = [
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
const MILLISECONDS_PER_DAY = 86400000;

/* const planetDrawerFieldConfig = [
  { key: "mass", compareKey: "massVsEarth" },
  { key: "equatorialRadius", compareKey: "radiusVsEarth" },
  { key: "density", compareKey: "densityVsEarth" },
  { key: "volume", compareKey: "volumeVsEarth" },
  { key: "orbitalPeriod" },
  { key: "rotationPeriod" },
  {
    key: "distanceFromSun",
    compareKey: "distanceVsEarth",
    auKey: "distanceAu",
  },
  { key: "albedo" },
  { key: "gravity", compareKey: "gravityVsEarth" },
  { key: "escapeVelocity", compareKey: "escapeVelocityVsEarth" },
  { key: "meanTemperature" },
  { key: "minTemperature" },
  { key: "maxTemperature" },
  { key: "moons" },
] as const; */
const planetDrawerFieldConfig = [
  { key: "mass", compareKey: "massVsEarth" },
  { key: "equatorialRadius", compareKey: "radiusVsEarth" },
  { key: "density", compareKey: "densityVsEarth" },
  { key: "volume", compareKey: "volumeVsEarth" },
  { key: "orbitalPeriod" },
  { key: "orbitalInclination" },
  { key: "orbitalAscendingNode" },
  { key: "rotationPeriod" },
  {
    key: "distanceFromSun",
    compareKey: "distanceVsEarth",
    auKey: "distanceAu",
  },
  { key: "albedo" },
  { key: "gravity", compareKey: "gravityVsEarth" },
  { key: "escapeVelocity", compareKey: "escapeVelocityVsEarth" },
  { key: "meanTemperature" },
  { key: "minTemperature" },
  { key: "maxTemperature" },
  { key: "moons" },
] as const;
type Language = keyof typeof planetDrawerTranslations;
type PlanetDrawerFieldKey = (typeof planetDrawerFieldConfig)[number]["key"];

function formatAngle(
  value: number | null | undefined,
  unit: string | null | undefined,
  language: "EN" | "FR",
) {
  if (value == null || !unit) return null;

  if (unit === "deg") {
    const formatted = Number(value)
      .toFixed(3)
      .replace(/\.?0+$/, "");
    return `${formatted}°`;
  }

  return null;
}

const getLocalizedPlanetText = (
  value: string | { EN: string; FR: string } | undefined,
  language: Language,
) => {
  if (!value) return "";
  return typeof value === "string" ? value : (value[language] ?? value.EN);
};

const formatLocalizedNumber = (
  value: number,
  language: Language,
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
) =>
  new Intl.NumberFormat(language === "EN" ? "en-US" : "fr-FR", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);

const toNumericValue = (
  value: number | string | { EN: string; FR: string } | null | undefined,
  language: Language,
): number | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const raw =
    typeof value === "string"
      ? value
      : (value[language] ?? value.EN ?? "").toString();

  const normalized = raw.replace(",", ".").trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};

const formatEarthComparison = (
  value: number | string | { EN: string; FR: string } | null | undefined,
  language: Language,
) => {
  if (value === null || value === undefined) return null;

  const numericValue = toNumericValue(value, language);

  if (numericValue === null) {
    if (typeof value === "object" && value !== null && "EN" in value) {
      return value[language] ?? value.EN;
    }
    return String(value);
  }

  return `≈ ${formatLocalizedNumber(numericValue, language, 0, 3)}× ${
    planetDrawerTranslations[language].earthWord
  }`;
};

const formatAuComparison = (
  value: number | string | { EN: string; FR: string } | null | undefined,
  language: Language,
) => {
  if (value === null || value === undefined) return null;

  const numericValue = toNumericValue(value, language);

  if (numericValue === null) {
    if (typeof value === "object" && value !== null && "EN" in value) {
      return value[language] ?? value.EN;
    }
    return String(value);
  }

  return `≈ ${formatLocalizedNumber(numericValue, language, 2, 2)} ${
    planetDrawerTranslations[language].auUnit
  }`;
};

const formatStructuredMetric = (
  value: number | null | undefined,
  unit: string | null | undefined,
  language: Language,
) => {
  if (value === null || value === undefined || !unit) return null;

  switch (unit) {
    case "m/s²":
    case "km/s":
      return `${formatLocalizedNumber(value, language, 0, 2)} ${unit}`;
    case "g/cm3":
      return `${formatLocalizedNumber(value, language, 0, 2)} g/cm³`;
    case "km":
      return `${formatLocalizedNumber(value, language, 0, 2)} km`;
    case "million_km":
      return language === "EN"
        ? `${formatLocalizedNumber(value, language, 0, 2)} million km`
        : `${formatLocalizedNumber(value, language, 0, 2)} millions de km`;
    case "billion_km":
      return language === "EN"
        ? `${formatLocalizedNumber(value, language, 0, 2)} billion km`
        : `${formatLocalizedNumber(value, language, 0, 2)} milliards de km`;
    default:
      return `${formatLocalizedNumber(value, language, 0, 2)} ${unit}`;
  }
};

const formatScientificMetric = (
  value: number | null | undefined,
  exponent: number | null | undefined,
  suffix: string,
  language: Language,
) => {
  if (
    value === null ||
    value === undefined ||
    exponent === null ||
    exponent === undefined
  ) {
    return null;
  }

  return `${formatLocalizedNumber(value, language, 0, 4)} × 10^${exponent} ${suffix}`;
};

const formatOrbitalPeriod = (
  value: number | null | undefined,
  unit: string | null | undefined,
  language: Language,
  approxYears?: number | null,
) => {
  if (value === null || value === undefined || !unit) return null;

  if (unit === "days") {
    return `${formatLocalizedNumber(value, language, 0, 2)} ${
      language === "EN" ? "days" : "jours"
    }`;
  }

  if (unit === "days_years") {
    const days = `${formatLocalizedNumber(value, language, 0, 2)} ${
      language === "EN" ? "days" : "jours"
    }`;

    if (approxYears === null || approxYears === undefined) {
      return days;
    }

    return `${days} (~${formatLocalizedNumber(approxYears, language, 0, 2)} ${
      language === "EN" ? "years" : "ans"
    })`;
  }

  return null;
};

const getStructuredDrawerValue = (
  planetInfo: NonNullable<ReturnType<typeof getPlanetInfo>>,
  key: PlanetDrawerFieldKey,
  language: Language,
) => {
  if (key === "mass") {
    return (
      formatScientificMetric(
        planetInfo.massValue,
        planetInfo.massExponent,
        "kg",
        language,
      ) ?? planetInfo.mass
    );
  }

  if (key === "density") {
    return (
      formatStructuredMetric(
        planetInfo.densityValue,
        planetInfo.densityUnit,
        language,
      ) ?? planetInfo.density
    );
  }

  if (key === "equatorialRadius") {
    return (
      formatStructuredMetric(
        planetInfo.equatorialRadiusValue,
        planetInfo.equatorialRadiusUnit,
        language,
      ) ?? planetInfo.equatorialRadius
    );
  }

  if (key === "volume") {
    return (
      formatScientificMetric(
        planetInfo.volumeValue,
        planetInfo.volumeExponent,
        "km³",
        language,
      ) ?? planetInfo.volume
    );
  }

  if (key === "orbitalPeriod") {
    return (
      formatOrbitalPeriod(
        planetInfo.orbitalPeriodValue,
        planetInfo.orbitalPeriodUnit,
        language,
        planetInfo.orbitalPeriodApproxYears,
      ) ?? planetInfo.orbitalPeriod
    );
  }
  if (key === "orbitalInclination") {
    return (
      formatAngle(
        planetInfo.orbitalInclinationValue,
        planetInfo.orbitalInclinationUnit,
        language,
      ) ?? planetInfo.orbitalInclination
    );
  }

  if (key === "orbitalAscendingNode") {
    return (
      formatAngle(
        planetInfo.orbitalAscendingNodeValue,
        planetInfo.orbitalAscendingNodeUnit,
        language,
      ) ?? planetInfo.orbitalAscendingNode
    );
  }

  if (key === "gravity") {
    return (
      formatStructuredMetric(
        planetInfo.gravityValue,
        planetInfo.gravityUnit,
        language,
      ) ?? planetInfo.gravity
    );
  }

  if (key === "escapeVelocity") {
    return (
      formatStructuredMetric(
        planetInfo.escapeVelocityValue,
        planetInfo.escapeVelocityUnit,
        language,
      ) ?? planetInfo.escapeVelocity
    );
  }

  if (key === "distanceFromSun") {
    return (
      formatStructuredMetric(
        planetInfo.distanceFromSunValue,
        planetInfo.distanceFromSunUnit,
        language,
      ) ?? planetInfo.distanceFromSun
    );
  }

  return planetInfo[key as keyof typeof planetInfo];
};

export default function App() {
  const [isPaused, setIsPaused] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showAxis, setShowAxis] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [lightPreset, setLightPreset] = useState<
    "normal" | "cinematic" | "boost"
  >("normal");
  const [language, setLanguage] = useState<"EN" | "FR">("EN");

  // Date used for ephemerides fetch only
  const [ephemerisDate, setEphemerisDate] = useState(() => new Date());

  // Date displayed and animated in the UI
  const [displayDate, setDisplayDate] = useState(() => new Date());

  const [isDark, setIsDark] = useState(true);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);

  const backgroundImages = [
    {
      name: {
        EN: missionControlTranslations.EN.backgrounds.stars2k,
        FR: missionControlTranslations.FR.backgrounds.stars2k,
      },
      url: resolveAssetUrl("/images/sky/2k_stars.jpg"),
    },
    {
      name: {
        EN: missionControlTranslations.EN.backgrounds.nebula40,
        FR: missionControlTranslations.FR.backgrounds.nebula40,
      },
      url: resolveAssetUrl("/images/sky/64040.jpg"),
    },
    {
      name: {
        EN: missionControlTranslations.EN.backgrounds.nebula47,
        FR: missionControlTranslations.FR.backgrounds.nebula47,
      },
      url: resolveAssetUrl("/images/sky/64047.jpg"),
    },
    {
      name: {
        EN: missionControlTranslations.EN.backgrounds.nebula57,
        FR: missionControlTranslations.FR.backgrounds.nebula57,
      },
      url: resolveAssetUrl("/images/sky/64057.jpg"),
    },
    {
      name: {
        EN: missionControlTranslations.EN.backgrounds.galaxy83,
        FR: missionControlTranslations.FR.backgrounds.galaxy83,
      },
      url: resolveAssetUrl("/images/sky/64183.jpg"),
    },
    {
      name: {
        EN: missionControlTranslations.EN.backgrounds.void98,
        FR: missionControlTranslations.FR.backgrounds.void98,
      },
      url: resolveAssetUrl("/images/sky/64198.jpg"),
    },
  ];

  const [wasMusicOnBeforeHover, setWasMusicOnBeforeHover] = useState(false);
  const [currentMusicIndex, setCurrentMusicIndex] = useState(0);

  const musicTracks = [
    {
      name: {
        EN: missionControlTranslations.EN.musicTracks.ambientVoid,
        FR: missionControlTranslations.FR.musicTracks.ambientVoid,
      },
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      name: {
        EN: missionControlTranslations.EN.musicTracks.cosmicDrift,
        FR: missionControlTranslations.FR.musicTracks.cosmicDrift,
      },
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      name: {
        EN: missionControlTranslations.EN.musicTracks.stellarWind,
        FR: missionControlTranslations.FR.musicTracks.stellarWind,
      },
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
      name: {
        EN: missionControlTranslations.EN.musicTracks.nebulaMist,
        FR: missionControlTranslations.FR.musicTracks.nebulaMist,
      },
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
    {
      name: {
        EN: missionControlTranslations.EN.musicTracks.deepSpace,
        FR: missionControlTranslations.FR.musicTracks.deepSpace,
      },
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    },
  ];

  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [selectedPlanetName, setSelectedPlanetName] = useState<string | null>(
    null,
  );
  const [ephemerides, setEphemerides] = useState<
    Partial<Record<SupportedEphemerisBodyName, BodyEphemeris>>
  >({});

  const [isSystemControlsHovered, setIsSystemControlsHovered] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const drawerSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const isFirstRun = React.useRef(true);

  const handleApplySimulationDate = (date: Date) => {
    setEphemerisDate(date);
    setDisplayDate(date);
  };

  useEffect(() => {
    if (isVideoHovered) {
      if (isMusicOn) {
        setWasMusicOnBeforeHover(true);
        setIsMusicOn(false);
      }
    } else if (wasMusicOnBeforeHover) {
      setIsMusicOn(true);
      setWasMusicOnBeforeHover(false);
    }
  }, [isVideoHovered, isMusicOn, wasMusicOnBeforeHover]);

  useEffect(() => {
    drawerSoundRef.current = new Audio(
      resolveAssetUrl("/audio/sounds/mixkit-sci-fi-error-alert-898.wav") ??
        "/audio/sounds/mixkit-sci-fi-error-alert-898.wav",
    );
    drawerSoundRef.current.volume = 0.5;
  }, []);

  const playDrawerSound = () => {
    if (drawerSoundRef.current) {
      drawerSoundRef.current.currentTime = 0;
      drawerSoundRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    playDrawerSound();
  }, [
    isInspectorOpen,
    isDatePickerOpen,
    isVideoHovered,
    isSystemControlsHovered,
  ]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isMusicOn) {
      audioRef.current
        .play()
        .catch((err) => console.log("Autoplay blocked:", err));
    } else {
      audioRef.current.pause();
    }
  }, [isMusicOn, currentMusicIndex]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isVideoHovered) {
      videoRef.current
        .play()
        .catch((err) => console.log("Video play failed:", err));
    } else {
      videoRef.current.pause();
    }
  }, [isVideoHovered]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted;
    }
  }, [isVideoMuted]);

  // Animated display date for the top-right indicator only
  useEffect(() => {
    if (isPaused) return;

    const interval = window.setInterval(() => {
      setDisplayDate((prev) => {
        const next = new Date(prev);
        next.setTime(next.getTime() + 86400000 * animationSpeed * 0.2);
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isPaused, animationSpeed]);

  const formattedDate = displayDate.toLocaleDateString(
    language === "EN" ? "en-US" : "fr-FR",
    {
      ...(isPaused ? { weekday: "long" as const } : {}),
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Fetch ephemerides only when the applied scientific date changes
  useEffect(() => {
    let isCancelled = false;

    fetchEphemeridesForDate(ephemerisDate, EPHEMERIS_BODY_NAMES)
      .then((nextEphemerides) => {
        if (!isCancelled) {
          setEphemerides(nextEphemerides);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error("[ephemeris] fetch failed", error);
          setEphemerides({});
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [ephemerisDate]);

  const elapsedSimDays =
    (displayDate.getTime() - ephemerisDate.getTime()) / MILLISECONDS_PER_DAY;

  const selectedPlanetInfo = selectedPlanetName
    ? getPlanetInfo(selectedPlanetName)
    : null;

  const drawerCopy = planetDrawerTranslations[language];
  const missionControlCopy = missionControlTranslations[language];

  const closeInspector = () => {
    setIsInspectorOpen(false);
    setSelectedPlanetName(null);
  };

  const infoFields = selectedPlanetInfo
    ? planetDrawerFieldConfig.map((field) => ({
        key: field.key,
        label: drawerCopy.fieldLabels[field.key as PlanetDrawerFieldKey],
        value: getStructuredDrawerValue(
          selectedPlanetInfo,
          field.key,
          language,
        ),
        comparison:
          "compareKey" in field
            ? formatEarthComparison(
                selectedPlanetInfo[
                  field.compareKey as keyof typeof selectedPlanetInfo
                ] as
                  | string
                  | number
                  | { EN: string; FR: string }
                  | null
                  | undefined,
                language,
              )
            : null,
        extra:
          "auKey" in field
            ? formatAuComparison(
                selectedPlanetInfo[
                  field.auKey as keyof typeof selectedPlanetInfo
                ] as
                  | string
                  | number
                  | { EN: string; FR: string }
                  | null
                  | undefined,
                language,
              )
            : null,
      }))
    : [];

  return (
    <div
      className={cn(
        "relative h-screen w-full overflow-hidden transition-colors duration-500",
        isDark ? "bg-[#050505]" : "bg-mist-bg",
      )}
    >
      <div className="absolute inset-0 watercolor-mist pointer-events-none z-1" />

      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          gl={{ antialias: true }}
          camera={{ position: [0, 0, 10], fov: 45 }}
        >
          <Scene
            onPlanetSelect={(planetName) => {
              setSelectedPlanetName(planetName);
              setIsInspectorOpen(true);
            }}
            elapsedSimDays={elapsedSimDays}
            ephemerides={ephemerides}
            language={language}
            showLabels={showLabels}
            showOrbits={showOrbits}
            showAxis={showAxis}
            animationSpeed={animationSpeed}
            isPaused={isPaused}
            isDark={isDark}
            backgroundUrl={backgroundImages[currentBackgroundIndex].url}
            backgroundOpacity={backgroundOpacity}
            lightPreset={lightPreset}
          />
        </Canvas>
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button
          onMouseEnter={() => setIsDatePickerOpen(true)}
          className={cn(
            "glass-panel p-2.5 rounded-full transition-all group relative",
            isDark
              ? "hover:bg-gold-neon hover:text-black"
              : "hover:bg-mist-primary hover:text-white",
          )}
        >
          <CalendarIcon size={16} />
        </button>

        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 text-xs font-bold",
              isDark ? "text-white/40" : "text-black/40",
            )}
          >
            <CalendarIcon
              size={14}
              className={isDark ? "text-gold-neon" : "text-mist-primary"}
            />
            <span
              className={cn(
                isDark
                  ? "text-white neon-text-gold"
                  : "text-black neon-text-none",
              )}
            >
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      <div
        className="absolute top-6 left-6 z-50 w-72"
        onMouseEnter={() => setIsSystemControlsHovered(true)}
        onMouseLeave={() => setIsSystemControlsHovered(false)}
      >
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            height: isSystemControlsHovered ? "auto" : "56px",
          }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className={cn(
            "glass-panel rounded-2xl p-5 space-y-6 overflow-hidden",
            !isDark && "bg-white/40",
          )}
        >
          <div className="flex items-center justify-between h-6">
            <h2
              className={cn(
                "text-sm font-bold tracking-[0.2em] flex items-center gap-2",
                isDark ? "text-white/60" : "text-black/60",
              )}
            >
              <Orbit
                size={16}
                className={isDark ? "text-gold-neon" : "text-mist-primary"}
              />
              {missionControlCopy.title}
            </h2>
            <Settings
              size={16}
              className={cn(
                "transition-transform duration-500",
                isSystemControlsHovered ? "rotate-90" : "rotate-0",
                isDark ? "text-white/20" : "text-black/20",
              )}
            />
          </div>

          <motion.div
            animate={{ opacity: isSystemControlsHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music
                      size={14}
                      className={
                        isDark ? "text-gold-neon" : "text-mist-primary"
                      }
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold tracking-widest",
                        isDark ? "text-white/40" : "text-black/40",
                      )}
                    >
                      {missionControlCopy.audioTrack}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      isDark ? "text-gold-neon" : "text-mist-primary",
                    )}
                  >
                    {getLocalizedPlanetText(
                      musicTracks[currentMusicIndex].name,
                      language,
                    )}
                  </span>
                </div>
                <div className="flex gap-1">
                  {musicTracks.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentMusicIndex(idx)}
                      className={cn(
                        "flex-1 h-1 rounded-full transition-all",
                        currentMusicIndex === idx
                          ? isDark
                            ? "bg-gold-neon shadow-[0_0_8px_rgba(255,215,0,0.5)]"
                            : "bg-mist-primary"
                          : isDark
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-black/10 hover:bg-black/20",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMusicOn ? (
                    <Volume2
                      size={14}
                      className={
                        isDark ? "text-gold-neon" : "text-mist-primary"
                      }
                    />
                  ) : (
                    <VolumeX
                      size={14}
                      className={isDark ? "text-white/20" : "text-black/20"}
                    />
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-widest",
                      isDark ? "text-white/40" : "text-black/40",
                    )}
                  >
                    {missionControlCopy.systemAudio}
                  </span>
                </div>
                <div
                  onClick={() => {
                    setIsMusicOn(!isMusicOn);
                    setWasMusicOnBeforeHover(false);
                  }}
                  className={cn(
                    "w-8 h-4 rounded-full relative cursor-pointer transition-all duration-300",
                    isMusicOn
                      ? isDark
                        ? "bg-gold-neon/40"
                        : "bg-mist-primary/40"
                      : isDark
                        ? "bg-white/10"
                        : "bg-black/10",
                  )}
                >
                  <motion.div
                    animate={{ x: isMusicOn ? 16 : 2 }}
                    className={cn(
                      "absolute top-1 w-2 h-2 rounded-full",
                      isMusicOn
                        ? isDark
                          ? "bg-gold-neon neon-glow-gold"
                          : "bg-mist-primary"
                        : isDark
                          ? "bg-white/40"
                          : "bg-black/40",
                    )}
                  />
                </div>
              </div>
            </div>

            <div className={cn("h-px", isDark ? "bg-white/5" : "bg-black/5")} />

            <div className="space-y-3">
              <ControlToggle
                label={missionControlCopy.orbitPath}
                active={showOrbits}
                onClick={() => setShowOrbits(!showOrbits)}
                isDark={isDark}
              />
              <ControlToggle
                label={missionControlCopy.axialGuides}
                active={showAxis}
                onClick={() => setShowAxis(!showAxis)}
                isDark={isDark}
              />
              <ControlToggle
                label={missionControlCopy.dataLabels}
                active={showLabels}
                onClick={() => setShowLabels(!showLabels)}
                isDark={isDark}
              />
            </div>

            <div className={cn("h-px", isDark ? "bg-white/5" : "bg-black/5")} />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[10px] font-bold tracking-widest",
                    isDark ? "text-white/40" : "text-black/40",
                  )}
                >
                  {missionControlCopy.temporalFlux}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    isDark ? "text-gold-neon" : "text-mist-primary",
                  )}
                >
                  {animationSpeed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className={cn(
                  "w-full h-1 rounded-lg appearance-none cursor-pointer",
                  isDark
                    ? "bg-white/10 accent-gold-neon"
                    : "bg-black/10 accent-mist-primary",
                )}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all",
                    isPaused
                      ? isDark
                        ? "bg-gold-neon text-black neon-glow-gold"
                        : "bg-mist-primary text-white shadow-lg"
                      : isDark
                        ? "bg-white/5 text-white hover:bg-white/10"
                        : "bg-black/5 text-black hover:bg-black/10",
                  )}
                >
                  {isPaused ? (
                    <Play size={14} fill="currentColor" />
                  ) : (
                    <Pause size={14} fill="currentColor" />
                  )}
                  {isPaused
                    ? missionControlCopy.resume
                    : missionControlCopy.pause}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon
                      size={14}
                      className={
                        isDark ? "text-gold-neon" : "text-mist-primary"
                      }
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold tracking-widest",
                        isDark ? "text-white/40" : "text-black/40",
                      )}
                    >
                      {missionControlCopy.skyBackground}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      isDark ? "text-gold-neon" : "text-mist-primary",
                    )}
                  >
                    {getLocalizedPlanetText(
                      backgroundImages[currentBackgroundIndex].name,
                      language,
                    )}
                  </span>
                </div>
                <div className="flex gap-1">
                  {backgroundImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBackgroundIndex(idx)}
                      className={cn(
                        "flex-1 h-1 rounded-full transition-all",
                        currentBackgroundIndex === idx
                          ? isDark
                            ? "bg-gold-neon shadow-[0_0_8px_rgba(255,215,0,0.5)]"
                            : "bg-mist-primary"
                          : isDark
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-black/10 hover:bg-black/20",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-widest",
                      isDark ? "text-white/40" : "text-black/40",
                    )}
                  >
                    {missionControlCopy.backgroundOpacity}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      isDark ? "text-gold-neon" : "text-mist-primary",
                    )}
                  >
                    {Math.round(backgroundOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={backgroundOpacity}
                  onChange={(e) =>
                    setBackgroundOpacity(parseFloat(e.target.value))
                  }
                  className={cn(
                    "w-full h-1 rounded-lg appearance-none cursor-pointer",
                    isDark
                      ? "bg-white/10 accent-gold-neon"
                      : "bg-black/10 accent-mist-primary",
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              <span
                className={cn(
                  "text-[10px] font-bold tracking-widest",
                  isDark ? "text-white/40" : "text-black/40",
                )}
              >
                {missionControlCopy.illumination}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLightPreset("normal")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border",
                    lightPreset === "normal"
                      ? isDark
                        ? "border-gold-neon/50 bg-gold-neon/10 text-gold-neon"
                        : "border-mist-primary/50 bg-mist-primary/10 text-mist-primary"
                      : isDark
                        ? "border-white/5 bg-white/5 text-white/40"
                        : "border-black/5 bg-black/5 text-black/40",
                  )}
                >
                  <Moon size={12} /> {missionControlCopy.scientific}
                </button>
                <button
                  onClick={() => setLightPreset("cinematic")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border",
                    lightPreset === "cinematic"
                      ? isDark
                        ? "border-gold-neon/50 bg-gold-neon/10 text-gold-neon"
                        : "border-mist-primary/50 bg-mist-primary/10 text-mist-primary"
                      : isDark
                        ? "border-white/5 bg-white/5 text-white/40"
                        : "border-black/5 bg-black/5 text-black/40",
                  )}
                >
                  <Sun size={12} /> {missionControlCopy.cinematic}
                </button>
                <button
                  onClick={() => setLightPreset("boost")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border",
                    lightPreset === "boost"
                      ? isDark
                        ? "border-gold-neon/50 bg-gold-neon/10 text-gold-neon"
                        : "border-mist-primary/50 bg-mist-primary/10 text-mist-primary"
                      : isDark
                        ? "border-white/5 bg-white/5 text-white/40"
                        : "border-black/5 bg-black/5 text-black/40",
                  )}
                >
                  <Sun size={12} /> {missionControlCopy.boost}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-[calc(1.5rem+64px+1rem)] left-6 z-40 flex flex-col gap-3">
        <button
          onClick={() => setIsDark(!isDark)}
          className={cn(
            "glass-panel w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110",
            isDark
              ? "text-gold-neon hover:bg-white/10"
              : "text-mist-primary hover:bg-black/5",
          )}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Moon size={18} fill="currentColor" /> : <Sun size={18} />}
        </button>
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement
                .requestFullscreen()
                .catch((e) => console.error(e));
            } else {
              document.exitFullscreen();
            }
          }}
          className={cn(
            "glass-panel w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110",
            isDark
              ? "text-white hover:bg-white/10"
              : "text-black hover:bg-black/5",
          )}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button
          onClick={() => setLanguage((l) => (l === "EN" ? "FR" : "EN"))}
          className={cn(
            "glass-panel w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter transition-all hover:scale-110",
            isDark
              ? "text-white hover:text-gold-neon"
              : "text-black hover:text-mist-primary",
          )}
        >
          {language}
        </button>
      </div>

      <div className="absolute bottom-6 left-6 z-50">
        <div
          onMouseEnter={() => {
            setIsVideoHovered(true);
            setIsVideoMuted(false);
          }}
          onMouseLeave={() => setIsVideoHovered(false)}
          className="relative"
        >
          <motion.div
            animate={{
              height: isVideoHovered ? 720 : 64,
              width: isVideoHovered ? 340 : 64,
            }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="glass-panel rounded-2xl overflow-hidden relative group cursor-pointer"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Video
                size={24}
                className={cn(
                  "transition-opacity",
                  isVideoHovered ? "opacity-0" : "opacity-100",
                )}
              />
            </div>

            <AnimatePresence>
              {isVideoHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full flex flex-col"
                >
                  <div
                    className={cn(
                      "px-4 py-2 flex items-center justify-between border-b",
                      isDark
                        ? "bg-white/5 border-white/10"
                        : "bg-black/5 border-black/10",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-bold tracking-widest uppercase",
                        isDark ? "text-gold-neon" : "text-mist-primary",
                      )}
                    >
                      {language === "EN"
                        ? "Author's Note"
                        : "Le mot de l'auteur"}
                    </span>
                    <Video
                      size={12}
                      className={isDark ? "text-white/20" : "text-black/20"}
                    />
                  </div>

                  <div className="flex-1 bg-black relative overflow-hidden">
                    <video
                      ref={videoRef}
                      src="https://ahp.li/5340f53ecc6e13c17c05.mp4"
                      autoPlay
                      loop
                      playsInline
                      muted={isVideoMuted}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className={cn("p-4", !isDark && "bg-mist-surface")}>
                    <h2
                      className={cn(
                        "text-xs font-bold leading-tight mb-1",
                        isDark ? "text-white" : "text-black",
                      )}
                    >
                      {language === "EN"
                        ? "A giant leap for me, a small step for mankind"
                        : "un grand pas pour moi un petit pas pour l'humanité"}
                    </h2>
                    <p
                      className={cn(
                        "text-[9px] uppercase tracking-tighter opacity-40",
                        isDark ? "text-white" : "text-black",
                      )}
                    >
                      {language === "EN"
                        ? "TRANSMISSION_STABLE"
                        : "FLUX_STABLE"}{" "}
                      // 04:20:00
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <motion.aside
        id="planetInfoDrawer"
        initial="closed"
        animate={isInspectorOpen ? "open" : "closed"}
        variants={{
          closed: {
            width: 64,
            height: 64,
            borderRadius: "16px",
            x: 0,
            y: 0,
            transition: {
              type: "spring",
              damping: 25,
              stiffness: 200,
              delay: 0.2,
            },
          },
          open: {
            width: 600,
            height: 800,
            borderRadius: "24px",
            x: 0,
            y: 0,
            transition: {
              height: { type: "spring", damping: 25, stiffness: 120 },
              width: {
                type: "spring",
                damping: 25,
                stiffness: 120,
                delay: 0.3,
              },
            },
          },
        }}
        onMouseEnter={() => setIsInspectorOpen(true)}
        onMouseLeave={closeInspector}
        onClick={closeInspector}
        className={cn(
          "planet-info-drawer fixed bottom-6 right-6 z-50 glass-panel overflow-hidden cursor-pointer",
          !isInspectorOpen &&
            "is-empty hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]",
        )}
      >
        <AnimatePresence>
          {!isInspectorOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="relative">
                <Globe
                  size={24}
                  className={isDark ? "text-gold-neon" : "text-mist-primary"}
                />
                <HelpCircle
                  size={12}
                  className="absolute -top-1 -right-1 text-white bg-black rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ opacity: isInspectorOpen ? 1 : 0 }}
          transition={{ duration: 0.2, delay: isInspectorOpen ? 0.5 : 0 }}
          className="h-full flex flex-col"
        >
          <div className="planet-info-handle h-12 flex items-center px-6 border-b border-white/10">
            <span
              className={cn(
                "text-xs font-bold tracking-widest",
                isDark ? "text-white" : "text-black",
              )}
            >
              {drawerCopy.drawerTitle}
            </span>
          </div>

          <div className="planet-info-card flex-1 flex flex-col overflow-hidden">
            <div
              className={cn(
                "planet-info-header",
                isDark
                  ? "bg-gradient-to-b from-gold-neon/20 to-transparent"
                  : "bg-gradient-to-b from-mist-primary/20 to-transparent",
              )}
            >
              <p className="planet-info-kicker">{drawerCopy.selectedObject}</p>
              <h2
                id="planetInfoName"
                className={cn(
                  "planet-info-title",
                  isDark ? "text-white" : "text-black",
                )}
              >
                {selectedPlanetInfo
                  ? getLocalizedPlanetText(
                      selectedPlanetInfo.displayName ?? selectedPlanetInfo.name,
                      language,
                    )
                  : drawerCopy.noSelection}
              </h2>
              <p
                id="planetInfoType"
                className={cn(
                  "planet-info-subtitle",
                  isDark ? "text-white/60" : "text-black/60",
                )}
              >
                {selectedPlanetInfo
                  ? getLocalizedPlanetText(
                      selectedPlanetInfo.typeLabel,
                      language,
                    )
                  : drawerCopy.noSelectionHint}
              </p>
            </div>

            <div
              id="planetInfoBody"
              className="planet-info-body flex-1 overflow-y-auto"
            >
              <AnimatePresence mode="wait">
                {isInspectorOpen && (
                  <motion.div
                    key={selectedPlanetInfo?.name ?? "empty"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-5 pt-2 pb-6"
                  >
                    {selectedPlanetInfo ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          {infoFields.map((field) => (
                            <div key={field.key} className="space-y-1">
                              <p
                                className={cn(
                                  "text-[12px] font-bold tracking-widest uppercase",
                                  isDark ? "text-white/60" : "text-black/60",
                                )}
                              >
                                {field.label}
                              </p>

                              <p
                                className={cn(
                                  // "text-[12px] font-bold tracking-widest uppercase",
                                  "text-[14px] font-mono tracking-wide",
                                  isDark ? "text-white" : "text-black",
                                )}
                              >
                                {getLocalizedPlanetText(
                                  field.value as
                                    | string
                                    | { EN: string; FR: string }
                                    | undefined,
                                  language,
                                )}
                              </p>

                              {field.comparison && (
                                <p
                                  className={cn(
                                    "text-[14px] font-mono tracking-wide",
                                    isDark ? "text-blue-200" : "text-black/65",
                                  )}
                                >
                                  {field.comparison}
                                </p>
                              )}
                              {field.extra && (
                                <p
                                  className={cn(
                                    "text-[12px] font-mono tracking-wide",
                                    isDark ? "text-white/75" : "text-black/75",
                                  )}
                                >
                                  {field.extra}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <p
                            className={cn(
                              "text-[8px] font-bold tracking-widest uppercase",
                              isDark ? "text-white/40" : "text-black/40",
                            )}
                          >
                            {drawerCopy.overview}
                          </p>
                          <p
                            className={cn(
                              "text-xs leading-relaxed",
                              isDark ? "text-white/60" : "text-black/60",
                            )}
                          >
                            {getLocalizedPlanetText(
                              selectedPlanetInfo.description,
                              language,
                            )}
                          </p>
                        </div>

                        <button
                          className={cn(
                            "w-full py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2 border",
                            isDark
                              ? "bg-white/5 hover:bg-white/10 border-white/5 text-white"
                              : "bg-black/5 hover:bg-black/10 border-black/5 text-black",
                          )}
                        >
                          <Info size={14} /> {drawerCopy.extendedMetrics}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <p
                          className={cn(
                            "text-[8px] font-bold tracking-widest uppercase",
                            isDark ? "text-white/40" : "text-black/40",
                          )}
                        >
                          {drawerCopy.overview}
                        </p>
                        <p
                          className={cn(
                            "text-xs leading-relaxed",
                            isDark ? "text-white/60" : "text-black/60",
                          )}
                        >
                          {drawerCopy.emptyOverview}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.aside>

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={handleApplySimulationDate}
        language={language}
        isDark={isDark}
        initialDate={ephemerisDate}
      />

      <div
        className={cn(
          "absolute inset-0 pointer-events-none opacity-60",
          isDark
            ? "bg-gradient-to-t from-black via-transparent to-transparent"
            : "bg-gradient-to-t from-mist-bg via-transparent to-transparent",
        )}
      />

      <audio
        ref={audioRef}
        key={musicTracks[currentMusicIndex].url}
        src={musicTracks[currentMusicIndex].url}
        autoPlay={isMusicOn}
        loop
        muted={!isMusicOn}
      />
    </div>
  );
}

function ControlToggle({
  label,
  active,
  onClick,
  isDark,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between group"
    >
      <span
        className={cn(
          "text-[10px] font-bold tracking-widest transition-colors",
          active
            ? isDark
              ? "text-white"
              : "text-black"
            : isDark
              ? "text-white/20 group-hover:text-white/40"
              : "text-black/20 group-hover:text-black/40",
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "w-8 h-4 rounded-full relative transition-all duration-300",
          active
            ? isDark
              ? "bg-gold-neon/40"
              : "bg-mist-primary/40"
            : isDark
              ? "bg-white/10"
              : "bg-black/10",
        )}
      >
        <motion.div
          animate={{ x: active ? 16 : 2 }}
          className={cn(
            "absolute top-1 w-2 h-2 rounded-full",
            active
              ? isDark
                ? "bg-gold-neon neon-glow-gold"
                : "bg-mist-primary"
              : isDark
                ? "bg-white/40"
                : "bg-black/40",
          )}
        />
      </div>
    </button>
  );
}
