import { useEffect, useMemo, useRef } from "react";
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

  const displayTrace = useMemo(
    () => (trace.length > 200 ? simplifyGpsTrace(trace, 0.00003) : trace),
    [trace],
  );

  useEffect(() => {
    if (!mapContainerRef.current || !displayTrace || displayTrace.length < 2) return;
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    void import("leaflet").then((L) => {
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
    });

    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [displayTrace]);

  if (!displayTrace || displayTrace.length < 2) return null;

  return (
    <div
      ref={mapContainerRef}
      className={`overflow-hidden rounded-xl ${className ?? ""}`}
      style={{ height, width: "100%" }}
    />
  );
}
