import { useMemo } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Zap, Play, Calendar, Route, Clock, Flame } from "lucide-react";
import { getPlanById } from "@/lib/trainingPlans";
import type { StravaActivity } from "@/lib/strava";
import { formatDistance, formatDuration, formatPace } from "@/lib/strava";

type ProfileGoalData = {
  goalType: "weight" | "race" | "distance";
  raceType: "marathon" | "semi" | "20k" | "10k" | "5k" | "other";
  raceDistanceKm: string;
  raceTargetDate: string;
  raceTargetTime: string;
  distanceKm?: string;
  targetWeightKg?: string;
  selectedPlanId?: string;
  goalSavedAt?: string;
};

type UpcomingSession = {
  type: string;
  distance: string;
  pace: string;
  day: string;
  color: string;
};

type WeeklyMetricCard = {
  title: string;
  unit: string;
  currentValue: string;
  change: string;
  icon: any;
  color: string;
  chartData: Array<{ week: string; value: number; showTick?: boolean }>;
  comment: string;
  granularity?: "week" | "month" | "quarter";
  period?: "1m" | "3m" | "1y" | "all";
};

const upcomingSessions = [
  { type: "Sortie tempo", distance: "8km", pace: "4:45/km", day: "Demain", color: "hsl(var(--lime))" },
  { type: "Récupération facile", distance: "5km", pace: "5:30/km", day: "Mercredi", color: "hsl(38, 92%, 50%)" },
  { type: "Intervalles", distance: "10km", pace: "4:15/km", day: "Vendredi", color: "hsl(0, 72%, 51%)" },
];

