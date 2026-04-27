import { useEffect, useMemo, useState } from "react";
import { differenceInDays, endOfWeek, startOfWeek } from "date-fns";
import { Calendar, Footprints, Target } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppCard } from "@/components/ui/page-layout";
import { cn } from "@/lib/utils";
import { cache } from "@/lib/cache";
import { getProfile, getRuns, type RunRow } from "@/lib/database";
import GoalTab from "@/components/plan/GoalTab";
import TrainingTab from "@/components/plan/TrainingTab";
import EquipmentTab from "@/components/plan/EquipmentTab";
import { TRAINING_PLANS, getPlanById, mapSessionsToDays } from "@/lib/plans";
import type { TrainingPlan } from "@/lib/plans/types";

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
};

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

export default function PlanPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const tabParam = searchParams.get("tab");
  const mainTab =
    tabParam === "goal" || tabParam === "training" || tabParam === "equipment" ? tabParam : "goal";
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [userGoal, setUserGoal] = useState<PlanGoal | null>(null);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

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
    const diff = differenceInDays(new Date(targetDate), new Date());
    return Math.max(0, diff);
  }, [targetDate]);
  const weeksUntilGoal = daysUntilGoal !== null ? Math.floor(daysUntilGoal / 7) : null;
  const raceLabel = useMemo(() => {
    if (!userGoal?.goalType) return null;
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
  const runsThisWeek = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return recentRuns.filter((run) => {
      if (!run.started_at) return false;
      const d = new Date(run.started_at);
      return d >= weekStart && d <= weekEnd;
    });
  }, [recentRuns, now]);
  const selectedPlan = useMemo((): TrainingPlan | null => {
    if (!normalizedGoalType) return null;

    let planId: string | null = null;
    if (normalizedGoalType === "marathon" || normalizedRaceType === "marathon" || numericTargetDistance >= 40) {
      planId = "marathon_beginner_4days_16weeks";
    } else if (normalizedGoalType === "semi" || normalizedRaceType === "semi" || numericTargetDistance >= 20) {
      planId = "semi_beginner_3days_16weeks";
    } else if (numericTargetDistance >= 10) {
      planId = "distance_10k_beginner_3days_12weeks";
    } else if (normalizedGoalType === "weight") {
      planId = "weight_beginner_3days_8weeks";
    }

    const exactPlan = planId ? getPlanById(planId) : null;
    const basePlan =
      exactPlan ??
      TRAINING_PLANS.find((plan) => {
        if (normalizedGoalType === "weight") return plan.goal === "weight";
        if (normalizedGoalType === "distance") return plan.goal === "distance";
        if (normalizedRaceType === "marathon" || numericTargetDistance >= 40) return plan.targetDistance === "marathon";
        if (normalizedRaceType === "semi" || numericTargetDistance >= 20) return plan.targetDistance === "semi";
        if (numericTargetDistance >= 10) return plan.targetDistance === "10k";
        return plan.goal === "distance";
      }) ??
      null;

    if (!basePlan) return null;
    return availableDays.length > 0 ? mapSessionsToDays(basePlan, availableDays) : basePlan;
  }, [availableDays, normalizedGoalType, normalizedRaceType, numericTargetDistance]);

  const currentPlanWeek = useMemo((): number => {
    if (!targetDate || !selectedPlan) return 1;
    const weeksUntilRace = Math.ceil(differenceInDays(new Date(targetDate), new Date()) / 7);
    const week = selectedPlan.durationWeeks - weeksUntilRace + 1;
    return Math.max(1, Math.min(week, selectedPlan.durationWeeks));
  }, [targetDate, selectedPlan]);

  const currentWeekData = selectedPlan?.weeklySchedule[currentPlanWeek - 1];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const todayShort = dayNames[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
          <p className="text-sm text-muted-foreground">Objectif, entrainement et equipement</p>
        </div>
      </ScrollReveal>

      {normalizedGoalType && normalizedGoalType !== "none" ? (
        <ScrollReveal>
          <AppCard className="relative overflow-hidden border-accent/20">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10" />
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Objectif</p>
                <p className="text-xl font-bold text-foreground">{raceLabel ?? "Objectif actif"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {targetDistanceKm ? `${targetDistanceKm} km` : ""}
                  {targetDistanceKm && targetTime ? " · " : ""}
                  {targetTime ? `Objectif ${targetTime}` : ""}
                </p>
              </div>
              {daysUntilGoal !== null ? (
                <div className="text-center">
                  <div className="font-metric text-4xl font-black text-accent">{weeksUntilGoal}</div>
                  <div className="text-xs text-muted-foreground">semaines</div>
                </div>
              ) : null}
            </div>
            {daysUntilGoal !== null ? (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Progression</span>
                  <span>{daysUntilGoal} jours restants</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.min(100, Math.max(5, 100 - (daysUntilGoal / 180) * 100))}%` }}
                  />
                </div>
              </div>
            ) : null}
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
                <p className="font-metric text-2xl font-black text-foreground">{currentWeekData.totalDistance}</p>
                <p className="text-xs text-muted-foreground">km cette semaine</p>
              </div>
            </div>

            <div className="space-y-3">
              {currentWeekData.sessions.map((session, i) => {
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

                return (
                  <div
                    key={`${session.day}-${session.type}-${i}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3 transition-all",
                      isToday ? "border border-accent/20 bg-accent/10" : "bg-muted/30",
                    )}
                  >
                    <div className="h-12 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{session.type}</p>
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

      <Tabs key={mainTab} defaultValue={mainTab} className="space-y-4">
        <ScrollReveal>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="goal"><Target className="mr-1 h-4 w-4" /> Objectif</TabsTrigger>
            <TabsTrigger value="training"><Calendar className="mr-1 h-4 w-4" /> Plan</TabsTrigger>
            <TabsTrigger value="equipment"><Footprints className="mr-1 h-4 w-4" /> Equip.</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="goal"><GoalTab /></TabsContent>
        <TabsContent value="training"><TrainingTab /></TabsContent>
        <TabsContent value="equipment"><EquipmentTab /></TabsContent>
      </Tabs>
    </div>
  );
}
