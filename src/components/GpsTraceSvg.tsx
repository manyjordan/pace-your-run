import { useMemo } from "react";
import { simplifyGpsTrace } from "@/lib/gpsSimplify";

type Point = { lat: number; lng: number };

interface GpsTraceSvgProps {
  trace: Point[];
  width?: number;
  height?: number;
  className?: string;
}

export function GpsTraceSvg({ trace, width = 400, height = 200, className }: GpsTraceSvgProps) {
  const displayTrace = useMemo(
    () => (trace.length > 200 ? simplifyGpsTrace(trace, 0.00003) : trace),
    [trace],
  );

  const { path, startX, startY, endX, endY } = useMemo(() => {
    if (!displayTrace || displayTrace.length < 2) {
      return { path: null, startX: 0, startY: 0, endX: 0, endY: 0 };
    }

    const lats = displayTrace.map((p) => p.lat);
    const lngs = displayTrace.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    const padding = 16;
    const w = width - padding * 2;
    const h = height - padding * 2;

    const points = displayTrace.map((p) => {
      const x = padding + ((p.lng - minLng) / lngRange) * w;
      const y = padding + ((maxLat - p.lat) / latRange) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathStr = points.join(" ");
    const pointPairs = points.map((p) => p.split(",").map(Number));
    const start = pointPairs[0];
    const end = pointPairs[pointPairs.length - 1];

    return {
      path: pathStr,
      startX: start[0],
      startY: start[1],
      endX: end[0],
      endY: end[1],
    };
  }, [displayTrace, width, height]);

  if (!path) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-muted/80 ${className ?? ""}`} style={{ height }}>
      <svg className="absolute inset-0 opacity-10" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        className="absolute inset-0"
        style={{ background: "transparent" }}
      >
        <polyline
          points={path}
          fill="none"
          stroke="#B4DC5A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={1}
        />
        <circle cx={startX} cy={startY} r="5" fill="#B4DC5A" opacity={0.9} />
        <circle cx={endX} cy={endY} r="5" fill="white" stroke="#B4DC5A" strokeWidth="2" />
      </svg>
    </div>
  );
}
