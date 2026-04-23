import { useState, useMemo } from "react";
import { Route } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { BarChartSvg } from "@/components/charts/BarChartSvg";
import {
  type MetricChartPeriod,
  type MetricKind,
  formatXLabel,
} from "@/lib/dashboardHelpers";
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
    granularity: "week" | "month" | "quarter",
    period: MetricChartPeriod,
    metricKind?: MetricKind,
  ) => WeeklyMetricCard;
  activities: RunRow[];
}

export const MetricCard = ({ metric, index, activities, buildMetricData }: MetricCardProps) => {
  const [granularity, setGranularity] = useState<"week" | "month" | "quarter">(
    (metric.granularity as "week" | "month" | "quarter") || "week",
  );
  const chartPeriod = metric.period ?? "3m";

  const updatedMetric = useMemo(
    () => buildMetricData(metric.title, activities, granularity, chartPeriod, metric.metricKind),
    [granularity, chartPeriod, metric.title, metric.metricKind, activities, buildMetricData],
  );

  return (
    <ScrollReveal key={metric.title} delay={index === 0 ? 0 : index < 3 ? 0.05 : 0}>
      <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
        <div className="mb-4 flex items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <updatedMetric.icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">{updatedMetric.title}</h2>
            </div>
          </div>
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
            semaine en cours
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{updatedMetric.change}</p>
        </div>

        <div className="h-44">
          <BarChartSvg
            data={updatedMetric.chartData.map((point) => ({
              label: point.week,
              value: point.value,
              showTick: point.showTick,
            }))}
            height={176}
            formatValue={(value) => {
              if (updatedMetric.unit === "km") return `${Number(value).toFixed(Number(value) >= 10 ? 0 : 1)}`;
              if (updatedMetric.unit === "h") return `${Number(value).toFixed(1)}h`;
              return `${Math.round(Number(value))}`;
            }}
            formatLabel={(label) => formatXLabel(label, chartPeriod)}
          />
        </div>
      </div>
    </ScrollReveal>
  );
};
