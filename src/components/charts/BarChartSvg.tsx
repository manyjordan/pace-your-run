import { useMemo } from "react";

interface BarData {
  label: string;
  value: number;
  showTick?: boolean;
}

interface BarChartSvgProps {
  data: BarData[];
  height?: number;
  color?: string;
  unit?: string;
  formatValue?: (v: number) => string;
  formatLabel?: (l: string) => string;
}

export function BarChartSvg({
  data,
  height = 120,
  color = "hsl(var(--accent))",
  formatValue,
  formatLabel,
}: BarChartSvgProps) {
  const showBarLabel = (i: number, total: number): boolean => {
    if (total <= 8) return true;
    if (total <= 16) return i % 2 === 0;
    if (total <= 26) return i % 3 === 0;
    return i % 4 === 0;
  };

  const { bars, yLabels, maxValue } = useMemo(() => {
    if (!data.length) return { bars: [] as BarData[], yLabels: [] as string[], maxValue: 0 };
    const max = Math.max(...data.map((d) => d.value), 0.001);
    const ySteps = 3;
    const labels = Array.from({ length: ySteps + 1 }, (_, i) => {
      const value = (max * i) / ySteps;
      return formatValue ? formatValue(value) : String(Math.round(value));
    }).reverse();
    return { bars: data, yLabels: labels, maxValue: max };
  }, [data, formatValue]);

  if (!bars.length) return null;

  const paddingLeft = 36;
  const paddingBottom = 48;
  const paddingTop = 8;
  const paddingRight = 8;
  const chartWidth = 400;
  const chartHeight = height - paddingBottom - paddingTop;
  const barWidth = Math.max(4, (chartWidth - paddingLeft - paddingRight) / (bars.length * 1.5) - 2);
  const gap = (chartWidth - paddingLeft - paddingRight - bars.length * barWidth) / (bars.length + 1);

  return (
    <svg viewBox={`0 0 ${chartWidth} ${height}`} width="100%" height={height} className="overflow-visible">
      {yLabels.map((label, i) => {
        const y = paddingTop + (chartHeight * i) / yLabels.length;
        return (
          <g key={`y-${label}-${i}`}>
            <text x={paddingLeft - 4} y={y + 4} textAnchor="end" fontSize={9} fill="hsl(var(--muted-foreground))">
              {label}
            </text>
            <line
              x1={paddingLeft}
              y1={y}
              x2={chartWidth - paddingRight}
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
          </g>
        );
      })}

      {bars.map((bar, i) => {
        const x = paddingLeft + gap + i * (barWidth + gap);
        const barH = Math.max(2, (bar.value / maxValue) * chartHeight);
        const y = paddingTop + chartHeight - barH;
        const label = formatLabel ? formatLabel(bar.label) : bar.label;
        const isSignificant = bar.value >= maxValue * 0.12;
        const canShowTopLabel = showBarLabel(i, bars.length) && bar.value > 0 && barH >= 14 && isSignificant;
        const topLabel = formatValue ? formatValue(bar.value) : String(Math.round(bar.value));

        return (
          <g key={`bar-${bar.label}-${i}`}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={2} fill={color} opacity={0.85} />
            {canShowTopLabel ? (
              <text
                x={x + barWidth / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize={8}
                fill="hsl(var(--muted-foreground))"
                fontWeight={500}
              >
                {topLabel}
              </text>
            ) : null}
            {bar.showTick !== false && (
              <text
                x={x + barWidth / 2}
                y={height - 4}
                textAnchor="end"
                fontSize={9}
                fill="hsl(var(--muted-foreground))"
                fontWeight={500}
                transform={`rotate(-90, ${x + barWidth / 2}, ${height - 4})`}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
