import { useMemo, useState } from "react";

export interface LineData {
  label: string;
  value: number;
  rawValue?: number | null;
}

interface LineChartSvgProps {
  data: LineData[];
  height?: number;
  color?: string;
  showArea?: boolean;
  showDots?: boolean;
  formatValue?: (v: number) => string;
  /** When true, tap/click points to show tooltip (e.g. raw vs smoothed). */
  interactive?: boolean;
  formatTooltip?: (d: LineData) => string;
}

export function LineChartSvg({
  data,
  height = 120,
  color = "hsl(var(--accent))",
  showArea = true,
  showDots = false,
  formatValue,
  interactive = false,
  formatTooltip,
}: LineChartSvgProps) {
  const gradientId = useMemo(() => `grad-${Math.random().toString(36).slice(2)}`, []);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { points, areaPath, linePath, yLabels } = useMemo(() => {
    if (data.length < 2) return { points: [] as LineDataPoint[], areaPath: "", linePath: "", yLabels: [] as string[] };

    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const paddingLeft = 36;
    const paddingRight = 8;
    const paddingTop = 8;
    const paddingBottom = 24;
    const w = 400 - paddingLeft - paddingRight;
    const h = height - paddingTop - paddingBottom;

    const pts = data.map((d, i) => ({
      x: paddingLeft + (i / (data.length - 1)) * w,
      y: paddingTop + h - ((d.value - min) / range) * h,
      label: d.label,
      value: d.value,
      rawValue: d.rawValue,
    }));

    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1].x},${paddingTop + h} L${pts[0].x},${paddingTop + h} Z`;

    const ySteps = 3;
    const labels = Array.from({ length: ySteps + 1 }, (_, i) => {
      const v = min + (range * i) / ySteps;
      return formatValue ? formatValue(v) : String(Math.round(v));
    }).reverse();

    return { points: pts, areaPath: area, linePath: line, yLabels: labels };
  }, [data, height, formatValue]);

  if (points.length < 2) return null;

  const activePoint = activeIndex != null ? points[activeIndex] : null;
  const activeData = activeIndex != null ? data[activeIndex] : null;
  const tooltipText =
    activeData &&
    (formatTooltip
      ? formatTooltip(activeData)
      : formatValue
        ? `Valeur : ${formatValue(activeData.value)}`
        : `Valeur : ${activeData.value}`);

  const svg = (
    <svg viewBox={`0 0 400 ${height}`} width="100%" height={height}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {yLabels.map((label, i) => {
        const y = 8 + ((height - 32) * i) / yLabels.length;
        return (
          <text key={`ylabel-${label}-${i}`} x={32} y={y + 4} textAnchor="end" fontSize={9} fill="hsl(var(--muted-foreground))">
            {label}
          </text>
        );
      })}

      {showArea && <path d={areaPath} fill={`url(#${gradientId})`} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {showDots &&
        points.map((point, i) => <circle key={`dot-${i}`} cx={point.x} cy={point.y} r={3} fill={color} />)}

      {interactive &&
        points.map((point, i) => (
          <circle
            key={`hit-${i}`}
            cx={point.x}
            cy={point.y}
            r={14}
            fill="transparent"
            className="cursor-pointer touch-manipulation"
            onPointerDown={() => setActiveIndex(i)}
          />
        ))}

      {activePoint != null && (
        <circle cx={activePoint.x} cy={activePoint.y} r={5} fill={color} stroke="hsl(var(--background))" strokeWidth={2} />
      )}

      <text x={points[0].x} y={height - 4} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))">
        {points[0].label}
      </text>
      <text
        x={points[points.length - 1].x}
        y={height - 4}
        textAnchor="middle"
        fontSize={9}
        fill="hsl(var(--muted-foreground))"
      >
        {points[points.length - 1].label}
      </text>
    </svg>
  );

  if (!interactive) return svg;

  const leftPct = activePoint ? Math.min(88, Math.max(8, (activePoint.x / 400) * 100)) : 0;

  return (
    <div
      className="relative w-full"
      onPointerLeave={() => setActiveIndex(null)}
      onPointerCancel={() => setActiveIndex(null)}
    >
      {svg}
      {activePoint != null && tooltipText ? (
        <div
          className="pointer-events-none absolute z-10 max-w-[min(280px,92vw)] -translate-x-1/2 rounded-lg border border-border bg-card px-2.5 py-2 text-center text-[11px] leading-snug text-foreground shadow-md"
          style={{ left: `${leftPct}%`, top: 4 }}
        >
          {tooltipText}
        </div>
      ) : null}
    </div>
  );
}

interface LineDataPoint {
  x: number;
  y: number;
  label: string;
  value: number;
  rawValue?: number | null;
}
