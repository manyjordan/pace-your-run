import { useMemo, useState } from "react";
import { differenceInDays, format, getWeek, startOfMonth, startOfWeek, startOfYear, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityDetail } from "@/components/ActivityDetail";
import { BarChartSvg } from "@/components/charts/BarChartSvg";
import { RacePredictionsCard } from "@/components/dashboard/RacePredictionsCard";
import { AppCard } from "@/components/ui/page-layout";
import type { RunRow } from "@/lib/database";
import { normalizeGoalData, type GoalDataShape } from "@/lib/goalHelpers";
import { formatPaceFromSeconds } from "@/lib/runFormatters";
import { cn } from "@/lib/utils";

type ProfileGoalData = ReturnType<typeof normalizeGoalData>;

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
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const { runs, profile } = useData();
  const [period, setPeriod] = useState<"month" | "year" | "all">(
    () => (localStorage.getItem("pace_stats_period") as "month" | "year" | "all" | null) ?? "month",
  );
  const [selectedRun, setSelectedRun] = useState<RunRow | null>(null);

  const userGoal = useMemo(() => {
    const gd = profile?.goal_data;
    if (gd && typeof gd === "object" && !Array.isArray(gd)) {
      return normalizeGoalData(gd as GoalDataShape);
    }
    return null;
  }, [profile?.goal_data]);

  const filteredRuns = useMemo(() => {
    const now = new Date();
    return runs.filter((r) => {
      const raw = r.started_at ?? r.created_at;
      if (!raw) return false;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return false;
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

  const chartData = useMemo(() => {
    const weeks = new Map<number, { label: string; value: number }>();
    filteredRuns.forEach((r) => {
      const raw = r.started_at ?? r.created_at;
      if (!raw) return;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return;
      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      const key = weekStart.getTime();
      const label = format(weekStart, "dd/MM");
      const dist = r.distance_km ?? 0;
      const cur = weeks.get(key);
      if (cur) {
        weeks.set(key, { label: cur.label, value: cur.value + dist });
      } else {
        weeks.set(key, { label, value: dist });
      }
    });
    return Array.from(weeks.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, { label, value }]) => ({ label, value: Math.round(value * 10) / 10 }));
  }, [filteredRuns]);

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
    <div className="flex flex-col bg-background" style={{ minHeight: "100dvh" }}>
      <div className="pt-safe" />

      <div className="flex flex-1 flex-col space-y-3 px-4 pb-32">
        <div className="flex flex-col items-center gap-2 pb-2 pt-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-3xl font-bold text-accent">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <p className="text-xl font-bold text-foreground">{firstName}</p>
          {profile?.username ? (
            <p className="text-sm text-muted-foreground">@{profile.username.replace(/^@+/, "")}</p>
          ) : null}
        </div>

        <div className="flex gap-2">
          {(["month", "year", "all"] as const).map((p) => (
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
              {p === "month" ? "Mois" : p === "year" ? "Année" : "Total"}
            </button>
          ))}
        </div>

        <AppCard>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-metric text-3xl font-bold text-foreground">
                {Math.round(stats.totalKm)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">km</p>
            </div>
            <div>
              <p className="font-metric text-3xl font-bold text-foreground">
                {Math.round(stats.totalHours)}h
              </p>
              <p className="mt-1 text-xs text-muted-foreground">temps</p>
            </div>
            <div>
              <p className="font-metric text-3xl font-bold text-foreground">
                {stats.totalRuns}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">sorties</p>
            </div>
          </div>
          {chartData.length > 1 ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs text-muted-foreground">km / semaine</p>
              <BarChartSvg
                data={chartData}
                height={80}
                color="hsl(var(--accent))"
                highlightLast={true}
                showValueLabels={false}
              />
            </div>
          ) : null}
          {period === "all" && stats.weeklyStreak > 0 ? (
            <div className="mt-3 border-t border-border pt-3 text-center">
              <p className="text-sm font-semibold text-accent">
                {stats.weeklyStreak}{" "}
                {stats.weeklyStreak > 1 ? "semaines consécutives" : "semaine consécutive"}
              </p>
            </div>
          ) : null}
        </AppCard>

        <RacePredictionsCard runs={runs} />

        {hasActiveGoal && !goalIsExpired ? (
          <button type="button" onClick={() => navigate("/plan")} className="w-full text-left">
            <AppCard className="border-2 border-accent">
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

        {runs.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Activités</p>
            <div className="space-y-2">
              {runs.slice(0, 20).map((run) => (
                <button key={run.id} type="button" onClick={() => setSelectedRun(run)} className="w-full text-left">
                  <AppCard className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{run.title || "Course"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(run.started_at ?? run.created_at ?? ""), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                          {(run.distance_km ?? 0).toFixed(2)} km
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPaceFromSeconds(run.duration_seconds ?? 0, (run.distance_km ?? 0) * 1000)}
                        </p>
                      </div>
                      <ChevronRight className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </AppCard>
                </button>
              ))}
            </div>
          </div>
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

      {selectedRun && session?.user?.id ? (
        <ActivityDetail
          activity={selectedRun}
          userId={session.user.id}
          onClose={() => setSelectedRun(null)}
          allActivities={runs}
        />
      ) : null}
    </div>
  );
}
