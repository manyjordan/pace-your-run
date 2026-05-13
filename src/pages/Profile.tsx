import { useEffect, useMemo, useState } from "react";
import { differenceInDays, getWeek, startOfMonth, startOfYear, subWeeks } from "date-fns";
import { ChevronRight, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RacePredictionsCard } from "@/components/dashboard/RacePredictionsCard";
import { AppCard } from "@/components/ui/page-layout";
import { cache } from "@/lib/cache";
import { getProfile, getRuns, type ProfileRow, type RunRow } from "@/lib/database";
import { normalizeGoalData, type GoalDataShape } from "@/lib/goalHelpers";
import { cn } from "@/lib/utils";

type StatsPeriod = "7d" | "month" | "year" | "all";

type ProfileGoalData = ReturnType<typeof normalizeGoalData>;

function readStatsPeriod(): StatsPeriod {
  const raw = localStorage.getItem("pace_stats_period");
  if (raw === "7d" || raw === "month" || raw === "year" || raw === "all") return raw;
  return "all";
}

function goalSummaryLabel(goal: ProfileGoalData): string {
  if (goal.goalType === "none") return "Sans objectif";
  if (goal.goalType === "weight") return goal.targetWeightKg ? `Poids ${goal.targetWeightKg} kg` : "Objectif poids";
  if (goal.goalType === "distance") return goal.distanceKm ? `${goal.distanceKm} km` : "Objectif distance";
  if (goal.raceType === "marathon") return "Marathon";
  if (goal.raceType === "semi") return "Semi-marathon";
  if (goal.raceType === "20k") return "20 km";
  if (goal.raceType === "10k") return "10 km";
  if (goal.raceType === "5k") return "5 km";
  if (goal.raceDistanceKm) return `${goal.raceDistanceKm} km`;
  return "Course";
}

