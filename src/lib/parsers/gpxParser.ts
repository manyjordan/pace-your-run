export type ImportedRun = {
  title: string;
  distance_km: number;
  duration_seconds: number;
  moving_time_seconds?: number | null;
  elevation_gain: number;
  average_heartrate?: number;
  gps_trace: Array<{ lat: number; lng: number; time: number }>;
  started_at: string;
  source: "strava" | "nike" | "garmin" | "adidas" | "apple" | "unknown";
};

type GpxPoint = {
  lat: number;
  lng: number;
  time?: number;
  ele?: number;
  heartRate?: number;
};

const EARTH_RADIUS_KM = 6371;
const MOVING_SPEED_THRESHOLD_KMH = 0.8;

function toArray<T>(list: ArrayLike<T>): T[] {
  return Array.from(list);
}

function getElementsByLocalName(parent: Document | Element, localName: string): Element[] {
  return toArray(parent.getElementsByTagName("*")).filter(
    (element) => element.localName?.toLowerCase() === localName.toLowerCase(),
  );
}

function getFirstChildText(parent: Document | Element, localName: string): string | null {
  const match = getElementsByLocalName(parent, localName)[0];
  const value = match?.textContent?.trim();
  return value ? value : null;
}

function parseDateValue(value: string | null): number | undefined {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : undefined;
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function haversineDistanceKm(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
) {
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDistanceFromTrace(points: Array<{ lat: number; lng: number }>) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineDistanceKm(points[i - 1], points[i]);
  }
  return total;
}

export function computeMovingTime(trace: Array<{ lat: number; lng: number; time: number }>): number {
  if (trace.length < 2) return 0;
  let movingSeconds = 0;

  for (let i = 1; i < trace.length; i += 1) {
    const prev = trace[i - 1];
    const curr = trace[i];
    const dtSeconds = (curr.time - prev.time) / 1000;
    if (dtSeconds <= 0 || dtSeconds > 300) continue;

    const distKm = calculateDistanceFromTrace([prev, curr]);
    const speedKmh = (distKm / dtSeconds) * 3600;
    if (speedKmh >= MOVING_SPEED_THRESHOLD_KMH) {
      movingSeconds += dtSeconds;
    }
  }

  return Math.round(movingSeconds);
}

function calculateElevationGain(points: GpxPoint[]) {
  let gain = 0;
  for (let i = 1; i < points.length; i += 1) {
    if (typeof points[i].ele !== "number" || typeof points[i - 1].ele !== "number") {
      continue;
    }
    const delta = points[i].ele! - points[i - 1].ele!;
    if (delta > 0) {
      gain += delta;
    }
  }
  return round(gain, 0);
}

function detectSource(value: string | null | undefined): ImportedRun["source"] {
  const normalized = `${value ?? ""}`.toLowerCase();
  if (normalized.includes("strava")) return "strava";
  if (normalized.includes("nike")) return "nike";
  if (normalized.includes("garmin")) return "garmin";
  if (normalized.includes("adidas")) return "adidas";
  if (normalized.includes("apple")) return "apple";
  return "unknown";
}

function parseHeartRate(point: Element) {
  const heartRateElement = getElementsByLocalName(point, "hr")[0];
  return parseNumber(heartRateElement?.textContent?.trim() ?? null);
}

function parseTrackPoints(doc: Document) {
  const points = getElementsByLocalName(doc, "trkpt").map((point) => {
    const lat = parseNumber(point.getAttribute("lat"));
    const lng = parseNumber(point.getAttribute("lon"));
    if (typeof lat !== "number" || typeof lng !== "number") {
      return null;
    }

    return {
      lat,
      lng,
      ele: parseNumber(getFirstChildText(point, "ele")),
      time: parseDateValue(getFirstChildText(point, "time")),
      heartRate: parseHeartRate(point),
    } satisfies GpxPoint;
  });

  return points.filter((point): point is GpxPoint => Boolean(point));
}

function parseDistanceHint(doc: Document) {
  const candidates = getElementsByLocalName(doc, "distance").concat(
    getElementsByLocalName(doc, "distancemeters"),
  );

  for (const element of candidates) {
    const value = parseNumber(element.textContent?.trim() ?? null);
    if (typeof value === "number" && value > 0) {
      return value > 1000 ? value / 1000 : value;
    }
  }

  return undefined;
}

export function parseGpxText(text: string, fileName?: string): ImportedRun {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  const parseError = doc.querySelector("parsererror");

  if (parseError) {
    throw new Error("Le fichier GPX est invalide ou illisible.");
  }

  const points = parseTrackPoints(doc);
  if (!points.length) {
    throw new Error("Aucun point GPS trouve dans le fichier GPX.");
  }

  const title =
    getFirstChildText(doc, "name") ??
    fileName?.replace(/\.[^.]+$/, "") ??
    "Course importée";

  const gpsTrace = points.map((point, index) => ({
    lat: point.lat,
    lng: point.lng,
    time: point.time ?? (index === 0 ? Date.now() : gpsTraceFallbackTime(points, index)),
  }));

  const startedAtMs =
    points.find((point) => typeof point.time === "number")?.time ??
    parseDateValue(getFirstChildText(doc, "time")) ??
    Date.now();

  const lastPointTime =
    [...points].reverse().find((point) => typeof point.time === "number")?.time ?? startedAtMs;

  const durationSeconds = Math.max(0, Math.round((lastPointTime - startedAtMs) / 1000));
  const distanceHint = parseDistanceHint(doc);
  const distanceKm =
    typeof distanceHint === "number" && distanceHint > 0
      ? round(distanceHint)
      : round(calculateDistanceFromTrace(gpsTrace));

  const heartRates = points
    .map((point) => point.heartRate)
    .filter((value): value is number => typeof value === "number" && value > 0);

  const creator = doc.documentElement.getAttribute("creator");
  const movingTimeSeconds = computeMovingTime(gpsTrace);

  return {
    title,
    distance_km: distanceKm,
    duration_seconds: durationSeconds,
    elevation_gain: calculateElevationGain(points),
    average_heartrate: heartRates.length
      ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length)
      : undefined,
    moving_time_seconds: movingTimeSeconds > 0 ? movingTimeSeconds : null,
    gps_trace: gpsTrace,
    started_at: new Date(startedAtMs).toISOString(),
    source: detectSource(fileName ?? creator ?? ""),
  };
}

function gpsTraceFallbackTime(points: GpxPoint[], index: number) {
  const previousTimedPoint = [...points.slice(0, index)].reverse().find((point) => typeof point.time === "number");
  return (previousTimedPoint?.time ?? Date.now()) + 1000;
}

export async function parseGpxFile(file: Blob & { name?: string }) {
  const text = await file.text();
  return parseGpxText(text, "name" in file ? file.name : undefined);
}
