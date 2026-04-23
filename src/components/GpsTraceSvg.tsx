import { useMemo } from "react";

type Point = { lat: number; lng: number };

interface GpsTraceSvgProps {
  trace: Point[];
  width?: number;
  height?: number;
  className?: string;
}

export function GpsTraceSvg({ trace, width = 400, height = 200, className }: GpsTraceSvgProps) {
  const path = useMemo(() => {
    if (!trace || trace.length < 2) return null;

    const lats = trace.map((p) => p.lat);
    const lngs = trace.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    const padding = 16;
    const w = width - padding * 2;
    const h = height - padding * 2;

    const points = trace.map((p) => {
      const x = padding + ((p.lng - minLng) / lngRange) * w;
      const y = padding + ((maxLat - p.lat) / latRange) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return points.join(" ");
  }, [trace, width, height]);

  if (!path) return null;

  const points = path.split(" ");
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const [startX, startY] = startPoint.split(",").map(Number);
  const [endX, endY] = endPoint.split(",").map(Number);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className={className}
      style={{ background: "transparent" }}
    >
      <polyline
        points={path}
        fill="none"
        stroke="#B4DC5A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <circle cx={startX} cy={startY} r="5" fill="#B4DC5A" opacity={0.9} />
      <circle cx={endX} cy={endY} r="5" fill="white" stroke="#B4DC5A" strokeWidth="2" />
    </svg>
  );
}
