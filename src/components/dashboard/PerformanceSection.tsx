import { useMemo } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { RacePredictionsCard } from "@/components/dashboard/RacePredictionsCard";
import { VO2maxCard } from "@/components/dashboard/VO2maxCard";
import { BarChartSvg } from "@/components/charts/BarChartSvg";
import { TrendingUp, Route, BarChart3, Award } from "lucide-react";
import type { RunRow } from "@/lib/database";
import { formatXLabel, getMetricPeriodLabel, getStartOfWeek, type MetricChartPeriod } from "@/lib/dashboardHelpers";
import { formatDistance, formatDuration, formatPace } from "@/lib/runFormatters";

const WEEKS_BACK = 12;

function weekBuckets(runs: RunRow[]) {
  const now = new Date();
  const currentWeekStart = getStartOfWeek(now);
  const labels: string[] = [];
  const starts: Date[] = [];

  for (let i = WEEKS_BACK - 1; i >= 0; i -= 1) {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - i * 7);
    starts.push(start);
    const d = start.getDate();
    const m = start.getMonth() + 1;
    labels.push(`${d}/${m}`);
  }

  const distanceKm = new Array(WEEKS_BACK).fill(0);
  const paceWeightedNum = new Array(WEEKS_BACK).fill(0);
  const paceWeightedDen = new Array(WEEKS_BACK).fill(0);

  for (const run of runs) {
    const raw = run.started_at ?? run.created_at;
    if (!raw) continue;
    const runDate = new Date(raw);
    const runWeekStart = getStartOfWeek(runDate);
    const index = starts.findIndex((s) => s.getTime() === runWeekStart.getTime());
    if (index < 0) continue;

    distanceKm[index] += run.distance_km;
    if (run.distance_km > 0 && run.duration_seconds > 0) {
      paceWeightedNum[index] += run.duration_seconds;
      paceWeightedDen[index] += run.distance_km;
    }
  }

  const paceSeries = labels.map((week, i) => {
    const den = paceWeightedDen[i];
    const paceSecondsPerKm = den > 0 ? paceWeightedNum[i] / den : 0;
    return {
      week,
      value: paceSecondsPerKm,
      showTick: i % 2 === 0,
      paceLabel: den > 0 ? formatPace(den * 1000, paceWeightedNum[i]) : "",
    };
  });

  const distanceSeries = labels.map((week, i) => {
    const km = Math.round(distanceKm[i] * 10) / 10;
    return {
      week,
      value: km,
      showTick: i % 2 === 0,
      distanceBarLabel: km > 0 ? `${String(km).replace(".", ",")} km` : "",
    };
  });

  const totalDistanceKm = distanceKm.reduce((sum, value) => sum + value, 0);
  const totalDurationSeconds = paceWeightedNum.reduce((sum, value) => sum + value, 0);
  const periodPaceLabel =
    totalDistanceKm > 0 && totalDurationSeconds > 0 ? formatPace(totalDistanceKm * 1000, totalDurationSeconds) : "—";

  return { paceSeries, distanceSeries, totalDistanceKm, periodPaceLabel };
}

const PERFORMANCE_CHART_PERIOD: MetricChartPeriod = "3m";

export const PerformanceSection = ({
  runs,
  runsForStats,
}: {
  runs: RunRow[];
  runsForStats: RunRow[];
}) => {
  const { paceSeries, distanceSeries, totalDistanceKm, periodPaceLabel } = useMemo(() => weekBuckets(runs), [runs]);

  const stats = useMemo(() => {
    if (runsForStats.length === 0) {
      return {
        totalKm: 0,
        totalDuration: 0,
        totalElevation: 0,
        runCount: 0,
        longestKm: 0,
        bestPaceLabel: "—",
        avgPaceLabel: "—",
      };
    }

    // Use all runs (recorded + imported) without filtering by source/run_type.
    const totalKm = runsForStats.reduce((sum, r) => sum + (r.distance_km ?? 0), 0);
    const totalDuration = runsForStats.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0);
    const totalElevation = runsForStats.reduce((sum, r) => sum + (r.elevation_gain ?? 0), 0);
    const longestKm = Math.max(...runsForStats.map((r) => r.distance_km ?? 0), 0);
    const withPace = runsForStats.filter((r) => (r.distance_km ?? 0) > 0.05 && (r.duration_seconds ?? 0) > 0);
    let bestPaceLabel = "—";
    let bestSecPerKm = Number.POSITIVE_INFINITY;
    for (const r of withPace) {
      const sec = (r.duration_seconds ?? 0) / (r.distance_km ?? 1);
      if (sec < bestSecPerKm) {
        bestSecPerKm = sec;
        bestPaceLabel = formatPace((r.distance_km ?? 0) * 1000, r.duration_seconds ?? 0);
      }
    }
    const avgPace = totalKm > 0 ? totalDuration / totalKm : 0;
    const avgPaceLabel = avgPace > 0 ? formatPace(totalKm * 1000, totalDuration) : "—";

    return {
      totalKm,
      totalDuration,
      totalElevation,
      runCount: runsForStats.length,
      longestKm,
      bestPaceLabel,
      avgPaceLabel,
    };
  }, [runsForStats]);

  return (
    <div className="space-y-6">
      <div>
        <VO2maxCard runs={runsForStats} />
      </div>
      <ScrollReveal>
        <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <div className="mb-4 flex items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Allure moyenne par semaine</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Moyenne pondérée des sorties enregistrées dans l&apos;app sur les 12 dernières semaines.
              </p>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold tabular-nums">{periodPaceLabel}</span>
            <p className="mt-1 text-xs text-muted-foreground">{getMetricPeriodLabel(PERFORMANCE_CHART_PERIOD)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Allure moyenne pondérée sur la période</p>
          </div>
          <div className="h-44">
            <BarChartSvg
              data={paceSeries.map((point) => ({
                label: point.week,
                value: point.value,
                showTick: point.showTick,
              }))}
              height={176}
              formatValue={(value) => (Number(value) > 0 ? formatPace(1000, Number(value)) : "")}
              formatLabel={(label) => formatXLabel(label, PERFORMANCE_CHART_PERIOD)}
            />
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <div className="mb-4 flex items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Volume hebdomadaire</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Kilomètres cumulés par semaine (12 dernières semaines).</p>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold tabular-nums">
              {totalDistanceKm > 0 ? `${totalDistanceKm.toFixed(1)} km` : "—"}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">{getMetricPeriodLabel(PERFORMANCE_CHART_PERIOD)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Distance cumulée sur la période</p>
          </div>
          <div className="h-44">
            <BarChartSvg
              data={distanceSeries.map((point) => ({
                label: point.week,
                value: point.value,
                showTick: point.showTick,
              }))}
              height={176}
              formatValue={(value) => `${Number(value).toFixed(Number(value) >= 10 ? 0 : 1)}`}
              formatLabel={(label) => formatXLabel(label, PERFORMANCE_CHART_PERIOD)}
            />
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold">Synthèse sur vos courses</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Sorties totales
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{stats.runCount}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Route className="h-3.5 w-3.5" />
                Distance cumulée
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{formatDistance(stats.totalKm * 1000)}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Plus longue sortie
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {stats.longestKm > 0 ? `${stats.longestKm.toFixed(1)} km` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Award className="h-3.5 w-3.5" />
                Meilleure allure moyenne
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{stats.bestPaceLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">Allure globale moyenne : {stats.avgPaceLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">Temps total : {formatDuration(stats.totalDuration)}</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <RacePredictionsCard runs={runsForStats} />
      </ScrollReveal>
    </div>
  );
};
