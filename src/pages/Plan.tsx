import { useEffect, useMemo, useState } from "react";
import { differenceInDays, endOfWeek, startOfWeek } from "date-fns";
import { Calendar, Footprints, Target, Zap } from "lucide-react";
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

type PlanGoal = {
  goalType?: string;
  raceType?: string;
  raceDistanceKm?: string;
  raceTargetTime?: string;
  raceTargetDate?: string;
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

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setRecentRuns([]);
      setUserGoal(null);
      return;
    }

    const cachedRuns = cache.get<RunRow[]>(`runs_${userId}`);
    if (cachedRuns) setRecentRuns(cachedRuns);
    const cachedProfile = cache.get<{ goal_data?: unknown }>(`profile_${userId}`);
    if (cachedProfile?.goal_data && typeof cachedProfile.goal_data === "object" && !Array.isArray(cachedProfile.goal_data)) {
      setUserGoal(cachedProfile.goal_data as PlanGoal);
    }

    void Promise.all([getProfile(userId), getRuns(userId)])
      .then(([profile, runs]) => {
        setRecentRuns(runs ?? []);
        if (profile?.goal_data && typeof profile.goal_data === "object" && !Array.isArray(profile.goal_data)) {
          setUserGoal(profile.goal_data as PlanGoal);
        } else {
          setUserGoal(null);
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const targetDate = userGoal?.raceTargetDate || userGoal?.distanceTargetDate || userGoal?.weightTargetDate || null;
  const daysUntilGoal = useMemo(() => {
    if (!targetDate) return null;
    const diff = differenceInDays(new Date(targetDate), new Date());
    return Math.max(0, diff);
  }, [targetDate]);
  const weeksUntilGoal = daysUntilGoal !== null ? Math.floor(daysUntilGoal / 7) : null;
  const raceLabel = useMemo(() => {
    if (!userGoal?.goalType) return null;
    if (userGoal.goalType === "race") {
      if (userGoal.raceType === "marathon") return "Marathon";
      if (userGoal.raceType === "semi") return "Semi-marathon";
      if (userGoal.raceType === "20k") return "20 km";
      if (userGoal.raceType === "10k") return "10 km";
      if (userGoal.raceType === "5k") return "5 km";
      if (userGoal.raceDistanceKm) return `${userGoal.raceDistanceKm} km`;
      return "Course";
    }
    if (userGoal.goalType === "distance") return "Objectif distance";
    if (userGoal.goalType === "weight") return "Objectif poids";
    return null;
  }, [userGoal]);
  const targetDistanceKm = userGoal?.goalType === "race" ? userGoal.raceDistanceKm : userGoal?.distanceKm;
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
  const nextSessionSuggestion = useMemo(() => {
    if (!recentRuns?.length || !recentRuns[0]?.started_at) return null;
    const lastRun = recentRuns[0];
    const daysSinceLastRun = differenceInDays(new Date(), new Date(lastRun.started_at));
    if (daysSinceLastRun === 0) {
      return { type: "rest", label: "Recuperation", description: "Vous avez couru aujourd'hui, reposez-vous !" };
    }
    if (daysSinceLastRun >= 3) {
      return {
        type: "easy",
        label: "Course facile",
        description: `${Math.min(8, (lastRun.distance_km ?? 5) * 0.8).toFixed(0)} km en endurance fondamentale`,
      };
    }
    return {
      type: "tempo",
      label: "Sortie tempo",
      description: `${Math.min(10, lastRun.distance_km ?? 6).toFixed(0)} km a allure marathon`,
    };
  }, [recentRuns]);

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
          <p className="text-sm text-muted-foreground">Objectif, entrainement et equipement</p>
        </div>
      </ScrollReveal>

      {userGoal?.goalType && userGoal.goalType !== "none" ? (
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

      {nextSessionSuggestion ? (
        <ScrollReveal>
          <AppCard className="border-accent/20">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Prochaine seance suggeree</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{nextSessionSuggestion.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{nextSessionSuggestion.description}</p>
              </div>
            </div>
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