export default function Profile() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [userGoal, setUserGoal] = useState<ProfileGoalData | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>(readStatsPeriod);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const cached = cache.get<RunRow[]>(`runs_${userId}`);
    const cachedProfile = cache.get<ProfileRow>(`profile_${userId}`);
    if (cached?.length) setRuns(cached);
    if (cachedProfile) {
      setProfile(cachedProfile);
      if (cachedProfile.goal_data && typeof cachedProfile.goal_data === "object" && !Array.isArray(cachedProfile.goal_data)) {
        setUserGoal(normalizeGoalData(cachedProfile.goal_data as GoalDataShape));
      }
    }

    void Promise.all([getRuns(userId), getProfile(userId)])
      .then(([r, p]) => {
        if (r) {
          setRuns(r);
          cache.set(`runs_${userId}`, r);
          cache.set(`runsStats_${userId}`, r);
        }
        if (p) {
          setProfile(p);
          cache.set(`profile_${userId}`, p);
          if (p.goal_data && typeof p.goal_data === "object" && !Array.isArray(p.goal_data)) {
            setUserGoal(normalizeGoalData(p.goal_data as GoalDataShape));
          } else {
            setUserGoal(null);
          }
        }
      })
      .catch(() => {});

    const onRefresh = () => {
      void Promise.all([getRuns(userId), getProfile(userId)]).then(([r, p]) => {
        if (r) {
          setRuns(r);
          cache.set(`runs_${userId}`, r);
          cache.set(`runsStats_${userId}`, r);
        }
        if (p) {
          setProfile(p);
          cache.set(`profile_${userId}`, p);
          if (p.goal_data && typeof p.goal_data === "object" && !Array.isArray(p.goal_data)) {
            setUserGoal(normalizeGoalData(p.goal_data as GoalDataShape));
          }
        }
      });
    };
    window.addEventListener("pace-goal-updated", onRefresh);
    window.addEventListener("pace-runs-updated", onRefresh);
    return () => {
      window.removeEventListener("pace-goal-updated", onRefresh);
      window.removeEventListener("pace-runs-updated", onRefresh);
    };
  }, [session?.user?.id]);

  const filteredRuns = useMemo(() => {
    const now = new Date();
    return runs.filter((r) => {
      const raw = r.started_at ?? r.created_at;
      if (!raw) return false;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return false;
      if (period === "7d") return differenceInDays(now, d) <= 7;
      if (period === "month") return d >= startOfMonth(now);
      if (period === "year") return d >= startOfYear(now);
      return true;
    });
  }, [runs, period]);

  const stats = useMemo(() => {
    const totalKm = filteredRuns.reduce((s, r) => s + (r.distance_km ?? 0), 0);
    const totalHours = filteredRuns.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) / 3600;
    const totalRuns = filteredRuns.length;
    let weeklyStreak = 0;
    if (period === "all" && runs.length > 0) {
      const weekKeys = new Set(
        runs
          .map((r) => r.started_at ?? r.created_at)
          .filter((raw): raw is string => Boolean(raw))
          .map((raw) => {
            const d = new Date(raw);
            return `${d.getFullYear()}-W${String(getWeek(d, { weekStartsOn: 1 })).padStart(2, "0")}`;
          }),
      );
      let checkDate = new Date();
      for (let i = 0; i < 104; i += 1) {
        const key = `${checkDate.getFullYear()}-W${String(getWeek(checkDate, { weekStartsOn: 1 })).padStart(2, "0")}`;
        if (weekKeys.has(key)) {
          weeklyStreak += 1;
          checkDate = subWeeks(checkDate, 1);
        } else {
          break;
        }
      }
    }
    return { totalKm, totalHours, totalRuns, weeklyStreak };
  }, [filteredRuns, period, runs]);

  const firstName = profile?.first_name?.trim() || "Coureur";

  const targetDate =
    userGoal?.raceTargetDate || userGoal?.distanceTargetDate || userGoal?.weightTargetDate || null;
  const parsedTarget = targetDate ? new Date(targetDate) : null;
  const daysUntilGoal =
    parsedTarget && !Number.isNaN(parsedTarget.getTime())
      ? Math.max(0, differenceInDays(parsedTarget, new Date()))
      : null;
  const goalIsExpired =
    parsedTarget != null &&
    !Number.isNaN(parsedTarget.getTime()) &&
    parsedTarget < new Date();

  const profileGoalType = profile?.goal_type;
  const hasActiveGoal =
    (userGoal?.goalType && userGoal.goalType !== "none") ||
    Boolean(profileGoalType && profileGoalType !== "none");

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-safe" />

      <div className="flex flex-col items-center gap-2 px-6 pb-4 pt-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-3xl font-black text-accent">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <p className="text-xl font-black text-foreground">{firstName}</p>
        {profile?.username ? <p className="text-sm text-muted-foreground">@{profile.username.replace(/^@+/, "")}</p> : null}
      </div>

      <div className="space-y-3 px-4 pb-24">
        <div className="flex gap-2">
          {(["7d", "month", "year", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                localStorage.setItem("pace_stats_period", p);
              }}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                period === p ? "bg-accent text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {p === "7d" ? "7j" : p === "month" ? "Mois" : p === "year" ? "Année" : "Total"}
            </button>
          ))}
        </div>

        <AppCard>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                {Math.round(stats.totalKm)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">km</p>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                {Math.round(stats.totalHours)}h
              </p>
              <p className="mt-1 text-xs text-muted-foreground">temps</p>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                {stats.totalRuns}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">sorties</p>
            </div>
          </div>
          {period === "all" && stats.weeklyStreak > 0 ? (
            <div className="mt-3 border-t border-border pt-3 text-center">
              <p className="text-sm font-semibold text-accent">
                🔥 {stats.weeklyStreak} semaine{stats.weeklyStreak > 1 ? "s" : ""} consécutive
                {stats.weeklyStreak > 1 ? "s" : ""}
              </p>
            </div>
          ) : null}
        </AppCard>

        <RacePredictionsCard runs={runs} />

        {hasActiveGoal && !goalIsExpired ? (
          <button type="button" onClick={() => navigate("/plan")} className="w-full text-left">
            <AppCard className="border-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Mon plan</p>
                  <p className="font-bold text-foreground">{userGoal ? goalSummaryLabel(userGoal) : profileGoalType}</p>
                  {daysUntilGoal !== null && daysUntilGoal > 0 ? (
                    <p className="mt-0.5 text-xs text-accent">J-{daysUntilGoal}</p>
                  ) : null}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            </AppCard>
          </button>
        ) : null}

        <button type="button" onClick={() => navigate("/settings")} className="w-full text-left">
          <AppCard>
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">Réglages</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </AppCard>
        </button>

        <button
          type="button"
          onClick={() => void signOut()}
          className="w-full py-3 text-center text-sm font-medium text-destructive"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
