import type { ImportedRun } from "./gpxParser";

type HeartRateSample = {
  start: number;
  end: number;
  value: number;
};

function parseAppleDate(value: string | null) {
  if (!value) return undefined;
  const normalized = value.replace(/ \+(\d{4})$/, " GMT+$1");
  const timestamp = new Date(normalized).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function convertDistanceToKm(distance: number | undefined, unit: string | null) {
  if (typeof distance !== "number") return 0;
  const normalizedUnit = `${unit ?? ""}`.toLowerCase();
  if (normalizedUnit.includes("km")) return distance;
  if (normalizedUnit.includes("mi")) return distance * 1.60934;
  if (normalizedUnit.includes("m")) return distance / 1000;
  return distance;
}

function averageHeartRate(samples: HeartRateSample[]) {
  if (!samples.length) return undefined;
  return Math.round(samples.reduce((sum, sample) => sum + sample.value, 0) / samples.length);
}

export function parseAppleHealthXml(text: string): ImportedRun[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  const parseError = doc.querySelector("parsererror");

  if (parseError) {
    throw new Error("Le fichier Apple Health export.xml est invalide.");
  }

  const allRecords = Array.from(doc.getElementsByTagName("Record"));
  const heartRateSamples: HeartRateSample[] = allRecords
    .filter((record) => record.getAttribute("type") === "HKQuantityTypeIdentifierHeartRate")
    .map((record) => {
      const start = parseAppleDate(record.getAttribute("startDate"));
      const end = parseAppleDate(record.getAttribute("endDate"));
      const value = parseNumber(record.getAttribute("value"));

      if (typeof start !== "number" || typeof end !== "number" || typeof value !== "number") {
        return null;
      }

      return { start, end, value };
    })
    .filter((sample): sample is HeartRateSample => Boolean(sample));

  const workouts = Array.from(doc.getElementsByTagName("Workout")).filter(
    (workout) => workout.getAttribute("workoutActivityType") === "HKWorkoutActivityTypeRunning",
  );

  return workouts
    .map((workout) => {
      const startedAt = parseAppleDate(workout.getAttribute("startDate"));
      const endedAt = parseAppleDate(workout.getAttribute("endDate"));
      if (typeof startedAt !== "number" || typeof endedAt !== "number") {
        return null;
      }

      const distanceKm = convertDistanceToKm(
        parseNumber(workout.getAttribute("totalDistance")),
        workout.getAttribute("totalDistanceUnit"),
      );

      const linkedHeartRates = heartRateSamples.filter(
        (sample) => sample.start >= startedAt && sample.end <= endedAt,
      );

      const title = `Course Apple Health ${new Date(startedAt).toLocaleDateString("fr-FR")}`;

      return {
        title,
        distance_km: Math.round(distanceKm * 100) / 100,
        duration_seconds: Math.max(0, Math.round((endedAt - startedAt) / 1000)),
        elevation_gain: 0,
        average_heartrate: averageHeartRate(linkedHeartRates),
        gps_trace: [],
        started_at: new Date(startedAt).toISOString(),
        source: "apple",
      } satisfies ImportedRun;
    })
    .filter((run): run is ImportedRun => Boolean(run));
}

export async function parseAppleHealthFile(file: Blob) {
  const text = await file.text();
  return parseAppleHealthXml(text);
}
