import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import { ScrollReveal } from "@/components/ScrollReveal";
import { chartTooltipStyle, CompactWeekTick } from "@/components/dashboard/chartShared";
import {
  type MetricChartPeriod,
  type MetricKind,
  compactWeeklyBarTopLabel,
  formatDashboardTooltipForKind,
} from "@/lib/dashboardHelpers";
import { Route, Clock, Mountain } from "lucide-react";
import type { RunRow } from "@/lib/database";

type WeeklyMetricCard = {
  title: string;
  unit: string;
  currentValue: string;
  change: string;
  icon: typeof Route;
  color: string;
  metricKind: MetricKind;
  chartData: Array<{ week: string; value: number; showTick?: boolean; barLabel?: string }>;
  comment: string;
  granularity?: "week" | "month" | "quarter";
  period?: MetricChartPeriod;
};

interface MetricCardProps {
  metric: WeeklyMetricCard;
  index: number;
  onMetricChange?: (title: string, granularity: "week" | "month", period: MetricChartPeriod) => void;
  buildMetricData: (
    title: string,
    runs: RunRow[],
    granularity: "week" | "month",
    period: MetricChartPeriod,
    metricKind?: MetricKind,
  ) => WeeklyMetricCard;
  activities: RunRow[];
}

export const MetricCard = ({ metric, index, activities, buildMetricData }: MetricCardProps) => {
  const [granularity, setGranularity] = useState<"week" | "month">(metric.granularity as "week" | "month" || "week");
  const chartPeriod = metric.period ?? "3m";

  const updatedMetric = useMemo(
    () => buildMetricData(metric.title, activities, granularity, chartPeriod, metric.metricKind),
    [granularity, chartPeriod, metric.title, metric.metricKind, activities, buildMetricData],
  );

  return (
    <ScrollReveal key={metric.title} delay={index === 0 ? 0 : index < 3 ? 0.05 : 0}>
      <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <updatedMetric.icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">{updatedMetric.title}</h2>
            </div>
          </div>
          <span className="max-w-[240px] rounded-lg bg-accent/10 px-2.5 py-1 text-right text-[11px] font-semibold leading-4 text-lime">
            {updatedMetric.change}
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
                  onClick={() => setGranularity(g)}
                  className={`rounded px-2 py-1 text-xs font-medium transition ${
                    granularity === g
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {g === "week" ? "Sem" : "Mois"}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="mb-4">
          <span className="text-3xl font-bold tabular-nums">{updatedMetric.currentValue}</span>
          <p className="mt-1 text-xs text-muted-foreground">
            {granularity === "week"
              ? "Semaine en cours"
              : "Mois en cours"}
          </p>
        </div>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={updatedMetric.chartData} margin={{ top: 8, right: 4, left: 4, bottom: 16 }}>
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                height={56}
                tick={<CompactWeekTick />}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value) => formatDashboardTooltipForKind(updatedMetric.metricKind, Number(value))}
              />
              <Bar dataKey="value" fill={updatedMetric.color} radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="barLabel"
                  position="top"
                  formatter={(value: string) => compactWeeklyBarTopLabel(updatedMetric.metricKind, value)}
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
  );
};
