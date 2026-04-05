import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, List, TrendingUp, Heart, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, getRuns, type RunRow } from "@/lib/database";
import { normalizeGoalData } from "@/lib/goalHelpers";
import {
  type StravaActivity,
} from "@/lib/strava";
import { ActivityDetail } from "@/components/ActivityDetail";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { PerformanceSection } from "@/components/dashboard/PerformanceSection";
import { ActivitySection } from "@/components/dashboard/ActivitySection";
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
  return (
    label.includes("run") ||
    label.includes("course") ||
    label.includes("trail")
  );
}

const Dashboard = () => {
  const { session } = useAuth();
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athleteName, setAthleteName] = useState("Coureur");
  const [userGoal, setUserGoal] = useState<ProfileGoalData | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<StravaActivity | null>(null);

  const handleCloseActivityDetail = () => {
    setSelectedActivityForDetail(null);
  };

  useEffect(() => {
    const loadStravaActivities = async (jwt: string) => {
      try {
        const response = await fetch("/functions/v1/strava-activities", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        const data = await response.json();

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
        setActivities([]);
      }
    };

    const loadUserGoal = async () => {
      if (!session?.user.id) {
        setUserGoal(null);
        setRunCount(0);
        return;
      }

      try {
        const [profile, runs] = await Promise.all([
          getProfile(session.user.id),
          getRuns(session.user.id),
        ]);

        setRunCount(runs.length);
        setRecentRuns(runs);
        if (profile?.first_name?.trim()) {
          setAthleteName(profile.first_name.trim());
        }
        if (profile?.goal_data && typeof profile.goal_data === "object" && !Array.isArray(profile.goal_data)) {
          setUserGoal(normalizeGoalData(profile.goal_data as ProfileGoalData) as ProfileGoalData);
          return;
        }

        setUserGoal(null);
      } catch {
        setUserGoal(null);
        setRunCount(0);
        setRecentRuns([]);
      }
    };

    const handleGoalUpdate = () => {
      void loadUserGoal();
    };

    void loadUserGoal();

    if (session?.access_token) {
      void loadStravaActivities(session.access_token);
    } else {
      setActivities([]);
    }

    window.addEventListener("pace-goal-updated", handleGoalUpdate);
    window.addEventListener("pace-runs-updated", handleGoalUpdate);
    return () => {
      window.removeEventListener("pace-goal-updated", handleGoalUpdate);
      window.removeEventListener("pace-runs-updated", handleGoalUpdate);
    };
  }, [session?.access_token, session?.user?.id]);

  const runningActivities = useMemo(
    () => activities.filter(isRunActivity),
    [activities],
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
          allActivities={activities}
        />
      )}

      <ScrollReveal>
        <div className="rounded-2xl border border-accent/70 bg-accent px-5 py-5 text-accent-foreground shadow-[0_18px_44px_hsl(var(--accent)/0.2)]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Bonjour <span className="text-accent-foreground">{athleteName}</span>
            </h1>
            <p className="mt-1 text-sm text-accent-foreground/80">{weeklyInsight}</p>
          </div>
        </div>
      </ScrollReveal>

      {runCount < 3 && (
        <ScrollReveal delay={0.02}>
          <div className="rounded-2xl border border-accent/30 bg-card px-5 py-4 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Importez votre historique de courses pour voir vos statistiques</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  GPX, FIT, archive Strava/Nike/Adidas ou export Apple Health, importe ton historique de courses en un clin d'oeil.
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

      <ScrollReveal delay={0.03}>
        <Link
          to="/health"
          className="flex items-center justify-between rounded-2xl border border-accent/30 bg-card px-5 py-4 shadow-[0_12px_30px_hsl(var(--accent)/0.08)] transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-2.5">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">Santé & Blessures</p>
              <p className="text-sm text-muted-foreground">
                Conseils, prévention et suivi de votre forme
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
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
            recentRuns={recentRuns}
            userGoal={userGoal}
            filteredMetrics={filteredMetrics}
          />
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceSection activities={runningActivities} />
        </TabsContent>
        <TabsContent value="activities">
          <ActivitySection
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
