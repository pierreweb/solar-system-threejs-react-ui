const MIRIADE_EPHEMCC_URL =
  "https://ssp.imcce.fr/webservices/miriade/api/ephemcc.php";

export type SupportedEphemerisBodyName =
  | "Mercury"
  | "Venus"
  | "Earth"
  | "Moon"
  | "Mars"
  | "Ceres"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto";

type MiriadeBodyDescriptor = {
  miriadeName: string;
  type: "Planet" | "Satellite" | "Dwarf Planet" | "Asteroid";
};

type MiriadeEphemerisRow = {
  epoch?: string | number;
  x?: number | string;
  y?: number | string;
  z?: number | string;
  px?: number | string;
  py?: number | string;
  pz?: number | string;
  dobs?: number | string;
  r?: number | string;
  [key: string]: unknown;
};

type MiriadeEphemerisResponse = {
  sso?: {
    name?: string;
    type?: string;
  };
  coosys?: {
    epoch?: string;
    equinox?: string;
    system?: string;
  };
  ephemeris?: {
    time_scale?: string;
    planetary_theory?: string;
    coordinates?: string;
    reference_frame?: {
      type?: string;
      plane?: string;
      center?: string;
    };
  };
  data?: MiriadeEphemerisRow[];
  unit?: Record<string, string>;
};

export type BodyEphemeris = {
  bodyName: SupportedEphemerisBodyName;
  requestedAt: string;
  epoch: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
    unit: string;
  };
  observerDistanceAu: number | null;
  heliocentricDistanceAu: number | null;
  raw: MiriadeEphemerisResponse;
};

const BODY_MAP: Record<SupportedEphemerisBodyName, MiriadeBodyDescriptor> = {
  Mercury: { miriadeName: "p:Mercury", type: "Planet" },
  Venus: { miriadeName: "p:Venus", type: "Planet" },
  Earth: { miriadeName: "p:Earth", type: "Planet" },
  Moon: { miriadeName: "s:Moon", type: "Satellite" },
  Mars: { miriadeName: "p:Mars", type: "Planet" },
  Ceres: { miriadeName: "dp:Ceres", type: "Dwarf Planet" },
  Jupiter: { miriadeName: "p:Jupiter", type: "Planet" },
  Saturn: { miriadeName: "p:Saturn", type: "Planet" },
  Uranus: { miriadeName: "p:Uranus", type: "Planet" },
  Neptune: { miriadeName: "p:Neptune", type: "Planet" },
  Pluto: { miriadeName: "dp:Pluto", type: "Dwarf Planet" },
};

const DEFAULT_BODY_NAMES: SupportedEphemerisBodyName[] = [
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

function formatEpoch(date: Date) {
  return date.toISOString();
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readCartesianCoordinate(
  row: MiriadeEphemerisRow,
  primaryKey: "x" | "y" | "z",
  fallbackKey: "px" | "py" | "pz",
) {
  return toFiniteNumber(row[primaryKey]) ?? toFiniteNumber(row[fallbackKey]);
}

export function buildMiriadeEphemerisUrl(
  bodyName: SupportedEphemerisBodyName,
  date: Date,
) {
  const descriptor = BODY_MAP[bodyName];
  const url = new URL(MIRIADE_EPHEMCC_URL);

  url.searchParams.set("-name", descriptor.miriadeName);
  url.searchParams.set("-type", descriptor.type);
  url.searchParams.set("-ep", formatEpoch(date));
  url.searchParams.set("-nbd", "1");
  url.searchParams.set("-step", "1d");
  url.searchParams.set("-tscale", "UTC");
  url.searchParams.set("-observer", "@sun");
  url.searchParams.set("-theory", "INPOP");
  url.searchParams.set("-teph", "1");
  url.searchParams.set("-tcoor", "2");
  url.searchParams.set("-rplane", "1");
  url.searchParams.set("-mime", "json");
  url.searchParams.set("-output", "--iso");
  url.searchParams.set("-from", "solar-system-threejs-react-ui");

  return url.toString();
}

function parseBodyEphemeris(
  bodyName: SupportedEphemerisBodyName,
  date: Date,
  payload: MiriadeEphemerisResponse,
): BodyEphemeris {
  const row = payload.data?.[0];

  if (!row) {
    throw new Error(`No ephemeris row returned for ${bodyName}.`);
  }

  const x = readCartesianCoordinate(row, "x", "px");
  const y = readCartesianCoordinate(row, "y", "py");
  const z = readCartesianCoordinate(row, "z", "pz");

  if (x === null || y === null || z === null) {
    throw new Error(`Missing rectangular coordinates for ${bodyName}.`);
  }

  return {
    bodyName,
    requestedAt: date.toISOString(),
    epoch: String(row.epoch ?? formatEpoch(date)),
    coordinates: {
      x,
      y,
      z,
      unit: payload.unit?.x ?? payload.unit?.px ?? "au",
    },
    observerDistanceAu: toFiniteNumber(row.dobs),
    heliocentricDistanceAu: toFiniteNumber(row.r),
    raw: payload,
  };
}

export async function fetchBodyEphemeris(
  bodyName: SupportedEphemerisBodyName,
  date: Date,
): Promise<BodyEphemeris> {
  const response = await fetch(buildMiriadeEphemerisUrl(bodyName, date));

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ephemeris for ${bodyName}: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as MiriadeEphemerisResponse;
  console.log("MIRIADE RAW", bodyName, payload);
  return parseBodyEphemeris(bodyName, date, payload);
}

export async function fetchEphemeridesForDate(
  date: Date,
  bodyNames: SupportedEphemerisBodyName[] = DEFAULT_BODY_NAMES,
) {
  const entries = await Promise.all(
    bodyNames.map(async (bodyName) => [
      bodyName,
      await fetchBodyEphemeris(bodyName, date),
    ]),
  );

  return Object.fromEntries(entries) as Record<
    SupportedEphemerisBodyName,
    BodyEphemeris
  >;
}
