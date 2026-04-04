export type GoalLevel = "beginner" | "intermediate" | "advanced";
export type GoalType = "weight" | "distance" | "race";
export type GoalRaceType = "marathon" | "semi" | "20k" | "10k" | "5k" | "other";

export type GoalDataShape = {
  goalType?: GoalType | null;
  goal_type?: GoalType | null;
  availableDaysPerWeek?: string | number | null;
  daysPerWeek?: string | number | null;
  level?: GoalLevel | null;
  fitnessLevel?: GoalLevel | null;
  targetWeightKg?: string | null;
  targetWeight?: string | null;
  weightTargetDate?: string | null;
  raceType?: GoalRaceType | null;
  raceDistanceKm?: string | null;
  raceDistance?: string | null;
  raceTargetTime?: string | null;
  raceTargetDate?: string | null;
  distanceKm?: string | null;
  distanceTargetDate?: string | null;
  selectedPlanId?: string | null;
  goalSavedAt?: string | null;
};

export const racePresetDistance: Record<GoalRaceType, string> = {
  marathon: "42.195",
  semi: "21.097",
  "20k": "20",
  "10k": "10",
  "5k": "5",
  other: "",
};

export function normalizeGoalData(raw: GoalDataShape | null | undefined) {
  const goalType = raw?.goalType ?? raw?.goal_type ?? "weight";
  const level = raw?.level ?? raw?.fitnessLevel ?? "beginner";
  const availableDaysPerWeek = String(raw?.availableDaysPerWeek ?? raw?.daysPerWeek ?? "");
  const raceDistanceKm = String(raw?.raceDistanceKm ?? raw?.raceDistance ?? "");

  return {
    goalType,
    availableDaysPerWeek,
    daysPerWeek: availableDaysPerWeek ? Number(availableDaysPerWeek) : null,
    level,
    fitnessLevel: level,
    targetWeightKg: raw?.targetWeightKg ?? raw?.targetWeight ?? "",
    weightTargetDate: raw?.weightTargetDate ?? "",
    raceType: raw?.raceType ?? "marathon",
    raceDistanceKm,
    raceDistance: raceDistanceKm,
    raceTargetTime: raw?.raceTargetTime ?? "",
    raceTargetDate: raw?.raceTargetDate ?? "",
    distanceKm: raw?.distanceKm ?? "",
    distanceTargetDate: raw?.distanceTargetDate ?? "",
    selectedPlanId: raw?.selectedPlanId ?? undefined,
    goalSavedAt: raw?.goalSavedAt ?? undefined,
  };
}

export function mapDistanceToTargetDistance(distanceKm: number): "5k" | "10k" | "20k" | "semi" | "marathon" {
  if (distanceKm <= 5) return "5k";
  if (distanceKm <= 10) return "10k";
  if (distanceKm <= 20) return "20k";
  if (distanceKm <= 25) return "semi";
  return "marathon";
}

export function mapRaceTypeToTargetDistance(raceType: GoalRaceType): "5k" | "10k" | "20k" | "semi" | "marathon" {
  if (raceType === "other") return "marathon";
  return raceType;
}

export function calculateWeeksAvailable(targetDate?: string | null, fallback = 12) {
  if (!targetDate) return fallback;

  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) return fallback;

  const diffMs = date.getTime() - Date.now();
  const diffWeeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
  return Math.max(4, Math.min(16, diffWeeks || fallback));
}

export function parseTimeToSeconds(time: string) {
  const parts = time.split(":").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatTimeFromParts(hours: string, minutes: string, seconds: string) {
  return `${hours}:${minutes}:${seconds}`;
}

export function getTargetTimeGuardrail(distanceKm: number) {
  const minSeconds = Math.round(distanceKm * 2.5 * 60);
  const maxSeconds = Math.round(distanceKm * 12 * 60);
  return { minSeconds, maxSeconds };
}

export function secondsToReadableTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function validateRaceTargetTime(distanceKm: number, targetTime: string) {
  if (!distanceKm || !targetTime) return null;

  const totalSeconds = parseTimeToSeconds(targetTime);
  if (totalSeconds === null) {
    return "Le temps cible doit être défini au format heures, minutes et secondes.";
  }

  const { minSeconds, maxSeconds } = getTargetTimeGuardrail(distanceKm);
  if (totalSeconds < minSeconds || totalSeconds > maxSeconds) {
    return `Le temps cible semble aberrant pour ${distanceKm} km. Restez entre ${secondsToReadableTime(minSeconds)} et ${secondsToReadableTime(maxSeconds)}.`;
  }

  return null;
}

export function getPlanPhaseLabel(weekNumber: number, durationWeeks: number) {
  if (weekNumber >= durationWeeks - 1) return "Affûtage";
  if (weekNumber === durationWeeks - 2) return "Pic";
  if (weekNumber % 4 === 0) return "Récupération";
  if (weekNumber <= Math.ceil(durationWeeks / 3)) return "Base";
  if (weekNumber <= Math.ceil((durationWeeks * 2) / 3)) return "Construction";
  return "Spécifique";
}
