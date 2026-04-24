import { useEffect, useId, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { simplifyGpsTrace } from "@/lib/gpsSimplify";

type Point = { lat: number; lng: number };

interface GpsTraceSvgProps {
  trace: Point[];
  height?: number;
  className?: string;
}

export function GpsTraceSvg({ trace, height = 200, className }: GpsTraceSvgProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const [leafletFailed, setLeafletFailed] = useState(false);
  const gridPatternId = `gps-grid-${useId().replace(/:/g, "")}`;

  const displayTrace = useMemo(
    () => (trace.length > 200 ? simplifyGpsTrace(trace, 0.00003) : trace),
    [trace],
  );

  const svgPath = useMemo(() => {
    if (displayTrace.length < 2) return "";
    const pad = 16;
    const w = 400;
    const h = height;
    const lats = displayTrace.map((p) => p.lat);
    const lngs = displayTrace.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 1e-6);
    const lngSpan = Math.max(maxLng - minLng, 1e-6);
    return displayTrace
      .map((p) => {
        const x = pad + ((p.lng - minLng) / lngSpan) * (w - 2 * pad);
        const y = pad + (1 - (p.lat - minLat) / latSpan) * (h - 2 * pad);
        return `${x},${y}`;
      })
      .join(" ");
  }, [displayTrace, height]);

  useEffect(() => {
    void import("leaflet");
  }, []);

  useEffect(() => {
    if (leafletFailed) return;
    if (!mapContainerRef.current || !displayTrace || displayTrace.length < 2) return;
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    void import("leaflet")
      .then((L) => {
        try {
          if (!mapContainerRef.current) return;

          const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            attributionControl: false,
          });

          L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}{r}.png", {
            maxZoom: 19,
            subdomains: "abcd",
          }).addTo(map);

          const latLngs = displayTrace.map((p) => [p.lat, p.lng] as [number, number]);

          L.polyline(latLngs, {
            color: "#B4DC5A",
            weight: 6,
            opacity: 0.3,
            smoothFactor: 1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);

          L.polyline(latLngs, {
            color: "#B4DC5A",
            weight: 3,
            opacity: 1,
            smoothFactor: 1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);

          L.circleMarker(latLngs[0], {
            radius: 6,
            fillColor: "#B4DC5A",
            color: "#B4DC5A",
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
          }).addTo(map);

          L.circleMarker(latLngs[latLngs.length - 1], {
            radius: 6,
            fillColor: "#ffffff",
            color: "#B4DC5A",
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
          }).addTo(map);

          const bounds = L.latLngBounds(latLngs);
          map.fitBounds(bounds, { padding: [20, 20] });

          leafletMapRef.current = map;
        } catch {
          setLeafletFailed(true);
        }
      })
      .catch(() => {
        setLeafletFailed(true);
      });

    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [displayTrace, leafletFailed]);

  if (!displayTrace || displayTrace.length < 2) return null;

  if (leafletFailed && svgPath) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-slate-900 ${className ?? ""}`}
        style={{ height, width: "100%" }}
      >
        <svg viewBox={`0 0 400 ${height}`} width="100%" height={height} className="absolute inset-0">
          <defs>
            <pattern id={gridPatternId} width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.15" />
            </pattern>
          </defs>
          <rect width="400" height={height} fill={`url(#${gridPatternId})`} />
          <polyline
            points={svgPath}
            fill="none"
            stroke="#B4DC5A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={`overflow-hidden rounded-xl ${className ?? ""}`}
      style={{ height, width: "100%" }}
    />
  );
}
