export type DistanceUnit = "km" | "mi";
export type CumulativeTimeAnnouncement = "off" | "1" | "5" | "10";

export type RunPreferences = {
  distanceUnit: DistanceUnit;
  announceSplitSpeed: boolean;
  cumulativeTimeAnnouncement: CumulativeTimeAnnouncement;
  paceAlerts: boolean;
  paceAlertThresholdSeconds: number;
};

const DEFAULT_RUN_PREFERENCES: RunPreferences = {
  distanceUnit: "km",
  announceSplitSpeed: false,
  cumulativeTimeAnnouncement: "off",
  paceAlerts: true,
  paceAlertThresholdSeconds: 15,
};

function getStorageKey(userId?: string | null) {
  return userId ? `pace-run-preferences:${userId}` : "pace-run-preferences:anonymous";
}

export function getDefaultRunPreferences() {
  return DEFAULT_RUN_PREFERENCES;
}

export function loadRunPreferences(userId?: string | null): RunPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_RUN_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return DEFAULT_RUN_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<RunPreferences>;
    return {
      distanceUnit: parsed.distanceUnit === "mi" ? "mi" : "km",
      announceSplitSpeed: Boolean(parsed.announceSplitSpeed),
      cumulativeTimeAnnouncement:
        parsed.cumulativeTimeAnnouncement === "1" ||
        parsed.cumulativeTimeAnnouncement === "5" ||
        parsed.cumulativeTimeAnnouncement === "10"
          ? parsed.cumulativeTimeAnnouncement
          : "off",
      paceAlerts: parsed.paceAlerts !== false,
      paceAlertThresholdSeconds:
        typeof parsed.paceAlertThresholdSeconds === "number" &&
        Number.isFinite(parsed.paceAlertThresholdSeconds) &&
        parsed.paceAlertThresholdSeconds > 0
          ? Math.round(parsed.paceAlertThresholdSeconds)
          : 15,
    };
  } catch {
    return DEFAULT_RUN_PREFERENCES;
  }
}

export function saveRunPreferences(preferences: RunPreferences, userId?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(preferences));
}

export function convertDistanceFromKm(distanceKm: number, unit: DistanceUnit) {
  return unit === "mi" ? distanceKm * 0.621371 : distanceKm;
}

export function convertSpeedFromKmPerHour(speedKmPerHour: number, unit: DistanceUnit) {
  return unit === "mi" ? speedKmPerHour * 0.621371 : speedKmPerHour;
}

export function convertPaceFromMinutesPerKm(paceMinutesPerKm: number, unit: DistanceUnit) {
  return unit === "mi" ? paceMinutesPerKm * 1.609344 : paceMinutesPerKm;
}

export function getDistanceUnitLabel(unit: DistanceUnit) {
  return unit === "mi" ? "miles" : "km";
}

export function getDistanceUnitShortLabel(unit: DistanceUnit) {
  return unit === "mi" ? "mi" : "km";
}

export function getSpeedUnitLabel(unit: DistanceUnit) {
  return unit === "mi" ? "mph" : "km/h";
}

export function getSplitDistanceKm(unit: DistanceUnit) {
  return unit === "mi" ? 1.609344 : 1;
}
