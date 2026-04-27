import { haversineDistanceKm } from "@/lib/parsers/gpxParser";

export interface SplitTracePoint {
  lat: number;
  lng: number;
  time: number;
  altitude?: number;
  heart_rate?: number;
}

export interface KmSplit {
  km: number;
  paceSecPerKm: number;
  avgHeartRate?: number;
  elevationGain: number;
  durationSec: number;
}

export function calculateSplits(gpsTrace: SplitTracePoint[]): KmSplit[] {
  if (!gpsTrace || gpsTrace.length < 2) return [];

  const splits: KmSplit[] = [];
  let currentKmDist = 0;
  let currentKmStartTime = gpsTrace[0].time;
  let currentKmHRSum = 0;
  let currentKmHRCount = 0;
  let currentKmElevGain = 0;
  let kmCount = 1;

  for (let i = 1; i < gpsTrace.length; i++) {
    const prev = gpsTrace[i - 1];
    const curr = gpsTrace[i];
    const segDist = haversineDistanceKm(
      { lat: prev.lat, lng: prev.lng },
      { lat: curr.lat, lng: curr.lng },
    );

    currentKmDist += segDist;

    if (typeof curr.heart_rate === "number" && curr.heart_rate > 0) {
      currentKmHRSum += curr.heart_rate;
      currentKmHRCount++;
    }

    if (
      typeof curr.altitude === "number" &&
      typeof prev.altitude === "number" &&
      curr.altitude > prev.altitude
    ) {
      currentKmElevGain += curr.altitude - prev.altitude;
    }

    if (currentKmDist >= 1.0) {
      const durationSec = (curr.time - currentKmStartTime) / 1000;
      splits.push({
        km: kmCount,
        paceSecPerKm: durationSec / currentKmDist,
        avgHeartRate: currentKmHRCount > 0 ? Math.round(currentKmHRSum / currentKmHRCount) : undefined,
        elevationGain: Math.round(currentKmElevGain),
        durationSec,
      });
      kmCount++;
      currentKmDist = 0;
      currentKmStartTime = curr.time;
      currentKmHRSum = 0;
      currentKmHRCount = 0;
      currentKmElevGain = 0;
    }
  }

  if (currentKmDist > 0.1) {
    const last = gpsTrace[gpsTrace.length - 1];
    const durationSec = (last.time - currentKmStartTime) / 1000;
    splits.push({
      km: kmCount,
      paceSecPerKm: durationSec / currentKmDist,
      avgHeartRate: currentKmHRCount > 0 ? Math.round(currentKmHRSum / currentKmHRCount) : undefined,
      elevationGain: Math.round(currentKmElevGain),
      durationSec,
    });
  }

  return splits;
}

export function formatSplitPace(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0) return "--:--";
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${String(sec).padStart(2, "0")}`;
}
