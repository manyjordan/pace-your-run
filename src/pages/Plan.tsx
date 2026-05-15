import { useEffect, useMemo, useState } from "react";
import { differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { AppCard } from "@/components/ui/page-layout";
import GoalTab from "@/components/plan/GoalTab";
import type { Session, TrainingPlan } from "@/lib/plans/types";
import { getPlanById, mapSessionsToDays } from "@/lib/plans";
import { resolveTrainingPlan } from "@/lib/trainingPlan";
import { selectPlan } from "@/lib/planSelector";
import { calculateWeeksAvailable, mapDistanceToTargetDistance } from "@/lib/goalHelpers";

type PlanGoal = {
  goalType?: string;
  goal_type?: string;
  raceType?: string;
  race_type?: string;
  raceDistanceKm?: string;
  target_distance_km?: number | string;
  raceTargetDate?: string;
  target_date?: string;
  distanceKm?: string;
  distanceTargetDate?: string;
  weightTargetDate?: string;
  selectedPlanId?: string;
  embeddedPlan?: unknown;
};

const DAY_ORDER: Record<string, number> = {
  lun: 0,
  mar: 1,
  mer: 2,
  jeu: 3,
  ven: 4,
  sam: 5,
  dim: 6,
};

function planLevelLabel(level: TrainingPlan["level"]): string {
  switch (level) {
    case "finisher":
      return "Débutant";
    case "performance":
      return "Intermédiaire";
    case "competitor":
      return "Avancé";
    case "elite":
      return "Elite";
    default:
      return level;
  }
}

function sessionIntensityColor(intensity: Session["intensity"]): string {
  if (intensity === "easy") return "#4ade80";
  if (intensity === "hard") return "#f43f5e";
  if (intensity === "race") return "hsl(var(--accent))";
  return "#fb923c";
}

export default function PlanPage() {
  const { session } = useAuth();
  const { profile } = useData();
  const userGoal = useMemo((): PlanGoal | null => {
    const gd = profile?.goal_data;
    if (gd && typeof gd === "object" && !Array.isArray(gd)) return gd as PlanGoal;
    return null;
  }, [profile?.goal_data]);

  const availableDays = profile?.available_days ?? [];
  const normalizedGoalType = userGoal?.goalType || userGoal?.goal_type || profile?.goal_type || "";
  const normalizedRaceType = userGoal?.raceType || userGoal?.race_type || "";
  const numericTargetDistance = Number.parseFloat(
    String(userGoal?.target_distance_km ?? userGoal?.raceDistanceKm ?? userGoal?.distanceKm ?? "0"),
  );
  const targetDate =
    userGoal?.target_date ||
    userGoal?.raceTargetDate ||
    userGoal?.distanceTargetDate ||
    userGoal?.weightTargetDate ||
    null;
  const daysUntilGoal = useMemo(() => {
    if (!targetDate) return null;
    return differenceInDays(new Date(targetDate), new Date());
  }, [targetDate]);
  const goalIsExpired = daysUntilGoal !== null && daysUntilGoal < 0;

  const [forceGoalReset, setForceGoalReset] = useState(false);

  useEffect(() => {
    const onGoalUpdated = () => setForceGoalReset(false);
    window.addEventListener("pace-goal-updated", onGoalUpdated);
    return () => window.removeEventListener("pace-goal-updated", onGoalUpdated);
  }, []);

  const goalLabel = useMemo(() => {
    if (!normalizedGoalType || normalizedGoalType === "none") return null;
    if (normalizedGoalType === "race") {
      if (normalizedRaceType === "marathon") return "Marathon";
      if (normalizedRaceType === "semi") return "Semi-marathon";
      if (normalizedRaceType === "20k") return "20 km";
      if (normalizedRaceType === "10k") return "10 km";
      if (normalizedRaceType === "5k") return "5 km";
      if (userGoal?.raceDistanceKm) return `${userGoal.raceDistanceKm} km`;
      return "Course";
    }
    if (normalizedGoalType === "distance") return "Objectif distance";
    if (normalizedGoalType === "weight") return "Objectif poids";
    return null;
  }, [normalizedGoalType, normalizedRaceType, userGoal?.raceDistanceKm]);

  const selectedPlan = useMemo((): TrainingPlan | null => {
    if (!normalizedGoalType || normalizedGoalType === "none") return null;

    const ug = userGoal as {
      selectedPlanId?: string;
      level?: string;
      fitnessLevel?: string;
      distanceKm?: string;
    } | null;

    let basePlan: TrainingPlan | null = resolveTrainingPlan(userGoal) ?? null;
    if (!basePlan && ug?.selectedPlanId) {
      basePlan = getPlanById(ug.selectedPlanId) ?? null;
    }

    const level =
      ug?.level === "intermediate" || ug?.fitnessLevel === "intermediate"
        ? "intermediate"
        : ug?.level === "advanced" || ug?.fitnessLevel === "advanced"
          ? "advanced"
          : "beginner";

    const daysCount = availableDays.length >= 2 ? Math.min(5, availableDays.length) : 3;

    let targetDistance: "5k" | "10k" | "20k" | "semi" | "marathon" | undefined;
    if (normalizedGoalType === "race") {
      if (normalizedRaceType === "marathon" || numericTargetDistance >= 40) targetDistance = "marathon";
      else if (normalizedRaceType === "semi" || (numericTargetDistance >= 20 && numericTargetDistance < 40))
        targetDistance = "semi";
      else if (normalizedRaceType === "10k" || (numericTargetDistance >= 10 && numericTargetDistance < 20))
        targetDistance = "10k";
      else if (normalizedRaceType === "5k" || (numericTargetDistance > 0 && numericTargetDistance < 10))
        targetDistance = "5k";
      else if (normalizedRaceType === "20k") targetDistance = "20k";
    } else if (normalizedGoalType === "distance") {
      const km = Number.parseFloat(String(ug?.distanceKm ?? "0").replace(",", "."));
      if (Number.isFinite(km) && km > 0) {
        const raw = mapDistanceToTargetDistance(km);
        targetDistance = raw === "20k" ? "semi" : raw;
      }
    }

    const weeksAvailable = targetDate ? calculateWeeksAvailable(targetDate) : undefined;

    if (!basePlan) {
      basePlan = selectPlan({
        goal: normalizedGoalType === "weight" ? "weight" : normalizedGoalType === "race" ? "race" : "distance",
        targetDistance,
        level,
        daysPerWeek: daysCount,
        availableDays: availableDays.length >= 2 ? availableDays : undefined,
        weeksAvailable,
      });
    }

    if (!basePlan) return null;
    return availableDays.length > 0 ? mapSessionsToDays(basePlan, availableDays) : basePlan;
  }, [
    availableDays,
    normalizedGoalType,
    normalizedRaceType,
    numericTargetDistance,
    targetDate,
    userGoal,
    profile?.goal_type,
  ]);

  const currentPlanWeekIndex = useMemo((): number => {
    if (!targetDate || !selectedPlan) return 1;
    const weeksUntilRace = Math.ceil(differenceInDays(new Date(targetDate), new Date()) / 7);
    const week = selectedPlan.durationWeeks - weeksUntilRace + 1;
    return Math.max(1, Math.min(week, selectedPlan.durationWeeks));
  }, [targetDate, selectedPlan]);

  const currentPlanWeek = selectedPlan?.weeklySchedule[currentPlanWeekIndex - 1];

  const sessionsThisWeek = useMemo((): Session[] => {
    if (!currentPlanWeek?.sessions?.length) return [];
    return [...currentPlanWeek.sessions].sort((a, b) => {
      const dayA = DAY_ORDER[a.day.trim().toLowerCase().slice(0, 3)] ?? 99;
      const dayB = DAY_ORDER[b.day.trim().toLowerCase().slice(0, 3)] ?? 99;
      return dayA - dayB;
    });
  }, [currentPlanWeek?.sessions]);

  const hasNoGoal =
    !userGoal
      ? !profile?.goal_type || profile.goal_type === "none"
      : !normalizedGoalType || normalizedGoalType === "none";

  const showGoalEditor = hasNoGoal || forceGoalReset;
  const hasActiveGoal =
    Boolean(normalizedGoalType && normalizedGoalType !== "none") && !goalIsExpired && !showGoalEditor;

  const goalProgressWidth = useMemo(() => {
    if (daysUntilGoal === null || daysUntilGoal <= 0) return 0;
    const horizon = (selectedPlan?.durationWeeks ?? 26) * 7;
    return Math.min(100, Math.max(3, 100 - (daysUntilGoal / horizon) * 100));
  }, [daysUntilGoal, selectedPlan?.durationWeeks]);

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-safe" />

      <div className="px-4 space-y-3 pb-32">
        {showGoalEditor ? (
          <>
            <div className="pt-2">
              <h1 className="text-xl font-bold text-foreground">Mon objectif</h1>
              <p className="text-sm text-muted-foreground">Définissez votre objectif et votre plan</p>
            </div>
            <GoalTab
              userId={session?.user?.id ?? ""}
              forceReset={forceGoalReset}
              onResetHandled={() => setForceGoalReset(false)}
            />
          </>
        ) : goalIsExpired ? (
          <div className="flex flex-col items-center space-y-5 px-2 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Target className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Course terminée</h2>
              <p className="mt-1 text-sm text-muted-foreground">Prêt pour un nouvel objectif ?</p>
            </div>
            <button
              type="button"
              onClick={() => setForceGoalReset(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white transition-all active:scale-95"
            >
              <Target className="h-4 w-4" />
              Définir un nouvel objectif
            </button>
          </div>
        ) : (
          <>
            {selectedPlan && currentPlanWeek ? (
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Cette semaine</p>
                <AppCard>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">
                        Semaine {currentPlanWeek.weekNumber}/{selectedPlan.durationWeeks}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{currentPlanWeek.focus}</p>
                    </div>
                    <p className="font-metric text-2xl font-bold text-foreground">
                      {currentPlanWeek.totalDistance}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">km</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    {sessionsThisWeek.map((session, i) => (
                      <div key={`${session.day}-${session.type}-${i}`} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                        <div
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: sessionIntensityColor(session.intensity) }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground">{session.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.day} · {session.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-metric text-sm font-bold text-foreground">{session.distance} km</p>
                          {session.pace ? <p className="text-xs text-muted-foreground">{session.pace}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </AppCard>
              </div>
            ) : null}

            {hasActiveGoal && goalLabel ? (
              <AppCard>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Objectif actuel</p>
                    <p className="text-xl font-bold text-foreground">{goalLabel}</p>
                    {selectedPlan ? <p className="mt-0.5 text-sm font-medium text-accent">{selectedPlan.name}</p> : null}
                    {targetDate && !goalIsExpired ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(targetDate), "dd MMMM yyyy", { locale: fr })}
                      </p>
                    ) : null}
                  </div>
                  {daysUntilGoal !== null && daysUntilGoal > 0 ? (
                    <div className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">J-{daysUntilGoal}</div>
                  ) : null}
                </div>
                {daysUntilGoal !== null && daysUntilGoal > 0 ? (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${goalProgressWidth}%` }} />
                    </div>
                  </div>
                ) : null}
              </AppCard>
            ) : null}

            {selectedPlan ? (
              <AppCard>
                <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Plan sélectionné</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Durée</p>
                    <p className="mt-1 font-bold text-foreground">{selectedPlan.durationWeeks}sem</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Séances</p>
                    <p className="mt-1 font-bold text-accent">{selectedPlan.sessionsPerWeek}j/sem</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Niveau</p>
                    <p className="mt-1 font-bold text-accent">{planLevelLabel(selectedPlan.level)}</p>
                  </div>
                </div>
              </AppCard>
            ) : null}

            {selectedPlan && currentPlanWeek ? (
              <AppCard>
                <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Prochaines semaines</p>
                <div className="space-y-2">
                  {selectedPlan.weeklySchedule
                    .slice(currentPlanWeek.weekNumber, currentPlanWeek.weekNumber + 3)
                    .map((week) => (
                      <div
                        key={week.weekNumber}
                        className="flex items-center justify-between border-b border-border py-2 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-bold text-foreground">Semaine {week.weekNumber}</p>
                          <p className="max-w-[200px] truncate text-xs text-muted-foreground">{week.focus}</p>
                        </div>
                        <p className="font-metric text-sm font-bold text-foreground">{week.totalDistance} km</p>
                      </div>
                    ))}
                </div>
              </AppCard>
            ) : null}

            {!selectedPlan && normalizedGoalType ? (
              <AppCard className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Aucun plan disponible pour cet objectif.</p>
              </AppCard>
            ) : null}

            <button
              type="button"
              onClick={() => setForceGoalReset(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-all active:scale-95"
            >
              Modifier mon objectif
            </button>
          </>
        )}
      </div>
    </div>
  );
}
