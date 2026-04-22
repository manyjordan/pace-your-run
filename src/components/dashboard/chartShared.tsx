import { formatXLabel, type MetricChartPeriod } from "@/lib/dashboardHelpers";

export const chartTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: 12,
};

/** X-axis tick for weekly charts: hides labels when `showTick` is false on the payload. */
export function CompactWeekTick({
  x,
  y,
  payload,
  period = "3m",
}: {
  x?: number;
  y?: number;
  payload?: { value: string; payload?: { showTick?: boolean } };
  period?: MetricChartPeriod;
}) {
  if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
  if (payload.payload?.showTick === false) return null;
  const display = formatXLabel(String(payload.value ?? ""), period);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="hsl(var(--muted-foreground))"
        fontSize={10}
        fontWeight={500}
        transform="rotate(-90)"
      >
        {display}
      </text>
    </g>
  );
}
