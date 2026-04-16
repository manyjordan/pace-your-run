import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, List, TrendingUp } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, getRuns, type RunGpsPoint, type RunRow } from "@/lib/database";
import { normalizeGoalData } from "@/lib/goalHelpers";
import { ActivityDetail } from "@/components/ActivityDetail";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { SkeletonHeroBanner } from "@/components/dashboard/SkeletonHeroBanner";
import { SkeletonMetricCard } from "@/components/dashboard/SkeletonMetricCard";
import {
  buildMetricData,
  buildGoalAwareWeeklyInsight,
  type MetricChartPeriod,
} from "@/lib/dashboardHelpers";

type DashboardPeriod = Extract<MetricChartPeriod, "3m" | "6m" | "1y" | "all">;

const PerformanceSection = lazy(() =>
  import("@/components/dashboard/PerformanceSection").then((module) => ({ default: module.PerformanceSection })),
);
const ActivitySection = lazy(() =>
  import("@/components/dashboard/ActivitySection").then((module) => ({ default: module.ActivitySection })),
);

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
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [athleteName, setAthleteName] = useState("Coureur");
  const [userGoal, setUserGoal] = useState<ProfileGoalData | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [selectedRunForDetail, setSelectedRunForDetail] = useState<RunRow | null>(null);
  const [selectedDetailTrace, setSelectedDetailTrace] = useState<RunGpsPoint[] | undefined>(undefined);
  const [period, setPeriod] = useState<DashboardPeriod>("3m");

  const loadUserData = useCallback(async () => {
    if (!session?.user.id) {
      setUserGoal(null);
      setRunCount(0);
      setRecentRuns([]);
      setAthleteName("Coureur");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [profile, runs] = await Promise.all([getProfile(session.user.id), getRuns(session.user.id)]);

      setRunCount(runs.length);
      setRecentRuns(runs);

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
    } finally {
      setIsLoading(false);
    }
  }, [session?.user.id]);

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
      void loadUserData();
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
  }, [loadUserData]);

  useEffect(() => {
    if (location.pathname === "/") {
      void loadUserData();
    }
  }, [location.pathname, loadUserData]);

  const handleCloseActivityDetail = () => {
    setSelectedRunForDetail(null);
    setSelectedDetailTrace(undefined);
  };

  const openRunDetail = (run: RunRow) => {
    setSelectedRunForDetail(run);
    setSelectedDetailTrace(parseGpsTraceForDetail(run.gps_trace));
  };

  const runningRuns = useMemo(() => recentRuns.filter(isRunRow), [recentRuns]);

  const metricCards = useMemo(() => {
    const granularity = period === "3m" ? "week" : "month";
    const titles =
      granularity === "week"
        ? {
            distance: "Distance par semaine",
            duration: "Durée par semaine",
            elevation: "Dénivelé par semaine",
          }
        : {
            distance: "Distance par mois",
            duration: "Durée par mois",
            elevation: "Dénivelé par mois",
          };
    return [
      buildMetricData(titles.distance, runningRuns, granularity, period, "distance"),
      buildMetricData(titles.duration, runningRuns, granularity, period, "duration"),
      buildMetricData(titles.elevation, runningRuns, granularity, period, "elevation"),
    ];
  }, [runningRuns, period]);

  const filteredMetrics = useMemo(() => metricCards, [metricCards]);

  const weeklyInsight = useMemo(
    () => buildGoalAwareWeeklyInsight(metricCards, userGoal),
    [metricCards, userGoal],
  );

  return (
    <div className="space-y-6">
      {selectedRunForDetail && (
        <ActivityDetail
          activity={selectedRunForDetail}
          onClose={handleCloseActivityDetail}
          allActivities={runningRuns}
          fallbackTrace={selectedDetailTrace}
        />
      )}

      <ScrollReveal>
        {isLoading ? (
          <SkeletonHeroBanner />
        ) : (
          <div className="rounded-2xl border border-accent/70 bg-accent px-5 py-5 text-accent-foreground shadow-[0_18px_44px_hsl(var(--accent)/0.2)]">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Bonjour <span className="text-accent-foreground">{athleteName}</span>
              </h1>
              <p className="mt-1 text-sm text-accent-foreground/80">{weeklyInsight}</p>
            </div>
          </div>
        )}
      </ScrollReveal>

      {!isLoading && runCount < 3 && (
        <ScrollReveal>
          <div className="rounded-2xl border border-accent/30 bg-card px-5 py-4 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
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
          </div>
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
          {isLoading ? (
            <div className="space-y-6">
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </div>
          ) : (
            <DashboardSection
              recentRuns={recentRuns}
              userGoal={userGoal}
              filteredMetrics={filteredMetrics}
              period={period}
              onPeriodChange={setPeriod}
            />
          )}
        </TabsContent>
        <TabsContent value="performance">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
              <PerformanceSection runs={recentRuns} />
            </Suspense>
          )}
        </TabsContent>
        <TabsContent value="activities">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
              <ActivitySection runs={recentRuns} athleteName={athleteName} onOpenActivityDetail={openRunDetail} />
            </Suspense>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
