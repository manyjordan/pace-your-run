export * from "./types";
export * from "./allPlans";

import { ALL_PLANS } from "./allPlans";
import type { TrainingPlan } from "./types";

/** @deprecated use ALL_PLANS — kept for backward imports */
export const TRAINING_PLANS: TrainingPlan[] = ALL_PLANS;

const MAP_DAY_ORDER = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function mapSessionsToDays(plan: TrainingPlan, availableDays: string[]): TrainingPlan {
  if (!availableDays.length) return plan;

  const sortedDays = [...availableDays].sort(
    (a, b) => MAP_DAY_ORDER.indexOf(a) - MAP_DAY_ORDER.indexOf(b),
  );

  return {
    ...plan,
    weeklySchedule: plan.weeklySchedule.map((week) => {
      const sessions = week.sessions.slice(0, sortedDays.length);

      return {
        ...week,
        sessions: sessions.map((session, index) => ({
          ...session,
          day: sortedDays[index]!,
          duration: session.duration,
        })),
        totalDistance: Number(sessions.reduce((sum, s) => sum + s.distance, 0).toFixed(1)),
      };
    }),
  };
}
