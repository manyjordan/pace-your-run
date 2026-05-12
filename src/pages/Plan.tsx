import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInDays, endOfWeek, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Check, Footprints, Target, Trophy } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppCard } from "@/components/ui/page-layout";
import { cn } from "@/lib/utils";
import { cache } from "@/lib/cache";
import { getProfile, getRuns, type RunRow } from "@/lib/database";
import GoalTab from "@/components/plan/GoalTab";
import EquipmentTab from "@/components/plan/EquipmentTab";
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
  raceTargetTime?: string;
  raceTargetDate?: string;
  target_date?: string;
  distanceKm?: string;
  distanceTargetDate?: string;
  weightTargetDate?: string;
  selectedPlanId?: string;
  embeddedPlan?: unknown;
};

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_ORDER: Record<string, number> = {
  lun: 0,
  mar: 1,
  mer: 2,
  jeu: 3,
  ven: 4,
  sam: 5,
  dim: 6,
};

/** Monday = 0 … Sunday = 6 (aligned with `runsThisWeek` day index). */
function sessionDayIndex(session: Session): number {
  const n = session.day.trim().toLowerCase();
  if (n.startsWith("lun")) return 0;
  if (n.startsWith("mer")) return 2;
  if (n.startsWith("mar")) return 1;
  if (n.startsWith("jeu")) return 3;
  if (n.startsWith("ven")) return 4;
  if (n.startsWith("sam")) return 5;
  if (n.startsWith("dim")) return 6;
  return -1;
}

