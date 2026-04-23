import { useMemo } from "react";

type Point = { lat: number; lng: number };

interface RouteTraceSvgProps {
  trace: Point[];
  height?: number;
  className?: string;
  showEndpoints?: boolean;
}

export function RouteTraceSvg({ trace, height = 160, className, showEndpoints = true }: RouteTraceSvgProps) {
  const { pathPoints, startX, startY, endX, endY } = useMemo(() => {
    if (!trace || trace.length < 2) {
      return { pathPoints: "", startX: 0, startY: 0, endX: 0, endY: 0 };
    }

    const lats = trace.map((point) => point.lat);
    const lngs = trace.map((point) => point.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;
    const padding = 20;
    const w = 400 - padding * 2;
    const h = height - padding * 2;

    const points = trace.map((point) => ({
      x: padding + ((point.lng - minLng) / lngRange) * w,
      y: padding + ((maxLat - point.lat) / latRange) * h,
    }));

    const path = points.map((point, i) => `${i === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

    return {
      pathPoints: path,
      startX: points[0].x,
      startY: points[0].y,
      endX: points[points.length - 1].x,
      endY: points[points.length - 1].y,
    };
  }, [trace, height]);

  if (!pathPoints) return null;

  return (
    <svg viewBox={`0 0 400 ${height}`} width="100%" height={height} className={className}>
      <path
        d={pathPoints}
        fill="none"
        stroke="#B4DC5A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      {showEndpoints ? (
        <>
          <circle cx={startX} cy={startY} r={5} fill="#B4DC5A" />
          <circle cx={endX} cy={endY} r={5} fill="white" stroke="#B4DC5A" strokeWidth={2} />
        </>
      ) : null}
    </svg>
  );
}
