import { getPlanById, generateCustomTrainingPlan } from "./plans/allPlans";
import type { TrainingPlan } from "./plans/types";

export type GenerateTrainingPlanInput = {
  weeksUntilRace: number;
  currentWeeklyKm: number;
  goalDistanceKm: number;
  runsPerWeek: 3 | 4 | 5;
};

/**
 * Builds a training plan from volume / distance / horizon parameters.
 * Used by the « Créer mon plan » flow in GoalTab.
 */
export function generateTrainingPlan(input: GenerateTrainingPlanInput): TrainingPlan {
  const d =
    input.goalDistanceKm >= 40
      ? "marathon"
      : input.goalDistanceKm >= 21
        ? "semi"
        : input.goalDistanceKm >= 10
          ? "10k"
          : "5k";
  return generateCustomTrainingPlan({
    durationWeeks: Math.min(24, Math.max(6, Math.round(input.weeksUntilRace))),
    runsPerWeek: input.runsPerWeek,
    distance: d,
    currentWeeklyKm: input.currentWeeklyKm,
  });
}

/** Resolve plan from profile goal_data (preset id or embedded custom plan). */
export function resolveTrainingPlan(goalData: unknown): TrainingPlan | undefined {
  if (!goalData || typeof goalData !== "object" || Array.isArray(goalData)) return undefined;
  const g = goalData as Record<string, unknown>;
  const emb = g.embeddedPlan;
  if (emb && typeof emb === "object" && emb !== null && Array.isArray((emb as TrainingPlan).weeklySchedule)) {
    return emb as TrainingPlan;
  }
  const id = g.selectedPlanId;
  if (typeof id === "string" && id.length > 0) return getPlanById(id);
  return undefined;
}
