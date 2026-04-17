import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ScrollReveal } from "@/components/ScrollReveal";
import { RacePredictionsCard } from "@/components/dashboard/RacePredictionsCard";
import { VO2maxCard } from "@/components/dashboard/VO2maxCard";
import { chartTooltipStyle, CompactWeekTick } from "@/components/dashboard/chartShared";
import { TrendingUp, Route, BarChart3, Award } from "lucide-react";
import type { RunRow } from "@/lib/database";
import { getStartOfWeek, type MetricChartPeriod } from "@/lib/dashboardHelpers";
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

  return { paceSeries, distanceSeries };
}

const PERFORMANCE_CHART_PERIOD: MetricChartPeriod = "3m";

export const PerformanceSection = ({
  runs,
  runsForStats,
}: {
  runs: RunRow[];
  runsForStats: RunRow[];
}) => {
  const { paceSeries, distanceSeries } = useMemo(() => weekBuckets(runs), [runs]);

  const stats = useMemo(() => {
    if (runsForStats.length === 0) {
      return {
        totalKm: 0,
        totalDuration: 0,
        runCount: 0,
        longestKm: 0,
        bestPaceLabel: "—",
        avgPaceLabel: "—",
      };
    }

    const totalKm = runsForStats.reduce((s, r) => s + r.distance_km, 0);
    const totalDuration = runsForStats.reduce((s, r) => s + r.duration_seconds, 0);
    const longestKm = Math.max(...runsForStats.map((r) => r.distance_km), 0);
    const withPace = runsForStats.filter((r) => r.distance_km > 0.05 && r.duration_seconds > 0);
    let bestPaceLabel = "—";
    let bestSecPerKm = Number.POSITIVE_INFINITY;
    for (const r of withPace) {
      const sec = r.duration_seconds / r.distance_km;
      if (sec < bestSecPerKm) {
        bestSecPerKm = sec;
        bestPaceLabel = formatPace(r.distance_km * 1000, r.duration_seconds);
      }
    }
    const avgPaceLabel =
      totalKm > 0.01 ? formatPace(totalKm * 1000, totalDuration) : "—";

    return {
      totalKm,
      totalDuration,
      runCount: runsForStats.length,
      longestKm,
      bestPaceLabel,
      avgPaceLabel,
    };
  }, [runsForStats]);

  const lastPace = [...paceSeries].reverse().find((p) => p.value > 0);
  const lastDistance = [...distanceSeries].reverse().find((d) => d.value > 0);

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
            <span className="text-3xl font-bold tabular-nums">{lastPace?.paceLabel ?? "—"}</span>
            <p className="mt-1 text-xs text-muted-foreground">semaine en cours</p>
            <p className="mt-1 text-xs text-muted-foreground">Dernière semaine avec course</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paceSeries} margin={{ top: 8, right: 8, left: 4, bottom: 16 }}>
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  height={64}
                  tick={<CompactWeekTick granularity="week" period={PERFORMANCE_CHART_PERIOD} />}
                  interval={0}
                />
                <YAxis
                  width={40}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) =>
                    Number(value) > 0 ? formatPace(1000, Number(value)) : ""
                  }
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(_value, _name, props) => {
                    const p = props?.payload as { paceLabel?: string } | undefined;
                    return [p?.paceLabel || "—", "Allure moy."];
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.85}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
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
              {lastDistance != null && lastDistance.value > 0 ? `${lastDistance.value} km` : "—"}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">semaine en cours</p>
            <p className="mt-1 text-xs text-muted-foreground">Dernière semaine avec volume</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distanceSeries} margin={{ top: 8, right: 8, left: 4, bottom: 16 }}>
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  height={64}
                  tick={<CompactWeekTick granularity="week" period={PERFORMANCE_CHART_PERIOD} />}
                  interval={0}
                />
                <YAxis
                  width={36}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `${Number(value).toFixed(Number(value) >= 10 ? 0 : 1)}`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [`${Number(value).toFixed(1).replace(".", ",")} km`, "Distance"]}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.85}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
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
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Sorties enregistrées
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{stats.runCount}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Route className="h-3.5 w-3.5" />
                Distance cumulée
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{formatDistance(stats.totalKm * 1000)}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Plus longue sortie
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {stats.longestKm > 0 ? `${stats.longestKm.toFixed(1)} km` : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
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
