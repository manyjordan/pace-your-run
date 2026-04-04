import JSZip from "jszip";

import { parseFitArrayBuffer } from "./fitParser";
import { parseGpxText, type ImportedRun } from "./gpxParser";

export async function parseStravaZipFile(file: Blob) {
  const zip = await JSZip.loadAsync(file);
  const runs: ImportedRun[] = [];
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  for (const entry of entries) {
    const lowerName = entry.name.toLowerCase();

    if (lowerName.endsWith(".gpx")) {
      try {
        const text = await entry.async("string");
        runs.push(parseGpxText(text, entry.name));
      } catch {
        continue;
      }
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

  return runs.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
}
