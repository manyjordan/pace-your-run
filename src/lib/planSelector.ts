import { TRAINING_PLANS, TrainingPlan } from "./trainingPlans";
import type { RunRow } from "./database";

export type PlanSelectorParams = {
  goal: "weight" | "distance" | "race";
  targetDistance?: "5k" | "10k" | "20k" | "semi" | "marathon";
  level: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  /** Specific weekdays (French names); when set, length drives plan template selection. */
  availableDays?: string[];
  weeksAvailable?: number;
};

/**
 * Detects the user's running level based on their run history
 */
export function detectLevel(runs: RunRow[]): "beginner" | "intermediate" | "advanced" {
  if (!runs || runs.length === 0) {
    return "beginner";
  }

  // Calculate running history duration
  const now = new Date();
  const firstRun = runs[runs.length - 1]; // Last run in array (oldest)
  
  if (!firstRun.started_at) {
    return "beginner";
  }

  const firstRunDate = new Date(firstRun.started_at);
  const daysOfHistory = Math.floor((now.getTime() - firstRunDate.getTime()) / (1000 * 60 * 60 * 24));
  const monthsOfHistory = daysOfHistory / 30;

  // Calculate weekly average distance
  let totalDistance = 0;
  const runsByWeek = new Map<string, number>();

  for (const run of runs) {
    totalDistance += run.distance_km || 0;

    if (run.started_at) {
      const runDate = new Date(run.started_at);
      const weekStart = new Date(runDate);
      weekStart.setDate(weekStart.getDate() - runDate.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      runsByWeek.set(weekKey, (runsByWeek.get(weekKey) || 0) + (run.distance_km || 0));
    }
  }

  const averageWeeklyDistance = runsByWeek.size > 0 ? totalDistance / runsByWeek.size : 0;

  // Determine level based on criteria
  // Beginner: < 20km/week OR < 3 months history
  if (averageWeeklyDistance < 20 || monthsOfHistory < 3) {
    return "beginner";
  }

  // Advanced: > 50km/week AND >= 6 months history
  if (averageWeeklyDistance > 50 && monthsOfHistory >= 6) {
    return "advanced";
  }

  // Intermediate: 20-50km/week AND >= 3 months history
  if (averageWeeklyDistance >= 20 && averageWeeklyDistance <= 50 && monthsOfHistory >= 3) {
    return "intermediate";
  }

  return "beginner";
}

/**
 * Selects the best matching training plan based on user parameters
 * Always returns a plan (never null) - returns closest match if exact match doesn't exist
 */
export function selectPlan(params: PlanSelectorParams): TrainingPlan {
  const fromSelection =
    params.availableDays && params.availableDays.length > 0 ? params.availableDays.length : null;
  const daysPerWeek = Math.min(
    5,
    Math.max(2, fromSelection ?? Math.round(params.daysPerWeek)),
  );

  // Normalize weeks available
  const weeksAvailable = params.weeksAvailable ? Math.max(4, Math.min(16, params.weeksAvailable)) : undefined;

  // Try to find exact match
  let plan = TRAINING_PLANS.find(p => {
    const goalMatch = p.goal === params.goal;
    const levelMatch = p.level === params.level;
    const daysMatch = p.daysPerWeek === daysPerWeek;
    const distanceMatch = !params.targetDistance || p.targetDistance === params.targetDistance;

    if (weeksAvailable) {
      const weeksMatch = p.durationWeeks <= weeksAvailable;
      return goalMatch && levelMatch && daysMatch && distanceMatch && weeksMatch;
    }

    return goalMatch && levelMatch && daysMatch && distanceMatch;
  });

  if (plan) {
    return plan;
  }

  // If no exact match, find closest match
  // Priority: goal + distance > level > daysPerWeek > durationWeeks

  // Filter by goal and distance
  let candidates = TRAINING_PLANS.filter(p => {
    const goalMatch = p.goal === params.goal;
    const distanceMatch = !params.targetDistance || p.targetDistance === params.targetDistance;
    return goalMatch && distanceMatch;
  });

  if (candidates.length === 0) {
    // If no distance match, just match goal
    candidates = TRAINING_PLANS.filter(p => p.goal === params.goal);
  }

  // Within candidates, find by level
  let byCandidates = candidates.filter(p => p.level === params.level);
  if (byCandidates.length === 0) {
    // If no exact level, prefer closest (intermediate if available, then advanced, then beginner)
    if (params.level === "advanced") {
      byCandidates = candidates.filter(p => p.level === "intermediate");
    }
    if (byCandidates.length === 0) {
      byCandidates = candidates.filter(p => p.level === "beginner");
    }
  }

  if (byCandidates.length === 0) {
    byCandidates = candidates;
  }

  candidates = byCandidates;

  // Within candidates, find by daysPerWeek
  let byDays = candidates.filter(p => p.daysPerWeek === daysPerWeek);
  if (byDays.length === 0) {
    // Find closest days per week
    const daysOptions = [2, 3, 4, 5];
    for (const days of daysOptions.sort((a, b) => Math.abs(a - daysPerWeek) - Math.abs(b - daysPerWeek))) {
      byDays = candidates.filter(p => p.daysPerWeek === days);
      if (byDays.length > 0) break;
    }
  }

  if (byDays.length === 0) {
    byDays = candidates;
  }

  candidates = byDays;

  // Within candidates, find by duration (prefer shorter if weeks constrained)
  if (weeksAvailable) {
    const byWeeks = candidates.filter(p => p.durationWeeks <= weeksAvailable);
    if (byWeeks.length > 0) {
      candidates = byWeeks;
    }
  }

  // Sort by duration weeks to get closest match
  candidates.sort((a, b) => Math.abs(a.durationWeeks - (weeksAvailable || 8)) - Math.abs(b.durationWeeks - (weeksAvailable || 8)));

  // Return the first (best match) plan
  const finalPlan = candidates[0] || TRAINING_PLANS[0];
  return finalPlan;
}
