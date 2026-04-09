import JSZip from "jszip";

import { parseFitArrayBuffer } from "./fitParser";
import { parseGpxText, type ImportedRun } from "./gpxParser";
import { parseCSVLine } from "./stravaCSVParser";

const VALID_RUN_TYPES = new Set([
  "Run",
  "TrailRun",
  "VirtualRun",
  "Treadmill",
  "run",
  "trail_run",
  "virtual_run",
  "treadmill",
]);

export type StravaZipParseResult = {
  runs: ImportedRun[];
  /** Non-run activity types, missing CSV rows when CSV is enforced, etc. */
  skipped: number;
};

function buildActivityTypeMap(csvText: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return map;

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""));
  const typeIdx = headers.indexOf("Activity Type");
  const fileIdx = headers.indexOf("Filename");
  if (typeIdx < 0 || fileIdx < 0) return map;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = parseCSVLine(line);
    const rawFile = (cols[fileIdx] ?? "").trim().replace(/^"|"$/g, "").replace(/\\/g, "/");
    const type = (cols[typeIdx] ?? "").trim().replace(/^"|"$/g, "");
    if (!rawFile || !type) continue;

    const withoutPrefix = rawFile.replace(/^activities\//i, "");
    const lowerFull = rawFile.toLowerCase();
    const lowerBase = withoutPrefix.toLowerCase();
    map.set(lowerFull, type);
    map.set(lowerBase, type);
    map.set(`activities/${lowerBase}`, type);
  }

  return map;
}

function resolveActivityType(entryName: string, map: Map<string, string>): string | undefined {
  const lower = entryName.toLowerCase();
  if (map.has(lower)) return map.get(lower);
  const base = entryName.split("/").pop() ?? entryName;
  const baseLower = base.toLowerCase();
  if (map.has(baseLower)) return map.get(baseLower);
  if (map.has(`activities/${baseLower}`)) return map.get(`activities/${baseLower}`);
  return undefined;
}

async function gunzipToArrayBuffer(data: Uint8Array): Promise<ArrayBuffer | null> {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).arrayBuffer();
  } catch {
    return null;
  }
}

export async function parseStravaZipFile(file: Blob): Promise<StravaZipParseResult> {
  const zip = await JSZip.loadAsync(file);
  const runs: ImportedRun[] = [];
  let skipped = 0;
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  const csvEntry = entries.find((e) => {
    const n = e.name.toLowerCase();
    return n === "activities.csv" || n.endsWith("/activities.csv");
  });

  let activityTypeMap = new Map<string, string>();
  let csvFound = false;
  if (csvEntry) {
    csvFound = true;
    try {
      const csvText = await csvEntry.async("string");
      activityTypeMap = buildActivityTypeMap(csvText);
    } catch {
      activityTypeMap = new Map();
    }
  }

  const enforceCsv = csvFound && activityTypeMap.size > 0;

  const dataEntries = entries.filter((entry) => {
    const lower = entry.name.toLowerCase();
    return (
      lower.endsWith(".gpx") ||
      lower.endsWith(".fit.gz") ||
      (lower.endsWith(".fit") && !lower.endsWith(".fit.gz"))
    );
  });

  for (const entry of dataEntries) {
    const lowerName = entry.name.toLowerCase();

    let activityType: string | undefined;
    if (enforceCsv) {
      activityType = resolveActivityType(entry.name, activityTypeMap);
      if (activityType === undefined) {
        skipped++;
        continue;
      }
    } else {
      activityType = resolveActivityType(entry.name, activityTypeMap) ?? "Run";
    }

    if (!VALID_RUN_TYPES.has(activityType)) {
      skipped++;
      continue;
    }

    if (lowerName.endsWith(".gpx")) {
      try {
        const text = await entry.async("string");
        runs.push(parseGpxText(text, entry.name));
      } catch {
        continue;
      }
      continue;
    }

    if (lowerName.endsWith(".fit.gz")) {
      try {
        const raw = await entry.async("uint8array");
        const buffer = await gunzipToArrayBuffer(raw);
        if (!buffer) {
          skipped++;
          continue;
        }
        const parsed = parseFitArrayBuffer(buffer, entry.name.replace(/\.gz$/i, ""));
        if (parsed) {
          runs.push(parsed);
        }
      } catch {
        continue;
      }
      continue;
    }

    if (lowerName.endsWith(".fit")) {
      try {
        const buffer = await entry.async("arraybuffer");
        const parsed = parseFitArrayBuffer(buffer, entry.name);
        if (parsed) {
          runs.push(parsed);
        }
      } catch {
        continue;
      }
    }
  }

  return {
    runs: runs.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    ),
    skipped,
  };
}
