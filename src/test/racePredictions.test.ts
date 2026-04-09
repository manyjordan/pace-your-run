import { describe, expect, it } from "vitest";
import {
  RACE_DISTANCES,
  formatPredictionTime,
  getRacePrediction,
  estimateVO2maxFromRuns,
} from "@/lib/racePredictions";
import type { RunRow } from "@/lib/database";

function makeRun(distanceKm: number, durationSeconds: number, daysAgo = 7): RunRow {
  return {
    id: `run-${Math.random().toString(36).slice(2)}`,
    user_id: "test-user",
    distance_km: distanceKm,
    duration_seconds: durationSeconds,
    elevation_gain: 0,
    average_pace: durationSeconds / 60 / distanceKm,
    average_heartrate: null,
    gps_trace: null,
    run_type: "run",
    started_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    title: `Test run ${distanceKm}km`,
    created_at: new Date().toISOString(),
  };
}

const goodRunnerRuns: RunRow[] = [
  makeRun(10, 50 * 60, 3),
  makeRun(5, 25 * 60, 7),
  makeRun(8, 42 * 60, 14),
  makeRun(12, 64 * 60, 21),
];

const slowRunnerRuns: RunRow[] = [
  makeRun(5, 35 * 60, 3),
  makeRun(6, 44 * 60, 10),
  makeRun(4, 28 * 60, 17),
];

describe("formatPredictionTime", () => {
  it("formats seconds under 1 hour correctly", () => {
    expect(formatPredictionTime(45 * 60 + 30)).toBe("45min 30s");
  });

  it("formats seconds over 1 hour correctly", () => {
    expect(formatPredictionTime(3 * 3600 + 23 * 60 + 45)).toBe("3h 23min 45s");
  });

  it("handles exactly 1 hour", () => {
    expect(formatPredictionTime(3600)).toBe("1h 0min 0s");
  });

  it("handles zero seconds", () => {
    expect(formatPredictionTime(0)).toBe("0s");
  });
});

describe("RACE_DISTANCES", () => {
  it("contains all standard distances", () => {
    const labels = RACE_DISTANCES.map((d) => d.label);
    expect(labels).toContain("5 km");
    expect(labels).toContain("10 km");
    expect(labels).toContain("Semi-marathon");
    expect(labels).toContain("Marathon");
  });

  it("has correct marathon distance", () => {
    const marathon = RACE_DISTANCES.find((d) => d.label === "Marathon");
    expect(marathon?.km).toBeCloseTo(42.195, 2);
  });

  it("has correct semi-marathon distance", () => {
    const semi = RACE_DISTANCES.find((d) => d.label === "Semi-marathon");
    expect(semi?.km).toBeCloseTo(21.097, 2);
  });
});

