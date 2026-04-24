import { useMemo } from "react";
import { simplifyGpsTrace } from "@/lib/gpsSimplify";

type Point = { lat: number; lng: number };

interface GpsTraceSvgProps {
  trace: Point[];
  width?: number;
  height?: number;
  className?: string;
}

function latLngToTile(lat: number, lng: number, zoom: number) {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
  return { x, y };
}

export function GpsTraceSvg({ trace, width = 400, height = 200, className }: GpsTraceSvgProps) {
  const displayTrace = useMemo(
    () => (trace.length > 200 ? simplifyGpsTrace(trace, 0.00003) : trace),
    [trace],
  );

  const { path, startX, startY, endX, endY, mapUrl } = useMemo(() => {
    if (!displayTrace || displayTrace.length < 2) {
      return { path: null, startX: 0, startY: 0, endX: 0, endY: 0, mapUrl: null };
    }

    const lats = displayTrace.map((p) => p.lat);
    const lngs = displayTrace.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 14;
    if (maxDiff > 0.1) zoom = 12;
    else if (maxDiff > 0.05) zoom = 13;
    else if (maxDiff < 0.01) zoom = 15;

    // Keeps tile math helper useful if static map provider changes.
    latLngToTile(centerLat, centerLng, zoom);
    const mapWidth = Math.max(200, Math.round(width));
    const mapHeight = Math.max(120, Math.round(height));
    const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=${mapWidth}x${mapHeight}&maptype=osm`;

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
      mapUrl: staticMapUrl,
    };
  }, [displayTrace, width, height]);

  if (!path) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl ${className ?? ""}`} style={{ height }}>
      {mapUrl ? (
        <img
          src={mapUrl}
          alt="carte"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-background/40" />
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