export default function PlanPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const tabParam = searchParams.get("tab");
  const mainTab = tabParam === "goal" || tabParam === "equipment" ? tabParam : "goal";
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [userGoal, setUserGoal] = useState<PlanGoal | null>(null);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem("pace_user_id");
    if (!userId) return;
    const cachedRuns = cache.get<RunRow[]>(`runs_${userId}`);
    if (cachedRuns) setRecentRuns(cachedRuns);
    const cachedProfile = cache.get<{ goal_data?: unknown; available_days?: string[] }>(`profile_${userId}`);
    if (cachedProfile?.goal_data && typeof cachedProfile.goal_data === "object" && !Array.isArray(cachedProfile.goal_data)) {
      setUserGoal(cachedProfile.goal_data as PlanGoal);
    }
    setAvailableDays(cachedProfile?.available_days ?? []);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setRecentRuns([]);
      setUserGoal(null);
      setAvailableDays([]);
      return;
    }

    const cachedRuns = cache.get<RunRow[]>(`runs_${userId}`);
    if (cachedRuns) setRecentRuns(cachedRuns);
    const cachedProfile = cache.get<{ goal_data?: unknown }>(`profile_${userId}`);
    if (cachedProfile?.goal_data && typeof cachedProfile.goal_data === "object" && !Array.isArray(cachedProfile.goal_data)) {
      setUserGoal(cachedProfile.goal_data as PlanGoal);
    }
    const cachedProfileWithDays = cache.get<{ available_days?: string[] }>(`profile_${userId}`);
    setAvailableDays(cachedProfileWithDays?.available_days ?? []);

    void Promise.all([getProfile(userId), getRuns(userId)])
      .then(([profile, runs]) => {
        setRecentRuns(runs ?? []);
        if (profile?.goal_data && typeof profile.goal_data === "object" && !Array.isArray(profile.goal_data)) {
          setUserGoal(profile.goal_data as PlanGoal);
        } else {
          setUserGoal(null);
        }
        setAvailableDays(profile?.available_days ?? []);
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const normalizedGoalType = userGoal?.goalType || userGoal?.goal_type || "";
  const normalizedRaceType = userGoal?.raceType || userGoal?.race_type || "";
  const numericTargetDistance = Number.parseFloat(
    String(userGoal?.target_distance_km ?? userGoal?.raceDistanceKm ?? userGoal?.distanceKm ?? "0"),
  );
  const targetDate = userGoal?.target_date || userGoal?.raceTargetDate || userGoal?.distanceTargetDate || userGoal?.weightTargetDate || null;
  const daysUntilGoal = useMemo(() => {
    if (!targetDate) return null;
    return differenceInDays(new Date(targetDate), new Date());
  }, [targetDate]);
  const goalIsExpired = daysUntilGoal !== null && daysUntilGoal < 0;
  const [goalTabChangeNonce, setGoalTabChangeNonce] = useState(0);
  const [forceGoalReset, setForceGoalReset] = useState(false);
  const raceLabel = useMemo(() => {
    if (!userGoal?.goalType && !userGoal?.goal_type) return null;
    if (normalizedGoalType === "race") {
      if (normalizedRaceType === "marathon") return "Marathon";
      if (normalizedRaceType === "semi") return "Semi-marathon";
      if (normalizedRaceType === "20k") return "20 km";
      if (normalizedRaceType === "10k") return "10 km";
      if (normalizedRaceType === "5k") return "5 km";
      if (userGoal.raceDistanceKm) return `${userGoal.raceDistanceKm} km`;
      return "Course";
    }
    if (normalizedGoalType === "distance") return "Objectif distance";
    if (normalizedGoalType === "weight") return "Objectif poids";
    return null;
  }, [normalizedGoalType, normalizedRaceType, userGoal]);
  const targetDistanceKm = normalizedGoalType === "race" ? userGoal?.raceDistanceKm : userGoal?.distanceKm;
  const targetTime = userGoal?.raceTargetTime;
  const now = new Date();
  const weekStart = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }), [now]);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 1 }), [now]);
  const runsThisWeek = useMemo(() => {
    return recentRuns.filter((run) => {
      if (!run.started_at) return false;
      const d = new Date(run.started_at);
      return d >= weekStart && d <= weekEnd;
    });
  }, [recentRuns, weekStart, weekEnd]);

  const isSessionCompleted = useCallback(
    (session: Session, _weekNumber: number): boolean => {
      if (!recentRuns?.length) return false;
      const sessionIdx = sessionDayIndex(session);
      if (sessionIdx < 0) return false;
      const planDist = session.distance;
      if (!Number.isFinite(planDist) || planDist <= 0) return false;

      return recentRuns.some((run) => {
        if (!run.started_at) return false;
        const runDate = new Date(run.started_at);
        if (runDate < weekStart || runDate > weekEnd) return false;
        const runDayIndex = runDate.getDay() === 0 ? 6 : runDate.getDay() - 1;
        const sameDay = runDayIndex === sessionIdx;
        const runKm = run.distance_km ?? 0;
        const similarDistance = Math.abs(runKm - planDist) / planDist < 0.3;
        return sameDay && similarDistance;
      });
    },
    [recentRuns, weekStart, weekEnd],
  );
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
  ]);

  const currentPlanWeek = useMemo((): number => {
    if (!targetDate || !selectedPlan) return 1;
    const weeksUntilRace = Math.ceil(differenceInDays(new Date(targetDate), new Date()) / 7);
    const week = selectedPlan.durationWeeks - weeksUntilRace + 1;
    return Math.max(1, Math.min(week, selectedPlan.durationWeeks));
  }, [targetDate, selectedPlan]);

  const currentWeekData = selectedPlan?.weeklySchedule[currentPlanWeek - 1];
  const isLastWeek = Boolean(selectedPlan && currentPlanWeek === selectedPlan.durationWeeks);
  const raceDaySession = useMemo<Session>(
    () => ({
      day: targetDate ? format(new Date(targetDate), "EEE", { locale: fr }) : "Dim",
      type: "race",
      label: "Jour de course",
      distance: (() => {
        const parsed = Number.parseFloat(String(targetDistanceKm ?? "").replace(",", "."));
        return (Number.isFinite(parsed) && parsed > 0 ? parsed : null) ?? (numericTargetDistance > 0 ? numericTargetDistance : 42.195);
      })(),
      pace: "--:--",
      duration: 0,
      description: `🏁 ${raceLabel ?? "Course"} — Bonne course !`,
      intensity: "race",
    }),
    [numericTargetDistance, raceLabel, targetDate, targetDistanceKm],
  );
  const sessionsToShow = useMemo((): Session[] => {
    if (!currentWeekData?.sessions?.length) return [];
    const list = [...currentWeekData.sessions];

    if (isLastWeek && targetDate && !Number.isNaN(new Date(targetDate).getTime())) {
      list.push(raceDaySession);
    }

    return list.sort((a, b) => {
      const dayA = DAY_ORDER[a.day.trim().toLowerCase().slice(0, 3)] ?? 99;
      const dayB = DAY_ORDER[b.day.trim().toLowerCase().slice(0, 3)] ?? 99;
      return dayA - dayB;
    });
  }, [
    currentWeekData?.sessions,
    isLastWeek,
    raceDaySession,
    targetDate,
  ]);
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const todayShort = dayNames[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const raceIsThisWeek = useMemo(() => {
    if (!targetDate) return false;
    const race = new Date(targetDate);
    if (Number.isNaN(race.getTime())) return false;
    return race >= weekStart && race <= weekEnd;
  }, [targetDate, weekStart, weekEnd]);

  const displayTotalKm = useMemo(() => {
    const base = currentWeekData?.totalDistance ?? 0;
    if (!raceIsThisWeek || normalizedGoalType !== "race") return base;
    const parsed = Number.parseFloat(
      String(userGoal?.target_distance_km ?? userGoal?.raceDistanceKm ?? "").replace(",", "."),
    );
    const raceKm = Number.isFinite(parsed) && parsed > 0 ? parsed : numericTargetDistance > 0 ? numericTargetDistance : 0;
    return base + raceKm;
  }, [currentWeekData?.totalDistance, raceIsThisWeek, normalizedGoalType, userGoal, numericTargetDistance]);

  return (
    <Tabs key={mainTab} defaultValue={mainTab} className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
          <p className="text-sm text-muted-foreground">Objectif, entrainement et equipement</p>
        </div>
      </ScrollReveal>

      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        <TabsList className="w-full">
          <TabsTrigger value="goal" className="flex-1">
            Objectif & Plan
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex-1">
            Équipement
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="goal" className="space-y-6">
        <GoalTab
          userId={session?.user?.id ?? ""}
          openChangeGoalNonce={goalTabChangeNonce}
          forceReset={forceGoalReset}
          onResetHandled={() => setForceGoalReset(false)}
        />

        {goalIsExpired ? (
          <ScrollReveal>
            <div className="flex flex-col items-center space-y-5 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-3xl">🏅</div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Course terminée !</h2>
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
          </ScrollReveal>
        ) : (
          <div className="space-y-6">
            {targetDate && daysUntilGoal !== null && daysUntilGoal <= 7 && daysUntilGoal >= 0 ? (
              <ScrollReveal>
                <AppCard className="border-2 border-accent">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">🏁 Jour de course !</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(targetDate), "EEEE dd MMMM yyyy", { locale: fr })}
                      </p>
                      {raceLabel ? (
                        <p className="mt-0.5 text-xs font-semibold text-accent">{raceLabel}</p>
                      ) : null}
                    </div>
                  </div>
                </AppCard>
              </ScrollReveal>
            ) : null}

            <ScrollReveal>
              <AppCard>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cette semaine</h3>
                <div className="flex justify-between">
                  {DAYS.map((day, i) => {
                    const dayIndex = i === 6 ? 0 : i + 1;
                    const isToday = dayIndex === now.getDay();
                    const hasRun = runsThisWeek.some((run) => run.started_at && new Date(run.started_at).getDay() === dayIndex);
                    return (
                      <div key={`${day}-${i}`} className="flex flex-col items-center gap-2">
                        <span className={cn("text-xs font-medium", isToday ? "text-accent" : "text-muted-foreground")}>{day}</span>
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                            hasRun ? "bg-accent text-white" : isToday ? "border-2 border-accent text-accent" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {hasRun ? "✓" : isToday ? "•" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AppCard>
            </ScrollReveal>

            {selectedPlan && currentWeekData ? (
              <ScrollReveal>
                <AppCard>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{selectedPlan.name}</p>
                      <p className="font-semibold text-foreground">
                        Semaine {currentPlanWeek}/{selectedPlan.durationWeeks}
                      </p>
                      <p className="mt-0.5 text-xs text-accent">{currentWeekData.focus}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-metric text-2xl font-black text-foreground">{displayTotalKm}</p>
                      <p className="text-xs text-muted-foreground">km cette semaine</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sessionsToShow.map((session, i) => {
                      const intensityColors: Record<string, string> = {
                        easy: "#4ade80",
                        moderate: "#60a5fa",
                        tempo: "#fb923c",
                        interval: "#f43f5e",
                        race: "#1DB954",
                      };
                      const color = intensityColors[session.intensity] ?? "#9CA3AF";
                      const normalizedDay = session.day.toLowerCase();
                      const isToday =
                        normalizedDay.startsWith(todayShort.toLowerCase()) ||
                        (todayShort === "Lun" && normalizedDay.startsWith("lundi")) ||
                        (todayShort === "Mar" && normalizedDay.startsWith("mardi")) ||
                        (todayShort === "Mer" && normalizedDay.startsWith("mercredi")) ||
                        (todayShort === "Jeu" && normalizedDay.startsWith("jeudi")) ||
                        (todayShort === "Ven" && normalizedDay.startsWith("vendredi")) ||
                        (todayShort === "Sam" && normalizedDay.startsWith("samedi")) ||
                        (todayShort === "Dim" && normalizedDay.startsWith("dimanche"));
                      const completed = isSessionCompleted(session, currentPlanWeek);

                      return (
                        <div
                          key={`${session.day}-${session.type}-${i}`}
                          className={cn(
                            "flex items-center gap-3 rounded-xl p-3 transition-all",
                            completed
                              ? "border border-accent/20 bg-accent/10 opacity-75"
                              : isToday
                                ? "border border-accent/20 bg-accent/10"
                                : "bg-muted/30",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
                              completed ? "bg-accent" : "bg-muted",
                            )}
                          >
                            {completed ? (
                              <Check className="h-3.5 w-3.5 text-white" />
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{session.label}</p>
                              {isToday ? (
                                <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs font-medium text-white">
                                  Aujourd&apos;hui
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {session.day} · {session.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="font-metric text-sm font-bold text-foreground">{session.distance} km</p>
                            <p className="text-xs text-muted-foreground">{session.pace}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AppCard>
              </ScrollReveal>
            ) : null}

            {selectedPlan && currentPlanWeek < selectedPlan.durationWeeks ? (
              <ScrollReveal>
                <AppCard>
                  <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Prochaines semaines</p>
                  <div className="space-y-2">
                    {selectedPlan.weeklySchedule.slice(currentPlanWeek, currentPlanWeek + 3).map((week, i) => (
                      <div
                        key={`next-week-${week.week}-${i}`}
                        className="flex items-center justify-between border-b border-border py-2 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">Semaine {currentPlanWeek + 1 + i}</p>
                          <p className="max-w-[200px] truncate text-xs text-muted-foreground">{week.focus}</p>
                        </div>
                        <p className="font-metric text-sm font-bold text-foreground">{week.totalDistance} km</p>
                      </div>
                    ))}
                  </div>
                </AppCard>
              </ScrollReveal>
            ) : null}

            {!selectedPlan && normalizedGoalType ? (
              <ScrollReveal>
                <AppCard className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">Aucun plan disponible pour cet objectif.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Modifiez votre objectif pour accéder aux plans d&apos;entraînement.
                  </p>
                </AppCard>
              </ScrollReveal>
            ) : null}
          </div>
        )}
      </TabsContent>
      <TabsContent value="equipment">
        <EquipmentTab />
      </TabsContent>
    </Tabs>
  );
}