describe("getRacePrediction", () => {
  it("returns null with no runs", () => {
    expect(getRacePrediction([], 10, "10 km")).toBeNull();
  });

  it("returns null with only 1 run", () => {
    expect(getRacePrediction([makeRun(5, 25 * 60)], 10, "10 km")).toBeNull();
  });

  it("returns null with runs all under 3km", () => {
    const shortRuns = [makeRun(2, 10 * 60), makeRun(1.5, 8 * 60)];
    expect(getRacePrediction(shortRuns, 10, "10 km")).toBeNull();
  });

  it("returns a valid prediction with good data", () => {
    const result = getRacePrediction(goodRunnerRuns, 10, "10 km");
    expect(result).not.toBeNull();
    expect(result?.targetDistanceKm).toBe(10);
    expect(result?.targetLabel).toBe("10 km");
    expect(result?.consensusSeconds).toBeGreaterThan(0);
    expect(result?.predictions.length).toBe(4);
  });

  it("consensus is within min/max range", () => {
    const result = getRacePrediction(goodRunnerRuns, 10, "10 km");
    expect(result).not.toBeNull();
    expect(result!.consensusSeconds).toBeGreaterThanOrEqual(result!.rangeMinSeconds);
    expect(result!.consensusSeconds).toBeLessThanOrEqual(result!.rangeMaxSeconds);
  });

  it("predicts longer time for marathon than 10km", () => {
    const marathon = getRacePrediction(goodRunnerRuns, 42.195, "Marathon");
    const tenK = getRacePrediction(goodRunnerRuns, 10, "10 km");
    expect(marathon).not.toBeNull();
    expect(tenK).not.toBeNull();
    expect(marathon!.consensusSeconds).toBeGreaterThan(tenK!.consensusSeconds);
  });

  it("predicts slower runner has longer times", () => {
    const fast = getRacePrediction(goodRunnerRuns, 10, "10 km");
    const slow = getRacePrediction(slowRunnerRuns, 10, "10 km");
    expect(fast).not.toBeNull();
    expect(slow).not.toBeNull();
    expect(slow!.consensusSeconds).toBeGreaterThan(fast!.consensusSeconds);
  });

  it("all 4 models are present", () => {
    const result = getRacePrediction(goodRunnerRuns, 10, "10 km");
    expect(result).not.toBeNull();
    const modelNames = result!.predictions.map((p) => p.model);
    expect(modelNames.filter((name) => name.startsWith("Riegel")).length).toBe(2);
    expect(modelNames).toContain("Cameron");
    expect(modelNames.some((name) => name.includes("Daniels"))).toBe(true);
    expect(modelNames.filter((name) => name.startsWith("Riegel")).length).toBe(2);
    expect(modelNames.length).toBe(4);
  });

  it("all predictions have valid confidence levels", () => {
    const result = getRacePrediction(goodRunnerRuns, 10, "10 km");
    expect(result).not.toBeNull();
    for (const pred of result!.predictions) {
      expect(["high", "medium", "low"]).toContain(pred.confidence);
      expect(pred.predictedSeconds).toBeGreaterThan(0);
    }
  });

  it("10km prediction for good runner is realistic (40-70 min)", () => {
    const result = getRacePrediction(goodRunnerRuns, 10, "10 km");
    expect(result).not.toBeNull();
    expect(result!.consensusSeconds).toBeGreaterThan(40 * 60);
    expect(result!.consensusSeconds).toBeLessThan(70 * 60);
  });

  it("marathon prediction for slow runner is realistic (3h30-6h)", () => {
    const result = getRacePrediction(slowRunnerRuns, 42.195, "Marathon");
    expect(result).not.toBeNull();
    expect(result!.consensusSeconds).toBeGreaterThan(3.5 * 3600);
    expect(result!.consensusSeconds).toBeLessThan(6 * 3600);
  });

  it("works for all standard RACE_DISTANCES", () => {
    for (const dist of RACE_DISTANCES) {
      const result = getRacePrediction(goodRunnerRuns, dist.km, dist.label);
      expect(result).not.toBeNull();
      expect(result!.consensusSeconds).toBeGreaterThan(0);
    }
  });
});

describe("estimateVO2maxFromRuns", () => {
  it("returns null with no runs", () => {
    expect(estimateVO2maxFromRuns([])).toBeNull();
  });

  it("returns null with only short runs under 3km", () => {
    expect(estimateVO2maxFromRuns([makeRun(2, 12 * 60)])).toBeNull();
  });

  it("returns a valid estimate with sufficient data", () => {
    const result = estimateVO2maxFromRuns(goodRunnerRuns);
    expect(result).not.toBeNull();
    expect(result!.value).toBeGreaterThan(25);
    expect(result!.value).toBeLessThan(85);
  });

  it("good runner has higher VO2max than slow runner", () => {
    const fast = estimateVO2maxFromRuns(goodRunnerRuns)!;
    const slow = estimateVO2maxFromRuns(slowRunnerRuns)!;
    expect(fast.value).toBeGreaterThan(slow.value);
  });

  it("returns a valid level label in French", () => {
    const result = estimateVO2maxFromRuns(goodRunnerRuns)!;
    const validLabels = ["Très faible", "Faible", "Moyen", "Bon", "Excellent", "Supérieur"];
    expect(validLabels).toContain(result.levelLabel);
  });

  it("basedOnRun contains valid data", () => {
    const result = estimateVO2maxFromRuns(goodRunnerRuns)!;
    expect(result.basedOnRun).not.toBeNull();
    expect(result.basedOnRun!.distanceKm).toBeGreaterThan(0);
    expect(result.basedOnRun!.durationSeconds).toBeGreaterThan(0);
  });

  it("trend is null when not enough historical data", () => {
    const result = estimateVO2maxFromRuns([makeRun(5, 25 * 60)])!;
    expect(result.trend).toBeNull();
  });
});
