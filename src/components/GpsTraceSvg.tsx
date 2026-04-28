import { useId, useMemo } from "react";
import { simplifyGpsTrace } from "@/lib/gpsSimplify";

type Point = { lat: number; lng: number };

interface GpsTraceSvgProps {
  trace: Point[];
  height?: number;
  className?: string;
}

export function GpsTraceSvg({ trace, height = 200, className }: GpsTraceSvgProps) {
  const id = useId().replace(/:/g, "");

  const displayTrace = useMemo(
    () => (trace.length > 200 ? simplifyGpsTrace(trace, 0.00003) : trace),
    [trace],
  );

  const { pathPoints, startX, startY, endX, endY } = useMemo(() => {
    if (displayTrace.length < 2) {
      return { pathPoints: "", startX: 0, startY: 0, endX: 0, endY: 0 };
    }

    const lats = displayTrace.map((p) => p.lat);
    const lngs = displayTrace.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 1e-6);
    const lngSpan = Math.max(maxLng - minLng, 1e-6);
    const pad = 24;
    const w = 400;
    const h = height;

    const pts = displayTrace.map((p) => ({
      x: pad + ((p.lng - minLng) / lngSpan) * (w - 2 * pad),
      y: pad + (1 - (p.lat - minLat) / latSpan) * (h - 2 * pad),
    }));

    const pathPoints = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    return {
      pathPoints,
      startX: pts[0].x,
      startY: pts[0].y,
      endX: pts[pts.length - 1].x,
      endY: pts[pts.length - 1].y,
    };
  }, [displayTrace, height]);

  if (!pathPoints) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className ?? ""}`}
      style={{
        height,
        width: "100%",
        background: "linear-gradient(135deg, #0f1923 0%, #1a2d1a 50%, #0f1923 100%)",
      }}
    >
      <svg viewBox={`0 0 400 ${height}`} width="100%" height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id={`grid-${id}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`traceGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1DB954" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#B4DC5A" stopOpacity="1" />
          </linearGradient>
        </defs>

        <rect width="400" height={height} fill={`url(#grid-${id})`} />

        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={(height * (i + 1)) / 7}
            x2="400"
            y2={(height * (i + 1)) / 7}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1.5"
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={(400 * (i + 1)) / 9}
            y1="0"
            x2={(400 * (i + 1)) / 9}
            y2={height}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1.5"
          />
        ))}

        <path
          d={pathPoints}
          fill="none"
          stroke="#1DB954"
          strokeWidth="8"
          strokeOpacity="0.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${id})`}
        />

        <path
          d={pathPoints}
          fill="none"
          stroke={`url(#traceGrad-${id})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx={startX} cy={startY} r="5" fill="#1DB954" opacity="0.9" />
        <circle cx={startX} cy={startY} r="9" fill="none" stroke="#1DB954" strokeWidth="1.5" opacity="0.4" />

        <circle cx={endX} cy={endY} r="5" fill="white" stroke="#1DB954" strokeWidth="2" />
      </svg>
    </div>
  );
}
