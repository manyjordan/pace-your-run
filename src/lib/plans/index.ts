export * from "./types";
export { weightPlans } from "./weightPlans";
export { distancePlans } from "./distancePlans";
export { racePlans } from "./racePlans";

import { weightPlans } from "./weightPlans";
import { distancePlans } from "./distancePlans";
import { racePlans } from "./racePlans";
import type { TrainingPlan } from "./types";

export const TRAINING_PLANS: TrainingPlan[] = [...weightPlans, ...distancePlans, ...racePlans];

export function getPlanById(id: string): TrainingPlan | undefined {
  return TRAINING_PLANS.find((plan) => plan.id === id);
}

const MAP_DAY_ORDER = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function mapSessionsToDays(plan: TrainingPlan, availableDays: string[]): TrainingPlan {
  if (!availableDays.length) return plan;

  const sortedDays = [...availableDays].sort(
    (a, b) => MAP_DAY_ORDER.indexOf(a) - MAP_DAY_ORDER.indexOf(b),
  );

  return {
    ...plan,
    weeklySchedule: plan.weeklySchedule.map((week) => ({
      ...week,
      sessions: week.sessions.map((session, index) => ({
        ...session,
        day: sortedDays[index % sortedDays.length] ?? session.day,
      })),
    })),
  };
}