export const DashboardSection = ({
  metricCards,
  latestActivity,
  userGoal,
  activities,
  onOpenActivityDetail,
  filteredMetrics,
}: {
  metricCards: WeeklyMetricCard[];
  latestActivity: StravaActivity | null;
  userGoal: ProfileGoalData | null;
  activities: StravaActivity[];
  onOpenActivityDetail: (activity: StravaActivity) => void;
  filteredMetrics: WeeklyMetricCard[];
}) => {
  const computedUpcomingSessions = useMemo(() => {
    const profileWithPlan = userGoal as (ProfileGoalData & { selectedPlanId?: string; goalSavedAt?: string }) | null;

    if (!profileWithPlan?.selectedPlanId) {
      return upcomingSessions;
    }

    try {
      const plan = getPlanById(profileWithPlan.selectedPlanId);
      if (!plan) return upcomingSessions;

      // Calculate current week
      let currentWeek = 1;
      if (profileWithPlan.goalSavedAt) {
        const savedDate = new Date(profileWithPlan.goalSavedAt);
        const now = new Date();
        const weeksDiff = Math.floor((now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        currentWeek = Math.min(Math.max(1, weeksDiff + 1), plan.durationWeeks);
      }

      const currentWeekData = plan.weeklySchedule.find((w) => w.week === currentWeek);
      if (!currentWeekData) return upcomingSessions;

      // Convert sessions to UpcomingSession format, showing only future sessions
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysMap: Record<string, number> = {
        Lun: 1,
        Mar: 2,
        Mer: 3,
        Jeu: 4,
        Ven: 5,
        Sam: 6,
        Dim: 0,
      };

      const intensityColors: Record<string, string> = {
        easy: "hsl(200, 80%, 55%)",
        moderate: "hsl(200, 100%, 50%)",
        tempo: "hsl(38, 92%, 50%)",
        interval: "hsl(0, 72%, 51%)",
        race: "hsl(270, 100%, 60%)",
      };

      return currentWeekData.sessions
        .filter((session) => {
          const sessionDay = daysMap[session.day] || 0;
          if (dayOfWeek === 0) return true; // Sunday, show all
          return sessionDay >= dayOfWeek;
        })
        .map((session, idx) => ({
          type: session.type,
          distance: `${session.distance.toFixed(1)}km`,
          pace: session.pace,
          day: session.day,
          color: intensityColors[session.intensity] || intensityColors["easy"],
        })) as UpcomingSession[];
    } catch {
      return upcomingSessions;
    }
  }, [userGoal]);

  const latestActivityCalories = latestActivity ? Math.round((latestActivity.distance / 1000) * 62) : 1050;

  const upcomingRace = userGoal?.goalType === "race" && userGoal?.raceTargetDate
    ? {
        name: `${userGoal.raceDistanceKm} km${userGoal.raceType ? ` (${userGoal.raceType})` : ""}`,
        date: userGoal.raceTargetDate,
        targetTime: userGoal.raceTargetTime || "",
      }
    : null;

  const calculateDaysLeft = (targetDate: string) => {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = upcomingRace ? calculateDaysLeft(upcomingRace.date) : 18;
  const handleActivityDetailsClick = () => {
    if (latestActivity) {
      onOpenActivityDetail(latestActivity);
    }
  };

  return (
    <div className="space-y-6">
      {filteredMetrics.map((metric) => (
        <ScrollReveal key={metric.title} delay={Math.random() * 0.1}>
          <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
            <div className="mb-4">
              <span className="text-3xl font-bold tabular-nums">{metric.currentValue}</span>
              <p className="mt-1 text-xs text-muted-foreground">{metric.change}</p>
            </div>
          </div>
        </ScrollReveal>
      ))}

      <div className="grid gap-6 md:grid-cols-2">
        <ScrollReveal>
          <div className="overflow-hidden rounded-xl border-2 border-accent/60 bg-card shadow-[0_14px_34px_hsl(var(--accent)/0.12)]">
            <div className="bg-accent/20 px-5 py-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-lime" />
                <span className="text-sm font-semibold">
                  {latestActivity ? "Dernière activité Strava" : "Synchronisation Strava requise"}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold">{latestActivity?.name ?? "Aucune activité importée"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestActivity
                  ? `${formatDistance(latestActivity.distance)} à ${formatPace(latestActivity.distance, latestActivity.moving_time)} · activité synchronisée depuis Strava`
                  : "Connecte Strava puis synchronise une activité pour voir tes vraies données ici."}
              </p>
              <div className="mt-4 flex gap-6 text-xs">
                <div className="flex items-center gap-1.5"><Route className="h-3.5 w-3.5 text-muted-foreground" /><span className="tabular-nums">{latestActivity ? formatDistance(latestActivity.distance) : "--"}</span></div>
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="tabular-nums">{latestActivity ? formatDuration(latestActivity.moving_time) : "--"}</span></div>
                <div className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-muted-foreground" /><span className="tabular-nums">{latestActivity ? `~${latestActivityCalories} kcal` : "--"}</span></div>
              </div>
              {latestActivity ? (
                <button
                  onClick={handleActivityDetailsClick}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.97]"
                >
                  <Play className="h-4 w-4" /> Voir plus de détails sur l'activité
                </button>
              ) : (
                <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground/70">
                  <Play className="h-4 w-4" /> Aucune donnée Strava
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Séances à venir</h2>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {computedUpcomingSessions.map((session) => (
                <div key={`${session.day}-${session.type}`} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                  <div className="h-10 w-1 rounded-full" style={{ backgroundColor: session.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{session.type}</p>
                    <p className="text-xs text-muted-foreground">{session.distance} · {session.pace}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{session.day}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {upcomingRace && (
        <ScrollReveal>
          <div className="rounded-xl border border-accent/30 bg-card/85 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Objectif</p>
            <h3 className="mt-1 text-xl font-bold">{upcomingRace.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {`Le ${new Date(upcomingRace.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}`}
              {upcomingRace.targetTime ? ` · Objectif ${upcomingRace.targetTime}` : ""}
            </p>
            <div className="mt-4 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-4 py-2">
              <span className="text-2xl font-black tabular-nums text-foreground">{daysLeft}</span>
              <span className="ml-2 text-sm font-medium text-muted-foreground">jours restants</span>
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};
