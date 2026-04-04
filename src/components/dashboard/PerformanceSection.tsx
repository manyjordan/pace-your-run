import { useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LabelList } from "recharts";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TrendingUp, AlertTriangle, Award } from "lucide-react";
import { buildVo2Series, buildAcwrSeries, getPersonalRecords, type StravaActivity } from "@/lib/strava";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: 12,
};

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

export const PerformanceSection = ({
  activities,
}: {
  activities: StravaActivity[];
}) => {
  const [vo2Granularity, setVo2Granularity] = useState<"week" | "month">("week");
  const [vo2Period, setVo2Period] = useState<"1m" | "3m" | "1y" | "all">("3m");

  const vo2Series = useMemo(
    () => buildVo2Series(activities, vo2Granularity, vo2Period),
    [activities, vo2Granularity, vo2Period],
  );
  const acwrSeries = useMemo(() => buildAcwrSeries(activities), [activities]);
  const prs = useMemo(() => getPersonalRecords(activities), [activities]);

  const currentVo2 = [...vo2Series].reverse().find((item) => item.value > 0)?.value ?? 0;
  const currentAcwr = acwrSeries[acwrSeries.length - 1]?.value ?? 0;

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Tendance VO2 max</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimation dérivée de l'allure moyenne et de la durée de chaque, puis agrégée sur la période choisie.
              </p>
            </div>
            <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-[11px] font-semibold leading-4 text-lime">
              {currentVo2 > 0 ? `${currentVo2.toFixed(1)} ml/kg/min` : "Aucune donnée"}
            </span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">Granularité des données</p>
              <div className="flex gap-1">
                {(["week", "month"] as const).map((granularity) => (
                  <button
                    key={granularity}
                    onClick={() => setVo2Granularity(granularity)}
                    className={`rounded px-2 py-1 text-xs font-medium transition ${
                      vo2Granularity === granularity
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {granularity === "week" ? "Sem" : "Mois"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">Historique des données</p>
              <div className="flex gap-1">
                {(["1m", "3m", "1y", "all"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setVo2Period(period)}
                    className={`rounded px-2 py-1 text-xs font-medium transition ${
                      vo2Period === period
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {period === "1m" ? "1m" : period === "3m" ? "3m" : period === "1y" ? "1a" : "Tout"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold tabular-nums">
              {currentVo2 > 0 ? currentVo2.toFixed(1) : "--"}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">Dernière estimation fiable</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vo2Series} margin={{ top: 8, right: 4, left: 4, bottom: 16 }}>
                <XAxis dataKey="week" axisLine={false} tickLine={false} height={56} tick={<CompactYearTick />} interval={0} />
                <YAxis hide />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${Number(value).toFixed(1).replace(".", ",")} ml/kg/min`, "VO2 max estimée"]}
                />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(value: number) => (Number(value) === 0 ? "" : `${Math.round(Number(value))}`)}
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

      <ScrollReveal>
        <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Ratio charge aiguë : Chronique</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimation basée sur la durée, modulée par la fréquence cardiaque moyenne quand elle est disponible, puis comparée à la moyenne des 4 semaines précédentes.
              </p>
            </div>
            <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-[11px] font-semibold leading-4 text-lime">
              {currentAcwr > 0 ? currentAcwr.toFixed(2) : "Aucune donnée"}
            </span>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold tabular-nums">
              {currentAcwr > 0 ? currentAcwr.toFixed(2) : "--"}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">Zone idéale : 0.80 à 1.30</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acwrSeries} margin={{ top: 8, right: 4, left: 4, bottom: 16 }}>
                <defs>
                  <linearGradient id="acwrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} height={56} tick={<CompactYearTick />} interval={0} />
                <YAxis hide domain={[0, 2]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${Number(value).toFixed(2).replace(".", ",")}`, "Ratio charge aiguë : Chronique"]}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#acwrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-lime" /><h2 className="text-sm font-semibold">Records personnels</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {prs.map((pr, i) => (
              <ScrollReveal key={pr.event} delay={i * 0.06}>
                <div className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
                  <p className="text-xs font-medium text-muted-foreground">{pr.event}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{pr.time}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{pr.date}</span>
                    <span className="flex items-center gap-0.5 font-semibold text-lime">{pr.improvement}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};
