import type { RunInput } from "@/lib/database";

type StravaCSVRow = {
  "Activity ID": string;
  "Activity Date": string;
  "Activity Name": string;
  "Activity Type": string;
  Distance: string;
  "Moving Time": string;
  "Elapsed Time": string;
  "Elevation Gain": string;
  "Average Heart Rate": string;
  "Max Heart Rate": string;
  Filename: string;
};

function parseStravaDate(dateStr: string): string | null {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

export type StravaCSVImportResult = {
  runs: RunInput[];
  skipped: number;
  total: number;
};

export function parseStravaCSV(csvText: string): StravaCSVImportResult {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return { runs: [], skipped: 0, total: 0 };

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""));

  const runs: RunInput[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim().replace(/^"|"$/g, "");
    });

    const activityType = row["Activity Type"] ?? "";
    if (!["Run", "TrailRun", "VirtualRun"].includes(activityType)) {
      skipped++;
      continue;
    }

    const distanceKm = parseFloat(row.Distance ?? "0");
    const durationSeconds = parseInt(row["Moving Time"] ?? "0", 10);
    const elevationGain = parseFloat(row["Elevation Gain"] ?? "0");
    const avgHr = parseInt(row["Average Heart Rate"] ?? "0", 10);

    if (distanceKm <= 0 || durationSeconds <= 0) {
      skipped++;
      continue;
    }

    const typedRow = row as unknown as StravaCSVRow;
    const run: RunInput = {
      title: typedRow["Activity Name"] || "Course importée",
      distance_km: distanceKm,
      duration_seconds: durationSeconds,
      moving_time_seconds: durationSeconds,
      elevation_gain: elevationGain || null,
      average_pace: distanceKm > 0 ? durationSeconds / 60 / distanceKm : null,
      average_heartrate: avgHr > 0 ? avgHr : null,
      gps_trace: [],
      run_type: activityType === "TrailRun" ? "trail" : "run",
      started_at: parseStravaDate(typedRow["Activity Date"]),
    };

    runs.push(run);
  }

  return { runs, skipped, total: lines.length - 1 };
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
