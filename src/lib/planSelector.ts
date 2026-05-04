import type { RunRow } from "./database";
import { ALL_PLANS } from "./plans/allPlans";
import type { PlanLevel, TrainingPlan } from "./plans/types";

export type PlanSelectorParams = {
  goal: "weight" | "distance" | "race";
  targetDistance?: "5k" | "10k" | "20k" | "semi" | "marathon";
  level: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  /** Specific weekdays (French names); when set, length drives plan template selection. */
  availableDays?: string[];
  weeksAvailable?: number;
};

const LEVEL_RANK: Record<PlanLevel, number> = {
  finisher: 0,
  performance: 1,
  competitor: 2,
  elite: 3,
};

function normalizeTargetDistance(
  td: PlanSelectorParams["targetDistance"] | undefined,
): "5k" | "10k" | "semi" | "marathon" | undefined {
  if (!td) return undefined;
  if (td === "20k") return "semi";
  return td;
}

function allowedPlanLevels(userLevel: PlanSelectorParams["level"]): PlanLevel[] {
  if (userLevel === "beginner") return ["finisher"];
  if (userLevel === "intermediate") return ["finisher", "performance"];
  return ["finisher", "performance", "competitor", "elite"];
}

function matchesDistance(p: TrainingPlan, td: ReturnType<typeof normalizeTargetDistance>): boolean {
  if (!td) return true;
  if (p.targetDistance === td) return true;
  if (td === "semi" && p.targetDistance === "semi") return true;
  return p.distance === td;
}

/**
 * Detects the user's running level based on their run history
 */
export function detectLevel(runs: RunRow[]): "beginner" | "intermediate" | "advanced" {
  if (!runs || runs.length === 0) {
    return "beginner";
  }

  const now = new Date();
  const firstRun = runs[runs.length - 1];

  if (!firstRun.started_at) {
    return "beginner";
  }

  const firstRunDate = new Date(firstRun.started_at);
  const daysOfHistory = Math.floor((now.getTime() - firstRunDate.getTime()) / (1000 * 60 * 60 * 24));
  const monthsOfHistory = daysOfHistory / 30;

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

  if (averageWeeklyDistance < 20 || monthsOfHistory < 3) {
    return "beginner";
  }

  if (averageWeeklyDistance > 50 && monthsOfHistory >= 6) {
    return "advanced";
  }

  if (averageWeeklyDistance >= 20 && averageWeeklyDistance <= 50 && monthsOfHistory >= 3) {
    return "intermediate";
  }

  return "beginner";
}

/**
 * Selects the best matching training plan based on user parameters.
 */
export function selectPlan(params: PlanSelectorParams): TrainingPlan {
  const fromSelection =
    params.availableDays && params.availableDays.length > 0 ? params.availableDays.length : null;
  const daysPerWeek = Math.min(5, Math.max(2, fromSelection ?? Math.round(params.daysPerWeek)));

  const weeksCap = params.weeksAvailable ? Math.max(4, Math.min(28, params.weeksAvailable)) : undefined;
  const td = normalizeTargetDistance(params.targetDistance);
  const levelsOk = new Set(allowedPlanLevels(params.level));

  let pool = ALL_PLANS.filter((p) => {
    if (params.goal === "weight") return p.goal === "weight";
    if (p.goal === "weight") return false;
    if (!matchesDistance(p, td)) return false;
    if (!levelsOk.has(p.level)) return false;
    if (weeksCap !== undefined && p.durationWeeks > weeksCap) return false;
    return true;
  });

  if (pool.length === 0 && params.goal !== "weight") {
    pool = ALL_PLANS.filter((p) => {
      if (p.goal === "weight") return false;
      if (!matchesDistance(p, td)) return false;
      if (weeksCap !== undefined && p.durationWeeks > weeksCap) return false;
      return true;
    });
  }

  if (pool.length === 0) {
    return ALL_PLANS.find((p) => p.id === "regular_running") ?? ALL_PLANS[0]!;
  }

  const exactDays = pool.filter((p) => p.sessionsPerWeek === daysPerWeek);
  if (exactDays.length > 0) {
    pool = exactDays;
  } else {
    const atLeast = pool.filter((p) => p.sessionsPerWeek >= daysPerWeek);
    if (atLeast.length > 0) {
      pool = atLeast.sort((a, b) => a.sessionsPerWeek - b.sessionsPerWeek);
    } else {
      pool = [...pool].sort((a, b) => Math.abs(a.sessionsPerWeek - daysPerWeek) - Math.abs(b.sessionsPerWeek - daysPerWeek));
    }
  }

  const idealRank =
    params.level === "beginner" ? 0 : params.level === "intermediate" ? 1 : 2;

  pool.sort((a, b) => {
    const rd = Math.abs(LEVEL_RANK[a.level] - idealRank) - Math.abs(LEVEL_RANK[b.level] - idealRank);
    if (rd !== 0) return rd;
    const wd =
      weeksCap !== undefined
        ? Math.abs(a.durationWeeks - weeksCap) - Math.abs(b.durationWeeks - weeksCap)
        : b.durationWeeks - a.durationWeeks;
    if (wd !== 0) return wd;
    return LEVEL_RANK[b.level] - LEVEL_RANK[a.level];
  });

  return pool[0] ?? ALL_PLANS[0]!;
}
