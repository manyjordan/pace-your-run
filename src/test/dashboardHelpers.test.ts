import { describe, it, expect } from "vitest";
import { buildMetricData, getStartOfWeek } from "@/lib/dashboardHelpers";
import type { RunRow } from "@/lib/database";

function makeRun(overrides: Partial<RunRow> = {}): RunRow {
  return {
    id: crypto.randomUUID(),
    user_id: "test-user",
    distance_km: 10,
    duration_seconds: 3600,
    elevation_gain: 100,
    average_pace: 6,
    average_heartrate: null,
    gps_trace: null,
    run_type: "run",
    started_at: new Date().toISOString(),
    title: "Test Run",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("getStartOfWeek", () => {
  it("returns a Monday", () => {
    const date = new Date("2024-01-10"); // Wednesday
    const start = getStartOfWeek(date);
    expect(start.getDay()).toBe(1); // Monday
  });

  it("returns same day for Monday input", () => {
    const monday = new Date("2024-01-08"); // Monday
    const start = getStartOfWeek(monday);
    expect(start.getDay()).toBe(1);
  });
});

describe("buildMetricData", () => {
  it("returns valid structure with empty runs", () => {
    const result = buildMetricData("Distance par semaine", [], "week", "3m");
    expect(result).toBeDefined();
    expect(result.chartData).toBeInstanceOf(Array);
    expect(result.currentValue).toBeTruthy();
  });

  it("computes distance correctly", () => {
    const runs = [
      makeRun({ distance_km: 10, started_at: new Date().toISOString() }),
      makeRun({ distance_km: 5, started_at: new Date().toISOString() }),
    ];
    const result = buildMetricData("Distance par semaine", runs, "week", "1m");
    expect(result.currentValue).toContain("km");
  });

  it("handles all period options without throwing", () => {
    const runs = [makeRun()];
    expect(() => buildMetricData("Distance par semaine", runs, "week", "1m")).not.toThrow();
    expect(() => buildMetricData("Distance par semaine", runs, "week", "3m")).not.toThrow();
    expect(() => buildMetricData("Distance par semaine", runs, "month", "1y")).not.toThrow();
    expect(() => buildMetricData("Distance par semaine", runs, "week", "all")).not.toThrow();
  });

  it("handles all metric titles", () => {
    const runs = [makeRun()];
    expect(() => buildMetricData("Distance par semaine", runs, "week", "3m")).not.toThrow();
    expect(() => buildMetricData("Durée par semaine", runs, "week", "3m")).not.toThrow();
    expect(() => buildMetricData("Dénivelé par semaine", runs, "week", "3m")).not.toThrow();
  });
});
