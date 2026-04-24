/**
 * Utility functions for formatting run data.
 * Renamed from strava.ts — no longer has any Strava API dependency.
 */

export type { CommunityPost, GPSTracePoint } from "./types";

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatHoursAndMinutes(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes} min`;
  }

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatPace(distanceMeters: number, movingTimeSeconds: number) {
  if (!distanceMeters || !movingTimeSeconds) return "--:-- /km";

  const minutesPerKm = movingTimeSeconds / 60 / (distanceMeters / 1000);
  const wholeMinutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - wholeMinutes) * 60);
  const safeSeconds = seconds === 60 ? 59 : seconds;

  return `${wholeMinutes}:${String(safeSeconds).padStart(2, "0")} /km`;
}

export function formatPaceFromSeconds(durationSeconds: number, distanceMeters: number): string {
  if (!durationSeconds || !distanceMeters) return "--:-- /km";
  const distanceKm = distanceMeters > 100 ? distanceMeters / 1000 : distanceMeters;
  const minutesPerKm = durationSeconds / 60 / distanceKm;
  const wholeMinutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - wholeMinutes) * 60);
  const safeSeconds = seconds === 60 ? 59 : seconds;
  return `${wholeMinutes}:${String(safeSeconds).padStart(2, "0")} /km`;
}

export function convertPaceFromMinutesPerKm(paceMinPerKm: number, unit: "km" | "mi" = "km"): number {
  if (!paceMinPerKm || paceMinPerKm <= 0) return 0;
  if (unit === "mi") return paceMinPerKm * 1.60934;
  return paceMinPerKm;
}

export function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
