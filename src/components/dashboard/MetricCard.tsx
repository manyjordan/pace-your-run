import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Route, Clock, Mountain } from "lucide-react";
import type { StravaActivity } from "@/lib/strava";

type WeeklyMetricCard = {
  title: string;
  unit: string;
  currentValue: string;
  change: string;
  icon: typeof Route;
  color: string;
  chartData: Array<{ week: string; value: number; showTick?: boolean }>;
  comment: string;
  granularity?: "week" | "month" | "quarter";
  period?: "1m" | "3m" | "1y" | "all";
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: 12,
};

interface MetricCardProps {
  metric: WeeklyMetricCard;
  index: number;
  onMetricChange?: (title: string, granularity: "week" | "month", period: "1m" | "3m" | "1y" | "all") => void;
  buildMetricData: (title: string, activities: StravaActivity[], granularity: "week" | "month", period: "1m" | "3m" | "1y" | "all") => WeeklyMetricCard;
  activities: StravaActivity[];
}

function CompactYearTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: {
    value: string;
    payload?: { showTick?: boolean };
  };
}) {
  if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
  if (payload.payload?.showTick === false) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={10}
        textAnchor="middle"
        fill="hsl(var(--foreground))"
        fontSize={9}
        fontWeight={600}
      >
        {payload.value}
      </text>
    </g>
  );
}

function formatDashboardTooltip(title: string, value: number): [string, string] {
  if (title.includes("Distance")) {
    return [`${value.toFixed(1).replace(".", ",")} km`, "Distance en km"];
  }

  if (title.includes("Durée")) {
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return [`${hours}h${String(minutes).padStart(2, "0")}`, "Durée en heure et minutes"];
  }

  return [`${Math.round(value)} m`, "Dénivelé en mètres"];
}

function formatMetricBarLabel(title: string, value: number) {
  if (value === 0) return "";
  if (title.includes("Distance")) return `${Math.round(value)}`;
  if (title.includes("Durée")) return `${Math.round(value)}`;
  return `${Math.round(value)}`;
}

export const MetricCard = ({ metric, index, activities, buildMetricData }: MetricCardProps) => {
  const [granularity, setGranularity] = useState<"week" | "month">(metric.granularity as "week" | "month" || "week");
  const [period, setPeriod] = useState<"1m" | "3m" | "1y" | "all">(metric.period as "1m" | "3m" | "1y" | "all" || "3m");

  const updatedMetric = useMemo(
    () => buildMetricData(metric.title, activities, granularity, period),
    [granularity, period, metric.title, activities, buildMetricData]
  );

  return (
    <ScrollReveal key={metric.title} delay={index * 0.06}>
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

          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground">
              Historique des données
            </p>
            <div className="flex gap-1">
              {(["1m", "3m", "1y", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded px-2 py-1 text-xs font-medium transition ${
                    period === p
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p === "1m" ? "1m" : p === "3m" ? "3m" : p === "1y" ? "1a" : "Tout"}
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
                tick={<CompactYearTick />}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value) => formatDashboardTooltip(updatedMetric.title, Number(value))}
              />
              <Bar dataKey="value" fill={updatedMetric.color} radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => formatMetricBarLabel(updatedMetric.title, Number(value))}
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
