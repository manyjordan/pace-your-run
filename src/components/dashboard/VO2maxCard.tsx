import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { estimateVO2maxFromRun } from "@/lib/racePredictions";
import type { RunRow } from "@/lib/database";
import { getStartOfWeek } from "@/lib/dashboardHelpers";
import { chartTooltipStyle } from "@/components/dashboard/chartShared";
import { cn } from "@/lib/utils";

const VO2_WEEKS = 8;

const EXPLAIN =
  "Indicateur clé de votre forme physique : un VO2max en progression signifie que votre condition physique s'améliore et que vous serez capable de meilleures performances en course.";

type Vo2WeekRow = { week: string; vo2: number | null };

function buildVo2WeeklySeries(runs: RunRow[]): Vo2WeekRow[] {
  const now = new Date();
  const currentWeekStart = getStartOfWeek(now);
  const starts: Date[] = [];
  const labels: string[] = [];

  for (let i = VO2_WEEKS - 1; i >= 0; i -= 1) {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - i * 7);
    starts.push(start);
    const d = start.getDate();
    const m = start.getMonth() + 1;
    labels.push(`${d}/${m}`);
  }

  const buckets: number[][] = Array.from({ length: VO2_WEEKS }, () => []);

  for (const run of runs) {
    const raw = run.started_at ?? run.created_at;
    if (!raw) continue;
    const runDate = new Date(raw);
    const runWeekStart = getStartOfWeek(runDate);
    const index = starts.findIndex((s) => s.getTime() === runWeekStart.getTime());
    if (index < 0) continue;

    const v = estimateVO2maxFromRun(run);
    if (v != null) buckets[index].push(v);
  }

  return labels.map((week, i) => {
    const vals = buckets[i];
    if (vals.length === 0) return { week, vo2: null };
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { week, vo2: Math.round(avg * 10) / 10 };
  });
}

function vo2TrendFromSeries(series: Vo2WeekRow[]): "up" | "down" | "stable" {
  const last2 = [series[6]?.vo2, series[7]?.vo2].filter((x): x is number => x != null && Number.isFinite(x));
  const prev2 = [series[4]?.vo2, series[5]?.vo2].filter((x): x is number => x != null && Number.isFinite(x));
  if (last2.length === 0 || prev2.length === 0) return "stable";
  const mLast = last2.reduce((a, b) => a + b, 0) / last2.length;
  const mPrev = prev2.reduce((a, b) => a + b, 0) / prev2.length;
  const diff = mLast - mPrev;
  if (diff > 0.35) return "up";
  if (diff < -0.35) return "down";
  return "stable";
}

export function VO2maxCard({ runs }: { runs: RunRow[] }) {
  const series = useMemo(() => buildVo2WeeklySeries(runs), [runs]);
  const hasAnyPoint = useMemo(() => series.some((r) => r.vo2 != null), [series]);
  const trend = useMemo(() => vo2TrendFromSeries(series), [series]);

  if (!hasAnyPoint) {
    return (
      <div className="rounded-xl border border-accent/20 bg-card/95 p-5">
        <h2 className="mb-2 text-sm font-semibold">VO2max — évolution</h2>
        <p className="text-sm text-muted-foreground">
          Enregistrez des courses avec distance et durée sur les dernières semaines pour afficher l&apos;évolution estimée
          de votre VO2max.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{EXPLAIN}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-card/95 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">VO2max — évolution (8 semaines)</h2>
        <span
          className={cn(
            "text-xs font-medium",
            trend === "up" && "text-green-600 dark:text-green-400",
            trend === "down" && "text-red-600 dark:text-red-400",
            trend === "stable" && "text-muted-foreground",
          )}
        >
          {trend === "up" && "↑ En amélioration"}
          {trend === "down" && "↓ En baisse"}
          {trend === "stable" && "→ Stable"}
        </span>
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="vo2maxAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.28} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value) => [(value != null ? `${Number(value).toFixed(1)} ml/kg/min` : "—"), "VO2max moy."]}
              labelFormatter={(label) => `Semaine ${label}`}
            />
            <Area
              type="monotone"
              dataKey="vo2"
              stroke="none"
              fill="url(#vo2maxAreaFill)"
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="vo2"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{EXPLAIN}</p>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/90">
        Estimation indicative par sortie (formule simplifiée), puis moyenne hebdomadaire. Ce n&apos;est pas une mesure
        clinique.
      </p>
    </div>
  );
}
