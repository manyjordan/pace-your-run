import { useEffect, useMemo, useRef } from "react";
import L, { type DivIcon, type LatLngExpression, type Map as LeafletMap, type Marker, type Polyline } from "leaflet";
import "leaflet/dist/leaflet.css";

type GPSTrace = {
  lat: number;
  lng: number;
  time: number;
};

export type GPSMapProps = {
  trace: Array<{ lat: number; lng: number; time: number }>;
  isLive?: boolean;
  height?: number;
  showFullTrace?: boolean;
};

const LIME = "#84cc16";

function createLiveMarkerIcon(): DivIcon {
  return L.divIcon({
    className: "pace-live-marker-wrapper",
    html: `
      <div class="pace-live-marker">
        <span class="pace-live-marker__pulse"></span>
        <span class="pace-live-marker__dot"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createSummaryMarkerIcon(color: string): DivIcon {
  return L.divIcon({
    className: "pace-static-marker-wrapper",
    html: `<span class="pace-static-marker" style="background:${color};"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function GPSMap({
  trace,
  isLive = false,
  height = 220,
  showFullTrace = true,
}: GPSMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const polylineRef = useRef<Polyline | null>(null);
  const currentMarkerRef = useRef<Marker | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const previousTraceLengthRef = useRef(0);

  const displayedTrace = useMemo(
    () => (showFullTrace ? trace : trace.slice(-1)),
    [showFullTrace, trace],
  );

  useEffect(() => {
    if (!containerRef.current || displayedTrace.length === 0 || mapRef.current) return;

    const initialPoint = displayedTrace[displayedTrace.length - 1];
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: true,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const latLngs: LatLngExpression[] = displayedTrace.map((point) => [point.lat, point.lng]);

    polylineRef.current = L.polyline(latLngs, {
      color: LIME,
      weight: isLive ? 5 : 4,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    if (!isLive && displayedTrace.length > 0) {
      startMarkerRef.current = L.marker([displayedTrace[0].lat, displayedTrace[0].lng], {
        icon: createSummaryMarkerIcon(LIME),
        interactive: false,
      }).addTo(map);
    }

    currentMarkerRef.current = L.marker([initialPoint.lat, initialPoint.lng], {
      icon: isLive ? createLiveMarkerIcon() : createSummaryMarkerIcon("#65a30d"),
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map);

    if (isLive) {
      map.setView([initialPoint.lat, initialPoint.lng], 16, { animate: false });
    } else if (displayedTrace.length > 1) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [24, 24] });
    } else {
      map.setView([initialPoint.lat, initialPoint.lng], 16, { animate: false });
    }

    previousTraceLengthRef.current = displayedTrace.length;

    return () => {
      startMarkerRef.current = null;
      currentMarkerRef.current = null;
      polylineRef.current = null;
      previousTraceLengthRef.current = 0;
      map.remove();
      mapRef.current = null;
    };
  }, [displayedTrace, isLive]);

  useEffect(() => {
    const map = mapRef.current;
    const polyline = polylineRef.current;
    const currentMarker = currentMarkerRef.current;

    if (!map || !polyline || !currentMarker || displayedTrace.length === 0) return;

    const latestPoint = displayedTrace[displayedTrace.length - 1];
    const latestLatLng: LatLngExpression = [latestPoint.lat, latestPoint.lng];
    const latLngs: LatLngExpression[] = displayedTrace.map((point) => [point.lat, point.lng]);

    if (showFullTrace && displayedTrace.length > 1 && displayedTrace.length === previousTraceLengthRef.current + 1) {
      polyline.addLatLng(latestLatLng);
    } else {
      polyline.setLatLngs(latLngs);
    }

    currentMarker.setLatLng(latestLatLng);

    if (!isLive && startMarkerRef.current && displayedTrace.length > 0) {
      startMarkerRef.current.setLatLng([displayedTrace[0].lat, displayedTrace[0].lng]);
    }

    if (isLive) {
      map.panTo(latestLatLng, { animate: true, duration: 0.35 });
    } else if (displayedTrace.length > 1 && previousTraceLengthRef.current === 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [24, 24] });
    }

    previousTraceLengthRef.current = displayedTrace.length;
  }, [displayedTrace, isLive, showFullTrace]);

  if (!trace.length) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-accent/20 bg-card">
      <style>{`
        .pace-live-marker {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pace-live-marker__pulse {
          position: absolute;
          inset: 2px;
          border-radius: 9999px;
          background: rgba(132, 204, 22, 0.28);
          animation: pace-gps-pulse 1.8s ease-out infinite;
        }
        .pace-live-marker__dot {
          position: relative;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: ${LIME};
          border: 2px solid white;
          box-shadow: 0 0 0 2px rgba(132, 204, 22, 0.25);
        }
        .pace-static-marker {
          display: block;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          border: 2px solid white;
          box-shadow: 0 0 0 2px rgba(132, 204, 22, 0.25);
        }
        @keyframes pace-gps-pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.8);
            opacity: 0;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      `}</style>

      <div ref={containerRef} style={{ height }} className="w-full" />

      <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
        {isLive ? "Position en direct" : `${trace.length} points GPS`}
      </div>
    </div>
  );
}
