import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock, Flame, Mountain, Route, TrendingUp, Zap,
  Calendar, Play, Award, Activity, List, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LabelList,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import {
  activityToCommunityPost,
  buildAcwrSeries,
  buildVo2Series,
  formatDistance,
  formatDuration,
  formatHoursAndMinutes,
  formatPace,
  getLatestActivity,
  getPersonalRecords,
  type StravaActivity,
} from "@/lib/strava";
import { ActivityDetail } from "@/components/ActivityDetail";
import { ActivityPostCard } from "@/components/ActivityPostCard";

type ProfileGoalData = {
  goalType: "weight" | "race" | "distance";
  raceType: "marathon" | "semi" | "20k" | "10k" | "5k" | "other";
  raceDistanceKm: string;
  raceTargetDate: string;
  raceTargetTime: string;
  distanceKm?: string;
  targetWeightKg?: string;
};

const upcomingSessions = [
  { type: "Sortie tempo", distance: "8km", pace: "4:45/km", day: "Demain", color: "hsl(var(--lime))" },
  { type: "Récupération facile", distance: "5km", pace: "5:30/km", day: "Mercredi", color: "hsl(38, 92%, 50%)" },
  { type: "Intervalles", distance: "10km", pace: "4:15/km", day: "Vendredi", color: "hsl(0, 72%, 51%)" },
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: 12,
};

type WeeklyMetricCard = {
  title: string;
  unit: string;
  currentValue: string;
  change: string;
  icon: typeof Route;
  color: string;
  chartData: Array<{ week: string; value: number; showTick?: boolean }>;
  comment: string;
  granularity?: "week" | "month" | "quarter";
  period?: "1m" | "3m" | "1y" | "all";
};

type GoalSummaryData = {
  goalType: "weight" | "race" | "distance";
  raceType: "marathon" | "semi" | "20k" | "10k" | "5k" | "other";
  raceDistanceKm: string;
  raceTargetDate: string;
  raceTargetTime: string;
  distanceKm?: string;
  targetWeightKg?: string;
};

type UpcomingSession = {
  type: string;
  distance: string;
  pace: string;
  day: string;
  color: string;
};

function isRunActivity(activity: StravaActivity) {
  const label = `${activity.sport_type ?? activity.type ?? ""}`.toLowerCase();
  return (
    label.includes("run") ||
    label.includes("course") ||
    label.includes("trail")
  );
}

