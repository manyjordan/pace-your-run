import { useCallback, useMemo, useState, type MouseEvent, type TouchEvent } from "react";

interface BarData {
  label: string;
  value: number;
  showTick?: boolean;
}

interface BarChartSvgProps {
  data: BarData[];
  height?: number;
  color?: string;
  highlightLast?: boolean;
  unit?: string;
  formatValue?: (v: number) => string;
  formatLabel?: (l: string) => string;
}

export function BarChartSvg({
  data,
  height = 120,
  color = "#E5E7EB",
  highlightLast = false,
  formatValue,
  formatLabel,
}: BarChartSvgProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
  const getClosestBarIndex = useCallback(
    (scaledX: number) => {
      let closest = -1;
      let closestDist = Infinity;
      bars.forEach((_, i) => {
        const x = paddingLeft + gap + i * (barWidth + gap) + barWidth / 2;
        const dist = Math.abs(scaledX - x);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      if (closest >= 0) setActiveIndex(closest);
    },
    [barWidth, bars, gap],
  );

  const handleTouch = useCallback(
    (e: TouchEvent<SVGSVGElement>) => {
      const svgRect = e.currentTarget.getBoundingClientRect();
      const touchX = e.touches[0].clientX - svgRect.left;
      const scaledX = (touchX / svgRect.width) * chartWidth;
      getClosestBarIndex(scaledX);
    },
    [getClosestBarIndex],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      const svgRect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const scaledX = (mouseX / svgRect.width) * chartWidth;
      getClosestBarIndex(scaledX);
    },
    [getClosestBarIndex],
  );

  const handleTouchEnd = useCallback(() => setActiveIndex(null), []);

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${height}`}
      width="100%"
      height={height}
      className="overflow-visible"
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveIndex(null)}
    >
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
        const isLastHighlighted = highlightLast && i === bars.length - 1;
        const label = formatLabel ? formatLabel(bar.label) : bar.label;
        const isSignificant = bar.value >= maxValue * 0.12;
        const canShowTopLabel = showBarLabel(i, bars.length) && bar.value > 0 && barH >= 14 && isSignificant;
        const topLabel = formatValue ? formatValue(bar.value) : String(Math.round(bar.value));

        return (
          <g key={`bar-${bar.label}-${i}`}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={2}
              fill={isLastHighlighted ? "hsl(var(--accent))" : color}
              opacity={isLastHighlighted ? 1 : 0.95}
            />
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

      {activeIndex !== null && bars[activeIndex] ? (
        <g>
          <rect
            x={paddingLeft + gap + activeIndex * (barWidth + gap)}
            y={
              paddingTop +
              chartHeight -
              Math.max(2, (bars[activeIndex].value / maxValue) * chartHeight)
            }
            width={barWidth}
            height={Math.max(2, (bars[activeIndex].value / maxValue) * chartHeight)}
            rx={2}
            fill={color}
            opacity={1}
          />
          <rect
            x={Math.min(Math.max(paddingLeft + gap + activeIndex * (barWidth + gap) - 20, paddingLeft), 350)}
            y={
              paddingTop +
              chartHeight -
              Math.max(2, (bars[activeIndex].value / maxValue) * chartHeight) -
              28
            }
            width={50}
            height={20}
            rx={4}
            fill="hsl(var(--accent))"
            opacity={0.9}
          />
          <text
            x={Math.min(Math.max(paddingLeft + gap + activeIndex * (barWidth + gap) + barWidth / 2, 25), 375)}
            y={
              paddingTop +
              chartHeight -
              Math.max(2, (bars[activeIndex].value / maxValue) * chartHeight) -
              14
            }
            textAnchor="middle"
            fontSize={9}
            fill="hsl(var(--background))"
            fontWeight={600}
          >
            {formatValue ? formatValue(bars[activeIndex].value) : bars[activeIndex].value}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
