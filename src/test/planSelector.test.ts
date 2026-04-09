import { describe, it, expect } from "vitest";
import { selectPlan, detectLevel } from "@/lib/planSelector";
import { mapSessionsToDays } from "@/lib/plans";
import type { RunRow } from "@/lib/database";

describe("selectPlan", () => {
  it("returns exact match when available", () => {
    const plan = selectPlan({ goal: "distance", targetDistance: "5k", level: "beginner", daysPerWeek: 3 });
    expect(plan).toBeDefined();
    expect(plan.goal).toBe("distance");
    expect(plan.level).toBe("beginner");
  });

  it("never returns null or undefined", () => {
    const plan = selectPlan({ goal: "race", level: "advanced", daysPerWeek: 7 });
    expect(plan).toBeDefined();
    expect(plan.id).toBeTruthy();
  });

  it("falls back gracefully when no exact match", () => {
    const plan = selectPlan({ goal: "weight", level: "intermediate", daysPerWeek: 5, weeksAvailable: 3 });
    expect(plan).toBeDefined();
  });

  it("respects weeksAvailable constraint when possible", () => {
    const plan = selectPlan({
      goal: "weight",
      level: "beginner",
      daysPerWeek: 2,
      weeksAvailable: 8,
    });
    expect(plan.durationWeeks).toBeLessThanOrEqual(8);
  });

  it("normalizes daysPerWeek outside valid range", () => {
    const planLow = selectPlan({ goal: "weight", level: "beginner", daysPerWeek: 0 });
    const planHigh = selectPlan({ goal: "weight", level: "beginner", daysPerWeek: 10 });
    expect(planLow).toBeDefined();
    expect(planHigh).toBeDefined();
  });

  it("handles all goal types", () => {
    const weight = selectPlan({ goal: "weight", level: "beginner", daysPerWeek: 3 });
    const distance = selectPlan({ goal: "distance", targetDistance: "10k", level: "intermediate", daysPerWeek: 4 });
    const race = selectPlan({ goal: "race", targetDistance: "marathon", level: "advanced", daysPerWeek: 5 });
    expect(weight.goal).toBe("weight");
    expect(distance.goal).toBe("distance");
    expect(race.goal).toBe("race");
  });
});

describe("detectLevel", () => {
  it("returns beginner for empty run history", () => {
    expect(detectLevel([])).toBe("beginner");
  });

  it("returns beginner for low mileage", () => {
    const runs: Partial<RunRow>[] = Array.from({ length: 4 }, (_, i) => ({
      id: `run-${i}`,
      distance_km: 5,
      duration_seconds: 1800,
      started_at: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    expect(detectLevel(runs as RunRow[])).toBe("beginner");
  });

  it("returns intermediate for moderate mileage with history", () => {
    const runs: Partial<RunRow>[] = Array.from({ length: 15 }, (_, i) => ({
      id: `run-${i}`,
      distance_km: 25,
      duration_seconds: 7200,
      started_at: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    expect(detectLevel(runs as RunRow[])).toBe("intermediate");
  });

  it("handles runs with missing started_at gracefully", () => {
    const runs: Partial<RunRow>[] = [{ id: "run-1", distance_km: 10, duration_seconds: 3600, started_at: null }];
    expect(() => detectLevel(runs as RunRow[])).not.toThrow();
    expect(detectLevel(runs as RunRow[])).toBe("beginner");
  });
});

describe("mapSessionsToDays", () => {
  it("never assigns two sessions on the same day", () => {
    const plan = selectPlan({
      goal: "distance",
      targetDistance: "10k",
      level: "intermediate",
      daysPerWeek: 4,
    });
    const mapped = mapSessionsToDays(plan, ["Lundi", "Mercredi", "Vendredi"]);
    for (const week of mapped.weeklySchedule) {
      const days = week.sessions.map((s) => s.day);
      const uniqueDays = new Set(days);
      expect(uniqueDays.size).toBe(days.length);
    }
  });

  it("truncates sessions to available days count", () => {
    const plan = selectPlan({
      goal: "race",
      targetDistance: "marathon",
      level: "advanced",
      daysPerWeek: 5,
    });
    const mapped = mapSessionsToDays(plan, ["Lundi", "Mercredi", "Vendredi"]);
    for (const week of mapped.weeklySchedule) {
      expect(week.sessions.length).toBeLessThanOrEqual(3);
    }
  });
});
