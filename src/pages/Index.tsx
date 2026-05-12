import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, List, Target, TrendingUp, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { differenceInDays, getWeek, subWeeks } from "date-fns";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProfile,
  getRuns,
  getRunStatsLifetime,
  getPersonalizedFeed,
  getRunWithGps,
  type PersonalizedFeedPost,
  type ProfileRow,
  type RunGpsPoint,
  type RunStatsLifetimeRow,
  type RunRow,
} from "@/lib/database";
import { logger } from "@/lib/logger";
import { normalizeGoalData } from "@/lib/goalHelpers";
import { cache } from "@/lib/cache";
import { ActivityDetail } from "@/components/ActivityDetail";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { SkeletonHeroBanner } from "@/components/dashboard/SkeletonHeroBanner";
import { SkeletonMetricCard } from "@/components/dashboard/SkeletonMetricCard";
import { AppCard, PageContainer, SectionTitle } from "@/components/ui/page-layout";
import {
  buildMetricData,
  getAggregationUnit,
  getWeekOverWeekChange,
  type MetricChartPeriod,
} from "@/lib/dashboardHelpers";
import { cn } from "@/lib/utils";
import {
  scheduleStreakNotification,
  getLastNotifiedStreak,
  setLastNotifiedStreak,
  requestNotificationPermission,
} from "@/lib/pushNotifications";

type DashboardPeriod = Extract<MetricChartPeriod, "3m" | "6m" | "1y" | "all">;
const APP_OPEN_KEY = "pace_app_open_count";

const getAppOpenCount = (): number => {
  if (typeof window === "undefined") return 0;
  return Number.parseInt(localStorage.getItem(APP_OPEN_KEY) ?? "0", 10);
};

const incrementAppOpenCount = (): number => {
  if (typeof window === "undefined") return 0;
  const count = getAppOpenCount() + 1;
  localStorage.setItem(APP_OPEN_KEY, String(count));
  return count;
};

const PerformanceSection = lazy(() =>
  import("@/components/dashboard/PerformanceSection").then((module) => ({ default: module.PerformanceSection })),
);
const ActivitySection = lazy(() =>
  import("@/components/dashboard/ActivitySection").then((module) => ({ default: module.ActivitySection })),
);

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl border border-border bg-card p-5">
    <div className="mb-3 h-3 w-1/3 rounded bg-muted" />
    <div className="mb-2 h-7 w-1/2 rounded bg-muted" />
    <div className="h-3 w-2/3 rounded bg-muted" />
  </div>
);

type ProfileGoalData = {
  goalType: "weight" | "race" | "distance" | "none";
  raceType: "marathon" | "semi" | "20k" | "10k" | "5k" | "other";
  raceDistanceKm: string;
  raceTargetDate: string;
  raceTargetTime: string;
  distanceKm?: string;
  targetWeightKg?: string;
  selectedPlanId?: string;
  goalSavedAt?: string;
  distanceTargetDate?: string;
  weightTargetDate?: string;
};

/** Running activities for metrics: recorded runs, treadmill, trail, and imports (`import:strava`, etc.). */
function isRunRow(run: RunRow): boolean {
  const t = run.run_type?.toLowerCase() ?? "";
  if (!t) return true;
  if (t.startsWith("import:")) return true;
  return t.includes("run");
}

