import { describe, it, expect } from "vitest";
import { parseGpxText } from "@/lib/parsers/gpxParser";

const VALID_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="test">
  <trk>
    <name>Test Run</name>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522">
        <ele>35</ele>
        <time>2024-01-01T08:00:00Z</time>
      </trkpt>
      <trkpt lat="48.8576" lon="2.3532">
        <ele>36</ele>
        <time>2024-01-01T08:01:00Z</time>
      </trkpt>
      <trkpt lat="48.8586" lon="2.3542">
        <ele>37</ele>
        <time>2024-01-01T08:02:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe("parseGpxText", () => {
  it("parses a valid GPX file", () => {
    const result = parseGpxText(VALID_GPX);
    expect(result).toBeDefined();
    expect(result.gps_trace.length).toBeGreaterThan(0);
  });

  it("extracts GPS coordinates correctly", () => {
    const result = parseGpxText(VALID_GPX);
    const firstPoint = result.gps_trace[0];
    expect(firstPoint.lat).toBeCloseTo(48.8566, 4);
    expect(firstPoint.lng).toBeCloseTo(2.3522, 4);
  });

  it("calculates a positive distance", () => {
    const result = parseGpxText(VALID_GPX);
    expect(result.distance_km).toBeGreaterThan(0);
  });

  it("extracts track name", () => {
    const result = parseGpxText(VALID_GPX);
    expect(result.title).toBe("Test Run");
  });

  it("throws on empty string", () => {
    expect(() => parseGpxText("")).toThrow();
  });

  it("throws on malformed XML", () => {
    expect(() => parseGpxText("<gpx><broken")).toThrow();
  });

  it("throws on GPX with no track points", () => {
    const emptyGpx = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`;
    expect(() => parseGpxText(emptyGpx)).toThrow();
  });
});
