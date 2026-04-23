import { useMemo } from "react";

interface LineData {
  label: string;
  value: number;
}

interface LineChartSvgProps {
  data: LineData[];
  height?: number;
  color?: string;
  showArea?: boolean;
  showDots?: boolean;
  formatValue?: (v: number) => string;
}

export function LineChartSvg({
  data,
  height = 120,
  color = "hsl(var(--accent))",
  showArea = true,
  showDots = false,
  formatValue,
}: LineChartSvgProps) {
  const gradientId = useMemo(() => `grad-${Math.random().toString(36).slice(2)}`, []);

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

  return (
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
}

interface LineDataPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}
