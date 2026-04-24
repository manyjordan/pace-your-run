import { useEffect, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { simplifyGpsTrace } from "@/lib/gpsSimplify";

type Point = { lat: number; lng: number };

interface GpsTraceSvgProps {
  trace: Point[];
  width?: number;
  height?: number;
  className?: string;
}

export function GpsTraceSvg({ trace, width = 400, height = 200, className }: GpsTraceSvgProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
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

  useEffect(() => {
    if (!mapContainerRef.current || !displayTrace || displayTrace.length < 2) return;
    if (leafletMapRef.current) return;

    const lats = displayTrace.map((p) => p.lat);
    const lngs = displayTrace.map((p) => p.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    void import("leaflet").then((L) => {
      if (!mapContainerRef.current || leafletMapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds(displayTrace.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [24, 24] });

      leafletMapRef.current = map;
    });

    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [displayTrace]);

  if (!path) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl ${className ?? ""}`} style={{ height }}>
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        className="absolute inset-0 pointer-events-none"
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
