import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ScrollReveal } from "@/components/ScrollReveal";
import { chartTooltipStyle, CompactWeekTick } from "@/components/dashboard/chartShared";
import { Calendar, Route, Clock, type LucideIcon } from "lucide-react";
import type { RunRow } from "@/lib/database";
import type { MetricChartPeriod, MetricKind } from "@/lib/dashboardHelpers";
import { formatDashboardTooltipForKind } from "@/lib/dashboardHelpers";
import { getPlanById } from "@/lib/trainingPlans";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  icon: LucideIcon;
  color: string;
  metricKind: MetricKind;
  chartData: Array<{ week: string; value: number; showTick?: boolean; barLabel?: string }>;
  comment: string;
  granularity?: "week" | "month" | "quarter";
  period?: MetricChartPeriod;
};

type DashboardPeriod = Extract<MetricChartPeriod, "3m" | "6m" | "1y" | "all">;

function periodRangeLabel(p: DashboardPeriod): string {
  if (p === "3m") return "les 3 derniers mois";
  if (p === "6m") return "les 6 derniers mois";
  if (p === "1y") return "la dernière année";
  return "tout l'historique";
}

function metricSubtitle(kind: MetricKind, period: DashboardPeriod): string {
  const range = periodRangeLabel(period);
  const bucket = period === "all" ? "trimestre" : period === "1y" ? "mois" : "semaine";
  if (kind === "distance") return `Kilomètres cumulés par ${bucket} sur ${range}.`;
  if (kind === "duration") return `Temps total d'activité par ${bucket} sur ${range}.`;
  return `Dénivelé positif cumulé par ${bucket} sur ${range}.`;
}

export const DashboardSection = ({
  recentRuns,
  userGoal,
  filteredMetrics,
  period,
  onPeriodChange,
}: {
  recentRuns: RunRow[];
  userGoal: ProfileGoalData | null;
  filteredMetrics: WeeklyMetricCard[];
  period: DashboardPeriod;
  onPeriodChange: (p: DashboardPeriod) => void;
}) => {
  const computedUpcomingSessions = useMemo<UpcomingSession[]>(() => {
    const profileWithPlan = userGoal as (ProfileGoalData & { selectedPlanId?: string; goalSavedAt?: string }) | null;

    if (!profileWithPlan?.selectedPlanId) {
      return [];
    }

    try {
      const plan = getPlanById(profileWithPlan.selectedPlanId);
      if (!plan) return [];

      // Calculate current week
      let currentWeek = 1;
      if (profileWithPlan.goalSavedAt) {
        const savedDate = new Date(profileWithPlan.goalSavedAt);
        const now = new Date();
        const weeksDiff = Math.floor((now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        currentWeek = Math.min(Math.max(1, weeksDiff + 1), plan.durationWeeks);
      }

      const currentWeekData = plan.weeklySchedule.find((w) => w.week === currentWeek);
      if (!currentWeekData) return [];

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
      return [];
    }
  }, [userGoal]);

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
  const latestRuns = useMemo(() => recentRuns.slice(0, 3), [recentRuns]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">Période</p>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-muted/50">
          {(["3m", "6m", "1y", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                period === p
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p === "3m" ? "3 mois" : p === "6m" ? "6 mois" : p === "1y" ? "1 an" : "Tout"}
            </button>
          ))}
        </div>
      </div>

      {filteredMetrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <ScrollReveal key={metric.title} delay={index === 0 ? 0 : index < 3 ? 0.05 : 0}>
            <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
              <div className="mb-4 flex items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">{metric.title}</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{metricSubtitle(metric.metricKind, period)}</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold tabular-nums">{metric.currentValue}</span>
                <p className="mt-1 text-xs text-muted-foreground">semaine en cours</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.change}</p>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metric.chartData} margin={{ top: 8, right: 4, left: 4, bottom: 16 }}>
                    <defs>
                      <linearGradient id={`dashboardGradient-${metric.metricKind}-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="week"
                      axisLine={false}
                      tickLine={false}
                      height={64}
                      tick={<CompactWeekTick granularity={metric.granularity ?? "week"} />}
                      interval={0}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value) => formatDashboardTooltipForKind(metric.metricKind, Number(value))}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      fill={`url(#dashboardGradient-${metric.metricKind}-${index})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>
        );
      })}

      <div className="grid gap-6 md:grid-cols-2">
        <ScrollReveal>
          <div className="overflow-hidden rounded-xl border-2 border-accent/60 bg-card shadow-[0_14px_34px_hsl(var(--accent)/0.12)]">
            <div className="bg-accent/20 px-5 py-3">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">Vos dernières activités</span>
              </div>
            </div>
            <div className="p-5">
              {latestRuns.length > 0 ? (
                <div className="space-y-3">
                  {latestRuns.map((run) => (
                    <div key={run.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{run.title || "Course enregistrée"}</p>
                          {run.run_type === "treadmill" && (
                            <Badge variant="outline" className="mt-1 border-muted-foreground/30 text-xs text-muted-foreground">
                              Tapis roulant
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {run.started_at
                              ? new Date(run.started_at).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : "Date indisponible"}
                          </p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{run.distance_km.toFixed(1)} km</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="tabular-nums">
                          {Math.floor(run.duration_seconds / 3600) > 0
                            ? `${Math.floor(run.duration_seconds / 3600)}h ${String(Math.floor((run.duration_seconds % 3600) / 60)).padStart(2, "0")}min`
                            : `${Math.round(run.duration_seconds / 60)} min`}
                        </span>
                        {run.average_pace && (
                          <>
                            <span className="text-border">·</span>
                            <span className="tabular-nums">
                              {Math.floor(run.average_pace)}:{String(Math.round((run.average_pace % 1) * 60)).padStart(2, "0")} /km
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune activité enregistrée pour le moment. Importez votre historique ou lancez votre première course depuis l'app.
                </p>
              )}
            </div>
          </div>
        </ScrollReveal>

        {computedUpcomingSessions.length > 0 ? (
          <ScrollReveal>
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
        ) : null}
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
