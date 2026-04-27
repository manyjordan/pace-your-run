export interface HRZone {
  zone: number;
  name: string;
  color: string;
  minPct: number;
  maxPct: number;
  minBpm?: number;
  maxBpm?: number;
  description: string;
}

export const HR_ZONE_DEFINITIONS: HRZone[] = [
  { zone: 1, name: "Recuperation", color: "#94a3b8", minPct: 0, maxPct: 60, description: "Recuperation active" },
  { zone: 2, name: "Endurance", color: "#4ade80", minPct: 60, maxPct: 70, description: "Endurance fondamentale" },
  { zone: 3, name: "Tempo", color: "#facc15", minPct: 70, maxPct: 80, description: "Allure tempo" },
  { zone: 4, name: "Seuil", color: "#f97316", minPct: 80, maxPct: 90, description: "Seuil lactique" },
  { zone: 5, name: "Max", color: "#ef4444", minPct: 90, maxPct: 100, description: "Effort maximal" },
];

export function getHRZones(maxHR: number): HRZone[] {
  return HR_ZONE_DEFINITIONS.map((z) => ({
    ...z,
    minBpm: Math.round((maxHR * z.minPct) / 100),
    maxBpm: Math.round((maxHR * z.maxPct) / 100),
  }));
}

export function getZoneForBpm(bpm: number, zones: HRZone[]): HRZone {
  return zones.find((z) => bpm >= (z.minBpm ?? 0) && bpm < (z.maxBpm ?? 999)) ?? zones[zones.length - 1];
}

export function calculateZoneDistribution(
  gpsTrace: Array<{ heart_rate?: number; time: number }>,
  zones: HRZone[],
): Array<{ zone: HRZone; seconds: number; percentage: number }> {
  if (!gpsTrace || gpsTrace.length < 2) return [];

  const zoneSeconds = new Map<number, number>();
  zones.forEach((z) => zoneSeconds.set(z.zone, 0));

  let totalSeconds = 0;
  for (let i = 1; i < gpsTrace.length; i++) {
    const hr = gpsTrace[i].heart_rate;
    if (!hr) continue;
    const segSec = (gpsTrace[i].time - gpsTrace[i - 1].time) / 1000;
    if (segSec <= 0 || segSec > 60) continue;
    const zone = getZoneForBpm(hr, zones);
    zoneSeconds.set(zone.zone, (zoneSeconds.get(zone.zone) ?? 0) + segSec);
    totalSeconds += segSec;
  }

  if (totalSeconds === 0) return [];

  return zones
    .map((z) => ({
      zone: z,
      seconds: zoneSeconds.get(z.zone) ?? 0,
      percentage: Math.round(((zoneSeconds.get(z.zone) ?? 0) / totalSeconds) * 100),
    }))
    .filter((z) => z.seconds > 0);
}
