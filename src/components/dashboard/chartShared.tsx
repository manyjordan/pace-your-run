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
}: {
  x?: number;
  y?: number;
  payload?: { value: string; payload?: { showTick?: boolean } };
}) {
  if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
  if (payload.payload?.showTick === false) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="end"
        fill="hsl(var(--foreground))"
        fontSize={11}
        fontWeight={500}
        transform="rotate(-35)"
      >
        {payload.value}
      </text>
    </g>
  );
}
