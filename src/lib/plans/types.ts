export type PlanLevel = "finisher" | "performance" | "competitor" | "elite";

export type PlanDistance = "5k" | "10k" | "semi" | "marathon" | "regular" | "custom";

export type PlanSessionType = "easy" | "tempo" | "interval" | "long" | "rest" | "race";

export interface PlanSession {
  day: string;
  type: PlanSessionType;
  label: string;
  description: string;
  distance: number;
  pace: string;
  intensity: "easy" | "moderate" | "hard" | "race";
  /** Duration in minutes (for UI / session recap) */
  duration: number;
}

/** Alias used across the app for a scheduled workout */
export type Session = PlanSession;

export interface PlanWeek {
  weekNumber: number;
  /** Legacy alias — same as weekNumber (TrainingTab / dashboard) */
  week: number;
  phase: "base" | "build" | "peak" | "taper";
  totalDistance: number;
  focus: string;
  sessions: PlanSession[];
}

export interface TrainingPlan {
  id: string;
  distance: PlanDistance;
  level: PlanLevel;
  name: string;
  description: string;
  emoji: string;
  targetTime?: string;
  durationWeeks: number;
  sessionsPerWeek: 3 | 4 | 5;
  weeklySchedule: PlanWeek[];
  /** Selection & legacy UI */
  goal: "weight" | "distance" | "race";
  summary: string;
  daysPerWeek: 3 | 4 | 5;
  legacyLevel: "beginner" | "intermediate" | "advanced";
  targetDistance?: "5k" | "10k" | "20k" | "semi" | "marathon";
  equipmentTips: string[];
  nutritionTips: string[];
  shoeTips: string[];
}

function parsePaceToken(token: string): number | null {
  const t = token.trim().replace("/km", "");
  const parts = t.split(":");
  if (parts.length !== 2) return null;
  const mm = Number(parts[0]);
  const ss = Number(parts[1]);
  if (!Number.isFinite(mm) || !Number.isFinite(ss)) return null;
  return mm + ss / 60;
}

/** Midpoint pace in min/km from "5:40" or "5:30-6:00" */
export function midPaceMinutes(pace: string): number | null {
  const trimmed = pace.replace("/km", "").trim();
  if (!trimmed.includes("-")) return parsePaceToken(trimmed);
  const [a, b] = trimmed.split("-").map((x) => x.trim());
  const pa = parsePaceToken(a);
  const pb = parsePaceToken(b);
  if (pa === null || pb === null) return pa ?? pb;
  return (pa + pb) / 2;
}

export function estimateSessionMinutes(distanceKm: number, pace: string): number {
  const m = midPaceMinutes(pace);
  if (m === null || m <= 0) return Math.round(distanceKm * 6);
  return Math.max(5, Math.round(distanceKm * m));
}