function parseGpsTraceForDetail(trace: RunRow["gps_trace"]): RunGpsPoint[] | undefined {
  if (!Array.isArray(trace)) return undefined;

  const points = trace.filter((point): point is RunGpsPoint => {
    return (
      typeof point === "object" &&
      point !== null &&
      typeof (point as { lat?: unknown }).lat === "number" &&
      typeof (point as { lng?: unknown }).lng === "number" &&
      typeof (point as { time?: unknown }).time === "number"
    );
  });

  return points.length ? points : undefined;
}

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [athleteName, setAthleteName] = useState("Coureur");
  const [userGoal, setUserGoal] = useState<ProfileGoalData | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [runsForStats, setRunsForStats] = useState<RunRow[]>([]);
  const [lifetimeStatsDb, setLifetimeStatsDb] = useState<RunStatsLifetimeRow | null>(null);
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [selectedRunForDetail, setSelectedRunForDetail] = useState<RunRow | null>(null);
  const [selectedDetailTrace, setSelectedDetailTrace] = useState<RunGpsPoint[] | undefined>(undefined);
  const [period, setPeriod] = useState<DashboardPeriod>("3m");
  const [showImportBanner, setShowImportBanner] = useState(false);
  const isLoadingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const hasMountedRef = useRef(false);
  const loadUserDataRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const storedUserId = localStorage.getItem("pace_user_id");
    if (!storedUserId) return;

    const cachedRuns = cache.get<RunRow[]>(`runs_${storedUserId}`);
    const cachedRunsStats = cache.get<RunRow[]>(`runsStats_${storedUserId}`);
    const cachedProfile = cache.get<ProfileRow>(`profile_${storedUserId}`);
    const cachedLifetimeStats = cache.get<RunStatsLifetimeRow>(`lifetimeStats_${storedUserId}`);

    if (cachedRuns || cachedProfile || cachedRunsStats) {
      const runs = cachedRuns ?? cachedRunsStats;
      if (runs) {
        setRecentRuns(runs);
        setRunCount(runs.length);
        setRunsForStats(runs);
      }
      if (cachedProfile) {
        setAthleteName(cachedProfile.first_name?.trim() || "Coureur");
        if (
          cachedProfile.goal_data &&
          typeof cachedProfile.goal_data === "object" &&
          !Array.isArray(cachedProfile.goal_data)
        ) {
          setUserGoal(normalizeGoalData(cachedProfile.goal_data as ProfileGoalData) as ProfileGoalData);
        }
      }
      if (cachedLifetimeStats) {
        setLifetimeStatsDb(cachedLifetimeStats);
      }
      setIsLoading(false);
      setShowSkeletons(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem("pace_user_id", session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const count = incrementAppOpenCount();
    setShowImportBanner(count <= 3);
  }, []);

  useEffect(() => {
    if (!isLoading || recentRuns.length > 0 || athleteName !== "Coureur") {
      setShowSkeletons(false);
    }
  }, [athleteName, isLoading, recentRuns.length]);

  const loadUserData = useCallback(async () => {
    if (!session?.user.id) {
      setUserGoal(null);
      setRunCount(0);
      setRecentRuns([]);
      setRunsForStats([]);
      setLifetimeStatsDb(null);
      setAthleteName("Coureur");
      setIsLoading(false);
      return;
    }

    const userId = session.user.id;

    // Show stale-while-revalidate cache first for instant startup.
    const cachedRuns = cache.get<RunRow[]>(`runs_${userId}`);
    const cachedRunsStats = cache.get<RunRow[]>(`runsStats_${userId}`);
    const cachedProfile = cache.get<ProfileRow>(`profile_${userId}`);
    const cachedLifetimeStats = cache.get<RunStatsLifetimeRow>(`lifetimeStats_${userId}`);

    if (cachedRuns) {
      setRecentRuns(cachedRuns);
      setRunCount(cachedRuns.length);
      setRunsForStats(cachedRuns);
      setIsLoading(false);
    } else if (cachedRunsStats) {
      setRecentRuns(cachedRunsStats);
      setRunCount(cachedRunsStats.length);
      setRunsForStats(cachedRunsStats);
      setIsLoading(false);
    }
    if (cachedProfile) {
      setAthleteName(cachedProfile.first_name?.trim() || "Coureur");
      if (cachedProfile.goal_data && typeof cachedProfile.goal_data === "object" && !Array.isArray(cachedProfile.goal_data)) {
        setUserGoal(normalizeGoalData(cachedProfile.goal_data as ProfileGoalData) as ProfileGoalData);
      } else {
        setUserGoal(null);
      }
    }
    if (cachedLifetimeStats) {
      setLifetimeStatsDb(cachedLifetimeStats);
      setIsLoading(false);
    }

    // Guard concurrent and too-frequent refetches.
    if (isLoadingRef.current) return;
    const now = Date.now();
    if (now - lastFetchRef.current < 30_000) return;
    isLoadingRef.current = true;
    lastFetchRef.current = now;

    if (!cachedRuns && !cachedRunsStats && !cachedProfile && !cachedLifetimeStats) {
      setIsLoading(true);
    }

    try {
      const [profile, runs, lifetimeDb] = await Promise.all([
        getProfile(userId),
        getRuns(userId),
        getRunStatsLifetime(userId),
      ]);

      if (runs) {
        cache.set(`runs_${userId}`, runs);
        cache.set(`runsStats_${userId}`, runs);
      }
      if (profile) cache.set(`profile_${userId}`, profile);
      if (lifetimeDb) cache.set(`lifetimeStats_${userId}`, lifetimeDb);

      setRunCount(runs?.length ?? 0);
      setRecentRuns(runs ?? []);
      setRunsForStats(runs ?? []);
      setLifetimeStatsDb(lifetimeDb ?? null);

      if (profile?.first_name?.trim()) {
        setAthleteName(profile.first_name.trim());
      } else {
        setAthleteName("Coureur");
      }

      if (profile?.goal_data && typeof profile.goal_data === "object" && !Array.isArray(profile.goal_data)) {
        setUserGoal(normalizeGoalData(profile.goal_data as ProfileGoalData) as ProfileGoalData);
      } else {
        setUserGoal(null);
      }
    } catch {
      setUserGoal(null);
      setRunCount(0);
      setRecentRuns([]);
      setRunsForStats([]);
      setLifetimeStatsDb(null);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [session?.user.id]);

  useEffect(() => {
    loadUserDataRef.current = loadUserData;
  }, [loadUserData]);

  useEffect(() => {
    void loadUserData();

    const handleRefresh = () => {
      void loadUserData();
    };

    window.addEventListener("pace-goal-updated", handleRefresh);
    window.addEventListener("pace-runs-updated", handleRefresh);
    return () => {
      window.removeEventListener("pace-goal-updated", handleRefresh);
      window.removeEventListener("pace-runs-updated", handleRefresh);
    };
  }, [loadUserData]);

  useEffect(() => {
    const refreshRunsData = () => {
      void loadUserDataRef.current();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        refreshRunsData();
      }
    };

    window.addEventListener("focus", refreshRunsData);
    window.addEventListener("pageshow", refreshRunsData);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      window.removeEventListener("focus", refreshRunsData);
      window.removeEventListener("pageshow", refreshRunsData);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (location.pathname === "/") {
      void loadUserData();
    }
  }, [location.pathname, loadUserData]);

  useEffect(() => {
    if (!session?.user?.id || recentRuns.length === 0) return;

    const preload = () => {
      const userId = session.user.id;
      if (!cache.get(`socialFeed_${userId}`)) {
        void getPersonalizedFeed(userId, 10, 0)
          .then((posts) => {
            cache.set<PersonalizedFeedPost[]>(`socialFeed_${userId}`, posts);
          })
          .catch(() => {});
      }
      if (!cache.get(`health_${userId}`)) {
        cache.set(`health_${userId}`, { warmedAt: Date.now() });
      }
    };

    if ("requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback(preload, { timeout: 3000 });
    } else {
      window.setTimeout(preload, 2000);
    }
  }, [recentRuns.length, session?.user?.id]);

  const handleCloseActivityDetail = () => {
    setSelectedRunForDetail(null);
    setSelectedDetailTrace(undefined);
  };

  const openRunDetail = (run: RunRow) => {
    setSelectedRunForDetail(run);
    setSelectedDetailTrace(parseGpsTraceForDetail(run.gps_trace));
    const uid = session?.user?.id;
    if (!uid) return;
    void getRunWithGps(uid, run.id)
      .then((fullRun) => {
        setSelectedRunForDetail((prev) => (prev?.id === run.id ? { ...prev, ...fullRun } : prev));
        setSelectedDetailTrace(parseGpsTraceForDetail(fullRun.gps_trace));
      })
      .catch((err) => {
        logger.error("getRunWithGps failed", err, { runId: run.id });
      });
  };

  const runningRuns = useMemo(() => recentRuns.filter(isRunRow), [recentRuns]);

  const metricCards = useMemo(() => {
    const granularity = getAggregationUnit(period);
    const titles =
      granularity === "week"
        ? {
            distance: "Distance par semaine",
            duration: "Durée par semaine",
            elevation: "Dénivelé par semaine",
          }
        : granularity === "month"
          ? {
              distance: "Distance par mois",
              duration: "Durée par mois",
              elevation: "Dénivelé par mois",
            }
          : {
              distance: "Distance par trimestre",
              duration: "Durée par trimestre",
              elevation: "Dénivelé par trimestre",
            };
    return [
      buildMetricData(titles.distance, runningRuns, granularity, period, "distance"),
      buildMetricData(titles.duration, runningRuns, granularity, period, "duration"),
      buildMetricData(titles.elevation, runningRuns, granularity, period, "elevation"),
    ];
  }, [runningRuns, period]);

  const filteredMetrics = useMemo(() => metricCards, [metricCards]);
  const hasDefinedGoal = useMemo(() => {
    if (!userGoal) return false;
    return userGoal.goalType !== "none";
  }, [userGoal]);
  const goalTargetDate = useMemo(() => {
    if (!userGoal) return "";
    return userGoal.raceTargetDate || userGoal.distanceTargetDate || userGoal.weightTargetDate || "";
  }, [userGoal]);
  const goalLabel = useMemo(() => {
    if (!userGoal) return "";
    if (userGoal.goalType === "race") {
      return userGoal.raceType || "Objectif course";
    }
    if (userGoal.goalType === "distance") {
      return userGoal.distanceKm ? `${userGoal.distanceKm} km` : "Objectif distance";
    }
    if (userGoal.goalType === "weight") {
      return userGoal.targetWeightKg ? `${userGoal.targetWeightKg} kg` : "Objectif poids";
    }
    return "Objectif";
  }, [userGoal]);

  const goalIsExpired = useMemo(() => {
    if (!goalTargetDate) return false;
    const end = new Date(goalTargetDate);
    if (Number.isNaN(end.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end < today;
  }, [goalTargetDate]);

  const elevationChange = useMemo(
    () => getWeekOverWeekChange(runsForStats ?? [], "elevation"),
    [runsForStats],
  );
  const lifetimeStats = useMemo(() => {
    const weekKeys = new Set(
      runsForStats
        .filter((run) => Boolean(run.started_at))
        .map((run) => {
          const d = new Date(run.started_at as string);
          const year = d.getFullYear();
          const week = getWeek(d, { weekStartsOn: 1 });
          return `${year}-W${String(week).padStart(2, "0")}`;
        }),
    );

    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 104; i++) {
      const year = checkDate.getFullYear();
      const week = getWeek(checkDate, { weekStartsOn: 1 });
      const key = `${year}-W${String(week).padStart(2, "0")}`;

      if (weekKeys.has(key)) {
        streak += 1;
        checkDate = subWeeks(checkDate, 1);
      } else {
        break;
      }
    }

    if (lifetimeStatsDb) {
      return {
        totalKm: Number(lifetimeStatsDb.total_distance_km ?? 0),
        totalHours: Number(lifetimeStatsDb.total_duration_seconds ?? 0) / 3600,
        totalRuns: Number(lifetimeStatsDb.total_runs ?? 0),
        totalElevation: Number(lifetimeStatsDb.total_elevation_gain ?? 0),
        avgPaceSecPerKm: Number(lifetimeStatsDb.best_pace_sec_per_km ?? 0),
        longestRun: Number(lifetimeStatsDb.longest_run_km ?? 0),
        streak,
      };
    }

    if (!runsForStats?.length) return null;

    const totalKm = runsForStats.reduce((sum, run) => sum + (run.distance_km ?? 0), 0);
    const totalHours = runsForStats.reduce((sum, run) => sum + (run.duration_seconds ?? 0), 0) / 3600;
    const totalRuns = runsForStats.length;
    const totalElevation = runsForStats.reduce((sum, run) => sum + (run.elevation_gain ?? 0), 0);

    const validRuns = runsForStats.filter((run) => (run.distance_km ?? 0) > 0 && (run.duration_seconds ?? 0) > 0);
    const totalDist = validRuns.reduce((sum, run) => sum + (run.distance_km ?? 0), 0);
    const totalSec = validRuns.reduce((sum, run) => sum + (run.duration_seconds ?? 0), 0);
    const avgPaceSecPerKm = totalDist > 0 ? totalSec / totalDist : 0;
    const longestRun = Math.max(...runsForStats.map((run) => run.distance_km ?? 0));

    return { totalKm, totalHours, totalRuns, totalElevation, avgPaceSecPerKm, longestRun, streak };
  }, [lifetimeStatsDb, runsForStats]);
  const weeklyStreak = lifetimeStats?.streak ?? 0;

  useEffect(() => {
    if (!weeklyStreak) return;
    const last = getLastNotifiedStreak();
    if (weeklyStreak > last) {
      void requestNotificationPermission().then((granted) => {
        if (!granted) return;
        void scheduleStreakNotification(weeklyStreak).then(() => {
          setLastNotifiedStreak(weeklyStreak);
        });
      });
    }
  }, [weeklyStreak]);

  return (
    <>
      {selectedRunForDetail && session?.user?.id ? (
        <ActivityDetail
          activity={selectedRunForDetail}
          userId={session.user.id}
          onClose={handleCloseActivityDetail}
          allActivities={runningRuns}
          fallbackTrace={selectedDetailTrace}
        />
      ) : null}

      <PageContainer>
        <ScrollReveal>
        {showSkeletons ? (
          <SkeletonHeroBanner />
        ) : (
          <AppCard className="relative overflow-hidden border-border">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/10" />
            <div className="pointer-events-none absolute right-3 top-3 h-12 w-12 rounded-full bg-accent/5" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Bonjour <span className="text-foreground">{athleteName}</span>
              </h2>
            </div>
            {hasDefinedGoal && goalTargetDate && !goalIsExpired ? (
              <div className="mt-3 border-t border-border/50 pt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{goalLabel}</span>
                  <span className="font-semibold text-accent">
                    J-{Math.max(0, differenceInDays(new Date(goalTargetDate), new Date()))}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(5, 100 - (differenceInDays(new Date(goalTargetDate), new Date()) / 180) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
            {hasDefinedGoal && goalTargetDate && goalIsExpired ? (
              <button
                type="button"
                onClick={() => navigate("/plan")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/30 py-3 text-sm font-medium text-accent"
              >
                <Target className="h-4 w-4" />
                Définir un nouvel objectif
              </button>
            ) : null}
          </AppCard>
        )}
      </ScrollReveal>

      {showImportBanner && recentRuns.length === 0 && (
        <ScrollReveal>
          <AppCard className="relative border-accent/30 py-4 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(APP_OPEN_KEY, "99");
                setShowImportBanner(false);
              }}
              className="absolute right-2 top-2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Importez votre historique de courses pour voir vos statistiques</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  GPX, FIT, archive Strava/Nike/Adidas ou export Apple Health, importe ton historique de courses en un clin
                  d&apos;oeil.
                </p>
              </div>
              <Link
                to="/import"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                Importer mon historique
              </Link>
            </div>
          </AppCard>
        </ScrollReveal>
      )}

      <Tabs defaultValue="dashboard" className="space-y-6">
        <ScrollReveal>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">
              <Activity className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Tableau de bord</span>
              <span className="sm:hidden">Accueil</span>
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-1.5" /> Performance
            </TabsTrigger>
            <TabsTrigger value="activities">
              <List className="h-4 w-4 mr-1.5" /> Activités
            </TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="dashboard">
          {showSkeletons ? (
            <div className="space-y-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-4">
              {lifetimeStats ? (
                <div className="space-y-2">
                  <div className="mb-3 flex items-center justify-between">
                    <SectionTitle>Mes statistiques</SectionTitle>
                    <span className="text-xs text-muted-foreground">Basé sur tout l&apos;historique disponible</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <AppCard className="py-3 text-center">
                      <p className="font-metric text-xl font-black text-foreground">
                        {Math.round(lifetimeStats.totalKm).toLocaleString("fr")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">km au total</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80">depuis le début</p>
                    </AppCard>

                    <AppCard className="py-3 text-center">
                      <p className="font-metric text-xl font-black text-foreground">{lifetimeStats.totalRuns}</p>
                      <p className="mt-1 text-xs text-muted-foreground">courses</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80">depuis le début</p>
                    </AppCard>

                    <AppCard className="py-3 text-center">
                      <p className="font-metric text-xl font-black text-accent">{Math.round(lifetimeStats.totalHours)}h</p>
                      <p className="mt-1 text-xs text-muted-foreground">heures de course</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80">depuis le début</p>
                    </AppCard>

                    <AppCard className="py-3 text-center">
                      <p className="font-metric text-xl font-black text-foreground">{lifetimeStats.longestRun.toFixed(1)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">km (plus longue)</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80">depuis le début</p>
                    </AppCard>

                    <AppCard className="py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <p className="font-metric text-xl font-black text-foreground">
                            {Math.round(lifetimeStats.totalElevation).toLocaleString("fr")}m
                          </p>
                          {elevationChange.percent !== 0 ? (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-semibold",
                                elevationChange.trend === "up"
                                  ? "bg-accent/15 text-accent"
                                  : "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
                              )}
                            >
                              {elevationChange.trend === "up" ? "+" : ""}
                              {elevationChange.percent}% vs S-1
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">dénivelé total</p>
                        <p className="text-[10px] text-muted-foreground/80">depuis le début</p>
                      </div>
                    </AppCard>

                    <AppCard className="py-3 text-center">
                      <p
                        className="text-xl font-black text-accent"
                        style={{ fontFamily: "var(--font-mono-display)" }}
                      >
                        {lifetimeStats.streak}🔥
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">semaines consécutives</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80">en cours</p>
                    </AppCard>
                  </div>
                </div>
              ) : null}

              <DashboardSection
                recentRuns={recentRuns}
                userGoal={hasDefinedGoal && !goalIsExpired ? userGoal : null}
                filteredMetrics={filteredMetrics}
                period={period}
                onPeriodChange={setPeriod}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="performance">
          {showSkeletons ? (
            <div className="space-y-4">
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </div>
          ) : (
            <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
              <PerformanceSection runs={recentRuns} />
            </Suspense>
          )}
        </TabsContent>
        <TabsContent value="activities">
          {showSkeletons ? (
            <div className="space-y-4">
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </div>
          ) : (
            <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
              <ActivitySection runs={recentRuns} athleteName={athleteName} onOpenActivityDetail={openRunDetail} />
            </Suspense>
          )}
        </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
};

export default Dashboard;
