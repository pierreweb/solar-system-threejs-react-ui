import * as THREE from "three";
import { getPlanetInfo } from "../data/planetInfodata.js";

export const SCENE_DISTANCE_SCALE = 0.17;
export const SCENE_RADIUS_SCALE = 0.16;
export const MIN_BODY_RADIUS = 0.12;

export function resolveAssetUrl(assetPath) {
  if (!assetPath || typeof assetPath !== "string") return null;

  const trimmedPath = assetPath.trim();
  if (!trimmedPath) return null;

  const normalizedSlashes = trimmedPath.replace(/\\/g, "/");

  if (
    /^(?:[a-z]+:)?\/\//i.test(normalizedSlashes) ||
    /^(?:data|blob):/i.test(normalizedSlashes)
  ) {
    return normalizedSlashes;
  }

  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const basePathPrefix = normalizedBaseUrl.slice(0, -1);

  if (normalizedSlashes.startsWith(normalizedBaseUrl)) {
    return normalizedSlashes;
  }

  if (
    basePathPrefix &&
    basePathPrefix !== "/" &&
    normalizedSlashes.startsWith(basePathPrefix)
  ) {
    return normalizedSlashes;
  }

  const withoutRelativePrefix = normalizedSlashes.replace(
    /^(?:\.\.?\/)+/,
    "",
  );

  const withoutLeadingSlash = withoutRelativePrefix.replace(/^\/+/, "");
  return `${normalizedBaseUrl}${withoutLeadingSlash}`;
}

export function getScaledDistance(distance = 0) {
  return distance * SCENE_DISTANCE_SCALE;
}

export function getScaledRadius(radius = 0) {
  return Math.max(radius * SCENE_RADIUS_SCALE, MIN_BODY_RADIUS);
}

export function getOrbitSpeed(yearDays = 365.25) {
  return 365.25 / Math.max(Math.abs(yearDays), 1);
}

export function parseRotationPeriodToHours(rotationPeriod) {
  if (!rotationPeriod || typeof rotationPeriod !== "string") return null;

  const normalized = rotationPeriod
    .replace(/[−–—]/g, "-")
    .replace(/,/g, "")
    .toLowerCase();

  if (
    normalized.includes("varies widely") ||
    normalized === "-" ||
    normalized === "—"
  ) {
    return null;
  }

  const sign = normalized.trim().startsWith("-") ? -1 : 1;
  const cleaned = normalized.replace(/\([^)]*\)/g, "");

  const daysMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*days?/);
  const hoursMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*h\b/);
  const minutesMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*min\b/);

  const days = daysMatch ? Number(daysMatch[1]) : 0;
  const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;

  const totalHours = days * 24 + hours + minutes / 60;
  if (!totalHours) return null;

  return sign * totalHours;
}

export function getSelfRotationSpeed(periodHours = 24) {
  const direction = periodHours < 0 ? -1 : 1;
  return direction * ((Math.PI * 2) / Math.max(Math.abs(periodHours), 0.1));
}

export function getPlanetSelfRotationSpeed(name) {
  const rotationPeriod = getPlanetInfo(name)?.rotationPeriod;
  const periodHours = parseRotationPeriodToHours(rotationPeriod);

  return periodHours ? getSelfRotationSpeed(periodHours) : 0;
}

export function degToRad(value = 0) {
  return THREE.MathUtils.degToRad(value);
}
