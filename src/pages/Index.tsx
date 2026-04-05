import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, List, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, getRuns, type RunRow } from "@/lib/database";
import { normalizeGoalData } from "@/lib/goalHelpers";
import { type GPSTracePoint, type StravaActivity } from "@/lib/strava";
import { ActivityDetail } from "@/components/ActivityDetail";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { PerformanceSection } from "@/components/dashboard/PerformanceSection";
import { ActivitySection } from "@/components/dashboard/ActivitySection";
import { SkeletonHeroBanner } from "@/components/dashboard/SkeletonHeroBanner";
import { SkeletonMetricCard } from "@/components/dashboard/SkeletonMetricCard";
import { buildMetricData, buildGoalAwareWeeklyInsight } from "@/lib/dashboardHelpers";

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

function isRunActivity(activity: StravaActivity) {
  const label = `${activity.sport_type ?? activity.type ?? ""}`.toLowerCase();
  return label.includes("run") || label.includes("course") || label.includes("trail");
}

function hashStringToNumber(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function runRowToStravaActivity(run: RunRow): StravaActivity {
  return {
    id: hashStringToNumber(run.id),
    name: run.title ?? "Course",
    distance: run.distance_km * 1000,
    moving_time: run.duration_seconds,
    elapsed_time: run.duration_seconds,
    total_elevation_gain: run.elevation_gain ?? 0,
    average_heartrate: run.average_heartrate ?? undefined,
    start_date: run.started_at ?? run.created_at ?? new Date().toISOString(),
    sport_type: run.run_type ?? "Run",
    type: run.run_type ?? "Run",
  };
}

function parseGpsTraceForDetail(trace: RunRow["gps_trace"]): GPSTracePoint[] | undefined {
  if (!Array.isArray(trace)) return undefined;

  const points = trace.filter((point): point is GPSTracePoint => {
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
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [athleteName, setAthleteName] = useState("Coureur");
  const [userGoal, setUserGoal] = useState<ProfileGoalData | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<StravaActivity | null>(null);
  const [selectedDetailTrace, setSelectedDetailTrace] = useState<GPSTracePoint[] | undefined>(undefined);

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

  const handleCloseActivityDetail = () => {
    setSelectedActivityForDetail(null);
    setSelectedDetailTrace(undefined);
  };

  const openRunDetail = (run: RunRow) => {
    setSelectedActivityForDetail(runRowToStravaActivity(run));
    setSelectedDetailTrace(parseGpsTraceForDetail(run.gps_trace));
  };

  const runningActivities = useMemo(
    () => recentRuns.map(runRowToStravaActivity).filter(isRunActivity),
    [recentRuns],
  );

  const metricCards = useMemo(
    () => [
      buildMetricData("Distance par semaine", runningActivities, "week", "3m"),
      buildMetricData("Durée par semaine", runningActivities, "week", "3m"),
      buildMetricData("Dénivelé par semaine", runningActivities, "week", "3m"),
    ],
    [runningActivities],
  );

  const filteredMetrics = useMemo(() => metricCards, [metricCards]);

  const weeklyInsight = useMemo(
    () => buildGoalAwareWeeklyInsight(metricCards, userGoal),
    [metricCards, userGoal],
  );

  return (
    <div className="space-y-6">
      {selectedActivityForDetail && (
        <ActivityDetail
          activity={selectedActivityForDetail}
          onClose={handleCloseActivityDetail}
          allActivities={runningActivities}
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
        <ScrollReveal delay={0.02}>
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
        <ScrollReveal delay={0.05}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">
              <Activity className="h-4 w-4 mr-1.5" /> Tableau de bord
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
            <DashboardSection recentRuns={recentRuns} userGoal={userGoal} filteredMetrics={filteredMetrics} />
          )}
        </TabsContent>
        <TabsContent value="performance">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <PerformanceSection runs={recentRuns} />
          )}
        </TabsContent>
        <TabsContent value="activities">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <ActivitySection runs={recentRuns} athleteName={athleteName} onOpenActivityDetail={openRunDetail} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