/* ── Dashboard Section ── */
function DashboardSection({
  metricCards,
  latestActivity,
  userGoal,
  activities,
  onOpenActivityDetail,
}: {
  metricCards: WeeklyMetricCard[];
  latestActivity: StravaActivity | null;
  userGoal: ProfileGoalData | null;
  activities: StravaActivity[];
  onOpenActivityDetail: (activity: StravaActivity) => void;
}) {
  const [granularities, setGranularities] = useState<Record<string, "week" | "month">>({
    "Distance par semaine": "week",
    "Durée par semaine": "week",
    "Dénivelé par semaine": "week",
  });

  const [periods, setPeriods] = useState<Record<string, "1m" | "3m" | "1y" | "all">>({
    "Distance par semaine": "3m",
    "Durée par semaine": "3m",
    "Dénivelé par semaine": "3m",
  });

  const getFilteredMetrics = () => {
    return metricCards.map((metric) => {
      const granularity = granularities[metric.title];
      const period = periods[metric.title];
      return buildMetricData(metric.title, activities, granularity, period);
    });
  };

  const filteredMetrics = useMemo(() => getFilteredMetrics(), [granularities, periods, activities]);

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
      {filteredMetrics.map((metric, index) => (
        <ScrollReveal key={metric.title} delay={index * 0.06}>
          <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">{metric.title}</h2>
                </div>
              </div>
              <span className="max-w-[240px] rounded-lg bg-accent/10 px-2.5 py-1 text-right text-[11px] font-semibold leading-4 text-lime">
                {metric.change}
              </span>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Granularité des données
                </p>
                <div className="flex gap-1">
                  {(["week", "month"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() =>
                        setGranularities((prev) => ({
                          ...prev,
                          [metric.title]: g,
                        }))
                      }
                      className={`rounded px-2 py-1 text-xs font-medium transition ${
                        granularities[metric.title] === g
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {g === "week" ? "Sem" : "Mois"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Historique des données
                </p>
                <div className="flex gap-1">
                  {(["1m", "3m", "1y", "all"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        setPeriods((prev) => ({
                          ...prev,
                          [metric.title]: p,
                        }))
                      }
                      className={`rounded px-2 py-1 text-xs font-medium transition ${
                        periods[metric.title] === p
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {p === "1m" ? "1m" : p === "3m" ? "3m" : p === "1y" ? "1y" : "All"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold tabular-nums">{metric.currentValue}</span>
              <p className="mt-1 text-xs text-muted-foreground">
                {granularities[metric.title] === "week"
                  ? "Semaine en cours"
                  : "Mois en cours"}
              </p>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metric.chartData} margin={{ top: 8, right: 4, left: 4, bottom: 16 }}>
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    height={56}
                    tick={<CompactYearTick />}
                    interval={0}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value) => formatDashboardTooltip(metric.title, Number(value))}
                  />
                  <Bar dataKey="value" fill={metric.color} radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: number) => formatMetricBarLabel(metric.title, Number(value))}
                      fill="hsl(var(--foreground))"
                      fontSize={10}
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
              {upcomingSessions.map((session) => (
                <div key={session.type} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
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
}

/* ── Performance Section ── */
function PerformanceSection({
  activities,
}: {
  activities: StravaActivity[];
}) {
  const [vo2Granularity, setVo2Granularity] = useState<"week" | "month">("week");
  const [vo2Period, setVo2Period] = useState<"1m" | "3m" | "1y" | "all">("3m");

  const vo2Series = useMemo(
    () => buildVo2Series(activities, vo2Granularity, vo2Period),
    [activities, vo2Granularity, vo2Period],
  );
  const acwrSeries = useMemo(() => buildAcwrSeries(activities), [activities]);
  const prs = useMemo(() => getPersonalRecords(activities), [activities]);

  const currentVo2 = [...vo2Series].reverse().find((item) => item.value > 0)?.value ?? 0;
  const currentAcwr = acwrSeries[acwrSeries.length - 1]?.value ?? 0;

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Tendance VO2 max</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimation dérivée de l'allure moyenne et de la durée de chaque, puis agrégée sur la période choisie.
              </p>
            </div>
            <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-[11px] font-semibold leading-4 text-lime">
              {currentVo2 > 0 ? `${currentVo2.toFixed(1)} ml/kg/min` : "Aucune donnée"}
            </span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">Granularité des données</p>
              <div className="flex gap-1">
                {(["week", "month"] as const).map((granularity) => (
                  <button
                    key={granularity}
                    onClick={() => setVo2Granularity(granularity)}
                    className={`rounded px-2 py-1 text-xs font-medium transition ${
                      vo2Granularity === granularity
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {granularity === "week" ? "Sem" : "Mois"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">Historique des données</p>
              <div className="flex gap-1">
                {(["1m", "3m", "1y", "all"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setVo2Period(period)}
                    className={`rounded px-2 py-1 text-xs font-medium transition ${
                      vo2Period === period
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {period === "1m" ? "1m" : period === "3m" ? "3m" : period === "1y" ? "1y" : "All"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold tabular-nums">
              {currentVo2 > 0 ? currentVo2.toFixed(1) : "--"}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">Dernière estimation fiable</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vo2Series} margin={{ top: 8, right: 4, left: 4, bottom: 16 }}>
                <XAxis dataKey="week" axisLine={false} tickLine={false} height={56} tick={<CompactYearTick />} interval={0} />
                <YAxis hide />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${Number(value).toFixed(1).replace(".", ",")} ml/kg/min`, "VO2 max estimée"]}
                />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(value: number) => (Number(value) === 0 ? "" : `${Math.round(Number(value))}`)}
                    fill="hsl(var(--foreground))"
                    fontSize={10}
                    fontWeight={700}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Ratio charge aiguë : Chronique</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimation basée sur la durée, modulée par la fréquence cardiaque moyenne quand elle est disponible, puis comparée à la moyenne des 4 semaines précédentes.
              </p>
            </div>
            <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-[11px] font-semibold leading-4 text-lime">
              {currentAcwr > 0 ? currentAcwr.toFixed(2) : "Aucune donnée"}
            </span>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold tabular-nums">
              {currentAcwr > 0 ? currentAcwr.toFixed(2) : "--"}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">Zone idéale : 0.80 à 1.30</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acwrSeries} margin={{ top: 8, right: 4, left: 4, bottom: 16 }}>
                <defs>
                  <linearGradient id="acwrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} height={56} tick={<CompactYearTick />} interval={0} />
                <YAxis hide domain={[0, 2]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${Number(value).toFixed(2).replace(".", ",")}`, "Ratio charge aiguë : Chronique"]}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#acwrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-lime" /><h2 className="text-sm font-semibold">Records personnels</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {prs.map((pr, i) => (
              <ScrollReveal key={pr.event} delay={i * 0.06}>
                <div className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
                  <p className="text-xs font-medium text-muted-foreground">{pr.event}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{pr.time}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{pr.date}</span>
                    <span className="flex items-center gap-0.5 font-semibold text-lime">{pr.improvement}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

function ActivityTabSection({
  activities,
  athleteName,
  onOpenActivityDetail,
}: {
  activities: StravaActivity[];
  athleteName: string;
  onOpenActivityDetail: (activity: StravaActivity) => void;
}) {
  const activityPosts = useMemo(
    () =>
      [...activities]
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .map((activity) => ({
          activity,
          post: activityToCommunityPost(activity, athleteName),
        })),
    [activities, athleteName],
  );

  if (activityPosts.length === 0) {
    return (
      <div className="rounded-xl border border-accent/20 bg-card p-5 text-sm text-muted-foreground">
        Aucune activité Strava trouvée.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activityPosts.map(({ activity, post }, index) => (
        <ScrollReveal key={activity.id} delay={index * 0.04}>
          <ActivityPostCard post={post} onOpen={() => onOpenActivityDetail(activity)} />
        </ScrollReveal>
      ))}
    </div>
  );
}

/* ── Main Page ── */
const Dashboard = () => {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athleteName, setAthleteName] = useState("Coureur");
  const [stravaConnected, setStravaConnected] = useState(false);
  const [userGoal, setUserGoal] = useState<ProfileGoalData | null>(null);
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<StravaActivity | null>(null);
  const handleCloseActivityDetail = () => {
    setSelectedActivityForDetail(null);
  };

  useEffect(() => {
    const loadStravaActivities = async () => {
      try {
        const response = await fetch("/api/strava/activities?all_history=1&per_page=100");
        const data = await response.json();

        setStravaConnected(Boolean(data?.connected));

        if (data?.athlete) {
          const fullName = `${data.athlete.firstname ?? ""} ${data.athlete.lastname ?? ""}`.trim();
          if (fullName) {
            setAthleteName(fullName.split(" ")[0]);
          }
        }

        if (Array.isArray(data?.activities)) {
          setActivities(data.activities as StravaActivity[]);
        }
      } catch {
        setStravaConnected(false);
        setActivities([]);
      }
    };

    const loadUserGoal = () => {
      try {
        const raw = window.localStorage.getItem("pace-user-profile-goal");
        if (raw) {
          const parsed = JSON.parse(raw) as ProfileGoalData;
          setUserGoal(parsed);
        }
      } catch {
        setUserGoal(null);
      }
    };

    void loadStravaActivities();
    loadUserGoal();

    const handleGoalUpdate = () => {
      loadUserGoal();
    };

    window.addEventListener("pace-goal-updated", handleGoalUpdate);
    return () => {
      window.removeEventListener("pace-goal-updated", handleGoalUpdate);
    };
  }, []);

  const runningActivities = useMemo(
    () => activities.filter(isRunActivity),
    [activities],
  );

  const metricCards = useMemo<WeeklyMetricCard[]>(
    () => [
      buildMetricData("Distance par semaine", runningActivities, "week", "3m"),
      buildMetricData("Durée par semaine", runningActivities, "week", "3m"),
      buildMetricData("Dénivelé par semaine", runningActivities, "week", "3m"),
    ],
    [runningActivities],
  );
  const weeklyInsight = useMemo(
    () => buildGoalAwareWeeklyInsight(metricCards, userGoal, upcomingSessions),
    [metricCards, userGoal],
  );
  const stravaAuthUrl = useMemo(() => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback`;
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=activity:read_all`;
  }, []);

  const latestActivity = useMemo(() => getLatestActivity(runningActivities), [runningActivities]);

  return (
    <div className="space-y-6">
      {selectedActivityForDetail && (
        <ActivityDetail
          activity={selectedActivityForDetail}
          onClose={handleCloseActivityDetail}
          allActivities={activities}
        />
      )}

      <ScrollReveal>
        <div className="rounded-2xl border border-accent/70 bg-accent px-5 py-5 text-accent-foreground shadow-[0_18px_44px_hsl(var(--accent)/0.2)]">
          <div className="flex flex-col gap-1">
            {stravaConnected ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Bonjour, <span className="text-accent-foreground">{athleteName}</span>
                </h1>
                <p className="text-sm text-accent-foreground/80">{weeklyInsight}</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Bonjour, connecte ton strava pour avoir toutes les informations ici
                </h1>
                <div className="mt-3">
                  <a
                    href={stravaAuthUrl}
                    className="inline-flex items-center justify-center rounded-lg border border-accent-foreground/20 bg-accent-foreground px-3 py-2 text-xs font-semibold text-accent transition-opacity hover:opacity-90"
                  >
                    Connecter mon compte Strava
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </ScrollReveal>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <ScrollReveal delay={0.05}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard"><Activity className="h-4 w-4 mr-1.5" /> Tableau de bord</TabsTrigger>
            <TabsTrigger value="performance"><TrendingUp className="h-4 w-4 mr-1.5" /> Performance</TabsTrigger>
            <TabsTrigger value="activities"><List className="h-4 w-4 mr-1.5" /> Activités</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="dashboard">
          <DashboardSection
            metricCards={metricCards}
            latestActivity={latestActivity}
            userGoal={userGoal}
            activities={runningActivities}
            onOpenActivityDetail={setSelectedActivityForDetail}
          />
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceSection activities={runningActivities} />
        </TabsContent>
        <TabsContent value="activities">
          <ActivityTabSection
            activities={runningActivities}
            athleteName={athleteName}
            onOpenActivityDetail={setSelectedActivityForDetail}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;

function getStartOfWeek(input: Date) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function getMetricAmountForTitle(title: string, activities: StravaActivity[]) {
  if (title.includes("Distance")) {
    return activities.reduce((sum, activity) => sum + activity.distance / 1000, 0);
  }
  if (title.includes("Durée")) {
    return activities.reduce((sum, activity) => sum + activity.moving_time / 3600, 0);
  }
  return activities.reduce((sum, activity) => sum + (activity.total_elevation_gain ?? 0), 0);
}

function formatWeeklyGrowthSummary(title: string, activities: StravaActivity[]) {
  const currentWeekStart = getStartOfWeek(new Date());
  const weeklyValues = Array.from({ length: 4 }, (_, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (3 - index) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= weekStart && activityDate < weekEnd;
    });

    return getMetricAmountForTitle(title, weekActivities);
  });

  const baseline = weeklyValues[0];
  const current = weeklyValues[weeklyValues.length - 1];

  if (weeklyValues.every((value) => value === 0)) {
    return "0% / sem sur 3 sem";
  }

  if (baseline <= 0) {
    return current > 0
      ? "+100% / sem sur 3 sem"
      : "0% / sem sur 3 sem";
  }

  const weeklyRate = Math.pow(Math.max(current, 0.0001) / baseline, 1 / 3) - 1;
  const percentage = Math.round(weeklyRate * 100);

  if (percentage >= 0) {
    return `+${percentage}% / sem sur 3 sem`;
  }

  return `${percentage}% / sem sur 3 sem`;
}

function formatMetricBarLabel(title: string, value: number) {
  if (value === 0) return "";
  if (title.includes("Distance")) return `${Math.round(value)}`;
  if (title.includes("Durée")) return `${Math.round(value)}`;
  return `${Math.round(value)}`;
}

function formatDistanceTooltipValue(value: number) {
  return `${value.toFixed(1).replace(".", ",")} km`;
}

function formatHoursTooltipValue(value: number) {
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

function formatDashboardTooltip(title: string, value: number): [string, string] {
  if (title.includes("Distance")) {
    return [formatDistanceTooltipValue(value), "Distance en km"];
  }

  if (title.includes("Durée")) {
    return [formatHoursTooltipValue(value), "Durée en heure et minutes"];
  }

  return [`${Math.round(value)} m`, "Dénivelé en mètres"];
}

function formatWeeklyDurationLabel(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes}min`;
  }

  return `${hours}h${String(minutes).padStart(2, "0")}min`;
}

function formatAxisDateLabel(
  start: Date,
  granularity: "week" | "month" | "quarter",
  period: "1m" | "3m" | "1y" | "all",
) {
  const month = start.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  const monthLabel = `${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  const year = String(start.getFullYear()).slice(-2);

  if (granularity === "month" && (period === "1y" || period === "all")) {
    return `${monthLabel} ${year}`;
  }

  if (period === "1y" || period === "all") {
    const day = String(start.getDate()).padStart(2, "0");
    return `${day} ${monthLabel} ${year}`;
  }

  if (granularity === "week") {
    return `${start.getDate()} ${monthLabel}`;
  }

  if (granularity === "month") {
    return monthLabel;
  }

  const quarter = Math.floor(start.getMonth() / 3) + 1;
  return `Q${quarter}`;
}

function CompactYearTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: {
    value: string;
    payload?: { showTick?: boolean };
  };
}) {
  if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
  if (payload.payload?.showTick === false) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={10}
        textAnchor="middle"
        fill="hsl(var(--foreground))"
        fontSize={9}
        fontWeight={600}
      >
        {payload.value}
      </text>
    </g>
  );
}

function formatGoalLabel(goal: GoalSummaryData | null) {
  if (!goal) return "";

  if (goal.goalType === "race") {
    if (goal.raceType === "marathon") return "ton marathon";
    if (goal.raceType === "semi") return "ton semi-marathon";
    if (goal.raceType === "20k") return "ton 20 km";
    if (goal.raceType === "10k") return "ton 10 km";
    if (goal.raceType === "5k") return "ton 5 km";
    return goal.raceDistanceKm ? `ta course de ${goal.raceDistanceKm} km` : "ta course";
  }

  if (goal.goalType === "distance") {
    return goal.distanceKm ? `ton objectif de ${goal.distanceKm} km` : "ton objectif distance";
  }

  return goal.targetWeightKg ? `ton objectif de ${goal.targetWeightKg} kg` : "ton objectif de poids";
}

function buildGoalAwareWeeklyInsight(
  metrics: WeeklyMetricCard[],
  goal: GoalSummaryData | null,
  sessions: UpcomingSession[],
) {
  const baseInsight = buildWeeklyInsight(metrics);
  if (!goal) return baseInsight;

  const goalLabel = formatGoalLabel(goal);
  const sessionsCount = sessions.length;
  const sessionPreview = sessions
    .slice(0, 2)
    .map((session) => `${session.type.toLowerCase()} ${session.day.toLowerCase()}`)
    .join(" puis ");

  if (goal.goalType === "race" && goal.raceTargetDate) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(goal.raceTargetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );

    if (sessionsCount > 0) {
      return `${baseInsight} Objectif ${goalLabel}${daysLeft > 0 ? ` dans ${daysLeft} jours` : ""} : ${sessionsCount} séances prévues, dont ${sessionPreview}.`;
    }

    return `${baseInsight} Objectif ${goalLabel}${daysLeft > 0 ? ` dans ${daysLeft} jours` : ""}.`;
  }

  if (goal.goalType === "distance" && sessionsCount > 0) {
    return `${baseInsight} Pour ${goalLabel}, ${sessionsCount} séances sont prévues cette semaine, dont ${sessionPreview}.`;
  }

  if (goal.goalType === "weight" && sessionsCount > 0) {
    return `${baseInsight} Pour ${goalLabel}, garde une semaine régulière avec ${sessionsCount} séances prévues.`;
  }

  return `${baseInsight} Cap sur ${goalLabel}.`;
}

function trimLeadingZeroPeriods<T extends { value: number }>(series: T[]) {
  const firstNonZeroIndex = series.findIndex((item) => item.value > 0);
  if (firstNonZeroIndex === -1) return series;
  return series.slice(firstNonZeroIndex);
}

function getAdaptiveTickStep(
  length: number,
  granularity: "week" | "month" | "quarter",
  period?: "1m" | "3m" | "1y" | "all",
) {
  if (granularity === "week" && (period === "1y" || period === "all")) return 4;
  if (granularity === "month" && (period === "1y" || period === "all")) return 3;
  if (granularity === "quarter") return 1;
  if (granularity === "month") {
    if (length > 18) return 4;
    if (length > 12) return 3;
    if (length > 8) return 2;
    return 1;
  }

  if (length > 52) return 8;
  if (length > 36) return 6;
  if (length > 24) return 4;
  if (length > 16) return 3;
  if (length > 10) return 2;
  return 1;
}

function annotateAdaptiveTicks<T extends { year?: string }>(
  series: T[],
  granularity: "week" | "month" | "quarter",
  period?: "1m" | "3m" | "1y" | "all",
) {
  const step = getAdaptiveTickStep(series.length, granularity, period);
  return series.map((item, index) => {
    return {
      ...item,
      showTick: index === 0 || index === series.length - 1 || index % step === 0,
    };
  });
}

function buildWeeklyInsight(metrics: WeeklyMetricCard[]) {
  if (metrics.length === 0) return "";

  const getMetricValues = (metric: WeeklyMetricCard) =>
    metric.chartData.length > 1
      ? {
          current: metric.chartData[metric.chartData.length - 1].value,
          previous: metric.chartData[metric.chartData.length - 2].value,
        }
      : {
          current: metric.chartData[metric.chartData.length - 1]?.value || 0,
          previous: 0,
        };

  const distanceVals = getMetricValues(metrics[0]);
  const durationVals = getMetricValues(metrics[1]);
  const elevationVals = getMetricValues(metrics[2]);

  const noActivity = distanceVals.current === 0 && durationVals.current === 0 && elevationVals.current === 0;
  const lowVolume = distanceVals.current <= 15 && durationVals.current <= 2.5;
  const stableDistance = Math.abs(distanceVals.current - distanceVals.previous) <= 3;
  const stableDuration = Math.abs(durationVals.current - durationVals.previous) <= 0.5;
  const stableElevation = Math.abs(elevationVals.current - elevationVals.previous) <= 80;
  const upMeaningfully =
    distanceVals.current - distanceVals.previous >= 5 ||
    durationVals.current - durationVals.previous >= 1 ||
    elevationVals.current - elevationVals.previous >= 100;
  const downMeaningfully =
    distanceVals.previous > 0 &&
    (distanceVals.previous - distanceVals.current >= 5 ||
      durationVals.previous - durationVals.current >= 1 ||
      elevationVals.previous - elevationVals.current >= 100);

  if (noActivity) {
    return "Semaine vide pour l'instant. Une sortie facile suffirait à relancer la dynamique.";
  }

  if (lowVolume) {
    return "Semaine légère pour l'instant. Une ou deux séances bien posées feront déjà la différence.";
  }

  if (stableDistance && stableDuration && stableElevation) {
    return "Semaine assez stable. Continue sur ce rythme.";
  }

  if (upMeaningfully && !downMeaningfully) {
    return "Bonne dynamique cette semaine. Le volume monte proprement.";
  }

  if (downMeaningfully) {
    return "Semaine plus légère que la précédente. Utile si tu es dans une phase de récupération.";
  }

  return "Semaine constructive. Continue à empiler les séances utiles.";
}

function buildMetricData(
  title: string,
  activities: StravaActivity[],
  granularity: "week" | "month" | "quarter",
  period: "1m" | "3m" | "1y" | "all",
): WeeklyMetricCard {
  const now = new Date();
  let startDate = new Date();

  if (period === "1m") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === "3m") {
    startDate.setMonth(now.getMonth() - 3);
  } else if (period === "1y") {
    startDate.setFullYear(now.getFullYear() - 1);
  } else {
    startDate = new Date("2000-01-01");
  }

  const filteredActivities = activities.filter((activity) => {
    const actDate = new Date(activity.start_date);
    return actDate >= startDate && actDate <= now;
  });

  let periods: Array<{ label: string; start: Date; distanceKm: number; durationSeconds: number; elevation: number }> = [];
  let currentLabel = "";

  if (granularity === "week") {
    const alignedStartDate = getStartOfWeek(startDate);
    const currentWeekStart = getStartOfWeek(now);
    const weekCount =
      Math.max(
        1,
        Math.round((currentWeekStart.getTime() - alignedStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
      );

    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(alignedStartDate);
      weekStart.setDate(alignedStartDate.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekActivities = filteredActivities.filter((activity) => {
        const actDate = new Date(activity.start_date);
        return actDate >= weekStart && actDate < weekEnd;
      });

      const label = formatAxisDateLabel(weekStart, "week", period);

      periods.push({
        label,
        start: new Date(weekStart),
        distanceKm: weekActivities.reduce((sum, a) => sum + a.distance / 1000, 0),
        durationSeconds: weekActivities.reduce((sum, a) => sum + a.moving_time, 0),
        elevation: weekActivities.reduce((sum, a) => sum + (a.total_elevation_gain ?? 0), 0),
      });

      if (weekStart.getTime() === currentWeekStart.getTime()) currentLabel = label;
    }
  } else if (granularity === "month") {
    const monthCount = Math.ceil((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) || 1;
    for (let i = monthCount - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthActivities = filteredActivities.filter((activity) => {
        const actDate = new Date(activity.start_date);
        return actDate >= monthStart && actDate < monthEnd;
      });

      const label = formatAxisDateLabel(monthStart, "month", period);
      periods.push({
        label,
        start: new Date(monthStart),
        distanceKm: monthActivities.reduce((sum, a) => sum + a.distance / 1000, 0),
        durationSeconds: monthActivities.reduce((sum, a) => sum + a.moving_time, 0),
        elevation: monthActivities.reduce((sum, a) => sum + (a.total_elevation_gain ?? 0), 0),
      });

      if (i === 0) currentLabel = label;
    }
  } else {
    const quarterCount = Math.ceil((now.getTime() - startDate.getTime()) / (91 * 24 * 60 * 60 * 1000)) || 1;
    for (let i = quarterCount - 1; i >= 0; i--) {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - i * 3, 1);
      const quarterEnd = i === 0 ? now : new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 1);

      const quarterActivities = filteredActivities.filter((activity) => {
        const actDate = new Date(activity.start_date);
        return actDate >= quarterStart && actDate < quarterEnd;
      });

      const label = formatAxisDateLabel(quarterStart, "quarter", period);
      periods.push({
        label,
        start: new Date(quarterStart),
        distanceKm: quarterActivities.reduce((sum, a) => sum + a.distance / 1000, 0),
        durationSeconds: quarterActivities.reduce((sum, a) => sum + a.moving_time, 0),
        elevation: quarterActivities.reduce((sum, a) => sum + (a.total_elevation_gain ?? 0), 0),
      });

      if (i === 0) currentLabel = label;
    }
  }

  if (periods.length === 0) {
    periods = [{ label: "N/A", start: new Date(now), distanceKm: 0, durationSeconds: 0, elevation: 0 }];
    currentLabel = "N/A";
  }

  const getMetricValue = (period: (typeof periods)[number]) => {
    if (title.includes("Distance")) return period.distanceKm;
    if (title.includes("Durée")) return period.durationSeconds;
    return period.elevation;
  };

  if (period === "all") {
    const firstNonZeroIndex = periods.findIndex((entry) => getMetricValue(entry) > 0);
    if (firstNonZeroIndex > 0) {
      periods = periods.slice(firstNonZeroIndex);
    }
  }

  const current = periods[periods.length - 1];
  const previous = periods.length > 1 ? periods[periods.length - 2] : current;

  const currentValue = getMetricValue(current);
  const previousValue = getMetricValue(previous);

  const allValues = periods.map(getMetricValue);
  const generateComment = (current: number, previous: number, all: number[]): string => {
    const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const lastAverage = all.slice(-Math.max(1, Math.floor(all.length / 3))).reduce((sum, v) => sum + v, 0) / Math.max(1, Math.floor(all.length / 3));

    if (current === 0) {
      return "Allez il est temps d'aller courir, l'amélioration en course à pieds se construit grâce à la régularité";
    }

    if (percentChange > 20 && lastAverage > (title.includes("Distance") ? 30 : title.includes("Durée") ? 12000 : 200)) {
      return "Attention à pas pousser trop rapidement avec le risque de se blesser, ça vaut le coup de levier un peu le pied pour laisser le temps au corps de récupérer";
    }

    if (current > previous && previous > 0) {
      return "Bravo tu progresses ! Continues comme ça pour maintenir cette dynamique";
    }

    if (current === previous && current > 0) {
      return "Régularité au rendez-vous, c'est excellent pour la progression à long terme";
    }

    if (current < previous && previous > 0) {
      return "La période a été plus chargée que d'habitude ? Laisse à ton corps le temps de récupérer";
    }

    return "Continue à travailler, chaque jour compte";
  };

  const icon = title.includes("Distance") ? Route : title.includes("Durée") ? Clock : Mountain;
  const color = "hsl(var(--accent))";

  let displayValue = "";
  if (title.includes("Distance")) {
    displayValue = `${currentValue.toFixed(1)} km`;
  } else if (title.includes("Durée")) {
    displayValue = formatWeeklyDurationLabel(currentValue);
  } else {
    displayValue = `${Math.round(currentValue)} m`;
  }

  return {
    title,
    unit: title.includes("Distance") ? "km" : title.includes("Durée") ? "h" : "m",
    currentValue: displayValue,
    change: formatWeeklyGrowthSummary(title, activities),
    icon,
    color,
    chartData: annotateAdaptiveTicks(periods.map((p) => ({
        week: p.label,
        value: title.includes("Distance")
          ? p.distanceKm
          : title.includes("Durée")
            ? Number((p.durationSeconds / 3600).toFixed(1))
            : p.elevation,
      })), granularity, period),
    comment: generateComment(currentValue, previousValue, allValues),
    granularity: granularity as "week" | "month" | "quarter",
    period: period as "1m" | "3m" | "1y" | "all",
  };
}
