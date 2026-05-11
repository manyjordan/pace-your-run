import { useMemo, useState, useId } from "react";
import { simplifyGpsTrace } from "@/lib/gpsSimplify";

type Point = { lat: number; lng: number };

interface GpsTraceSvgProps {
  trace: Point[];
  height?: number;
  className?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

function buildMapboxUrl(trace: Point[], width: number, height: number): string | null {
  if (!MAPBOX_TOKEN || trace.length < 2) return null;

  const lats = trace.map((p) => p.lat);
  const lngs = trace.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latPad = (maxLat - minLat) * 0.15;
  const lngPad = (maxLng - minLng) * 0.15;

  const bbox = [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad].map((v) => v.toFixed(6)).join(",");

  const style = "mapbox/streets-v12";
  const retina = window.devicePixelRatio >= 2 ? "@2x" : "";

  return `https://api.mapbox.com/styles/v1/${style}/static/[${bbox}]/${width}x${height}${retina}?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`;
}

export function GpsTraceSvg({ trace, height = 200, className }: GpsTraceSvgProps) {
  const id = useId().replace(/:/g, "");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const displayTrace = useMemo(
    () => (trace.length > 200 ? simplifyGpsTrace(trace, 0.00003) : trace),
    [trace],
  );

  const mapUrl = useMemo(() => {
    const url = buildMapboxUrl(displayTrace, 400, height);
    return url;
  }, [displayTrace, height]);

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
    const W = 400;
    const H = height;

    const pts = displayTrace.map((p) => ({
      x: pad + ((p.lng - minLng) / lngSpan) * (W - 2 * pad),
      y: pad + (1 - (p.lat - minLat) / latSpan) * (H - 2 * pad),
    }));

    return {
      pathPoints: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
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
        background: mapError || !mapUrl ? "linear-gradient(135deg, #0f1923 0%, #1a2d1a 50%, #0f1923 100%)" : "#e8e8e8",
      }}
    >
      {mapUrl && !mapError && (
        <img
          src={mapUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${mapLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setMapLoaded(true)}
          onError={() => setMapError(true)}
          loading="lazy"
        />
      )}

      <svg
        viewBox={`0 0 400 ${height}`}
        width="100%"
        height={height}
        className="absolute inset-0"
        style={{ background: "transparent" }}
      >
        <defs>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={pathPoints}
          fill="none"
          stroke="#1DB954"
          strokeWidth="6"
          strokeOpacity="0.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${id})`}
        />

        <path
          d={pathPoints}
          fill="none"
          stroke="#1DB954"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx={startX} cy={startY} r="5" fill="#1DB954" />
        <circle cx={startX} cy={startY} r="9" fill="none" stroke="#1DB954" strokeWidth="1.5" opacity="0.4" />

        <circle cx={endX} cy={endY} r="5" fill="white" stroke="#1DB954" strokeWidth="2" />
      </svg>
    </div>
  );
}
