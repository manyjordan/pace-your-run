import { useEffect, useMemo, useRef } from "react";
import L, {
  type DivIcon,
  type LatLngExpression,
  type Map as LeafletMap,
  type Marker,
  type Polyline,
  type TileLayer,
} from "leaflet";
import "leaflet/dist/leaflet.css";

export type RouteMapProps = {
  referenceTrace: Array<{ lat: number; lng: number; time: number }>;
  liveTrace?: Array<{ lat: number; lng: number; time: number }>;
  isLive?: boolean;
  height?: number;
  progressKm?: number;
  totalKm?: number;
};

const LIME = "#B4DC5A";
const GREY = "#94a3b8";

function cartoTileUrl(isDark: boolean): string {
  return isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
}

function cartoAttributionHtml(isDark: boolean): string {
  return isDark
    ? '© <a href="https://carto.com/">CARTO</a>'
    : '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>';
}

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

export default function RouteMap({
  referenceTrace,
  liveTrace = [],
  isLive = true,
  height = 220,
  progressKm = 0,
  totalKm = 0,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const attributionControlRef = useRef<ReturnType<typeof L.control.attribution> | null>(null);
  const lastAttributionHtmlRef = useRef<string>("");
  const prevThemeIsDarkRef = useRef<boolean>(false);
  const referencePolylineRef = useRef<Polyline | null>(null);
  const livePolylineRef = useRef<Polyline | null>(null);
  const currentMarkerRef = useRef<Marker | null>(null);
  const previousLiveLengthRef = useRef(0);

  const hasReference = referenceTrace.length > 0;
  const hasLive = liveTrace.length > 0;

  const referenceLatLngs = useMemo<LatLngExpression[]>(
    () => referenceTrace.map((point) => [point.lat, point.lng]),
    [referenceTrace],
  );
  const liveLatLngs = useMemo<LatLngExpression[]>(
    () => liveTrace.map((point) => [point.lat, point.lng]),
    [liveTrace],
  );

  useEffect(() => {
    if (!containerRef.current || !hasReference || mapRef.current) return;

    const initialPoint = referenceTrace[0];
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: true,
    });

    mapRef.current = map;

    const isDark = document.documentElement.classList.contains("dark");
    prevThemeIsDarkRef.current = isDark;

    const tileLayer = L.tileLayer(cartoTileUrl(isDark), {
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const attrHtml = cartoAttributionHtml(isDark);
    lastAttributionHtmlRef.current = attrHtml;
    const attributionCtrl = L.control.attribution({
      position: "bottomright",
      prefix: false,
    });
    attributionCtrl.addTo(map);
    attributionCtrl.addAttribution(attrHtml);
    attributionControlRef.current = attributionCtrl;

    const observer = new MutationObserver(() => {
      if (!mapRef.current || !tileLayerRef.current || !attributionControlRef.current) return;
      const nowDark = document.documentElement.classList.contains("dark");
      if (nowDark === prevThemeIsDarkRef.current) return;
      prevThemeIsDarkRef.current = nowDark;
      tileLayerRef.current.setUrl(cartoTileUrl(nowDark));
      const ctrl = attributionControlRef.current;
      ctrl.removeAttribution(lastAttributionHtmlRef.current);
      const nextHtml = cartoAttributionHtml(nowDark);
      ctrl.addAttribution(nextHtml);
      lastAttributionHtmlRef.current = nextHtml;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    referencePolylineRef.current = L.polyline(referenceLatLngs, {
      color: GREY,
      weight: 4,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
      dashArray: "8 8",
    }).addTo(map);

    livePolylineRef.current = L.polyline(liveLatLngs, {
      color: LIME,
      weight: isLive ? 5 : 4,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    const markerSource = liveTrace.length > 0 ? liveTrace[liveTrace.length - 1] : referenceTrace[0];
    currentMarkerRef.current = L.marker([markerSource.lat, markerSource.lng], {
      icon: createLiveMarkerIcon(),
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map);

    if (referenceLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(referenceLatLngs), { padding: [24, 24] });
    } else {
      map.setView([initialPoint.lat, initialPoint.lng], 16, { animate: false });
    }

    previousLiveLengthRef.current = liveTrace.length;

    return () => {
      observer.disconnect();
      referencePolylineRef.current = null;
      livePolylineRef.current = null;
      currentMarkerRef.current = null;
      previousLiveLengthRef.current = 0;
      tileLayerRef.current = null;
      attributionControlRef.current = null;
      lastAttributionHtmlRef.current = "";
      map.remove();
      mapRef.current = null;
    };
  }, [hasReference, isLive, liveLatLngs, liveTrace, referenceLatLngs, referenceTrace]);

  useEffect(() => {
    const map = mapRef.current;
    const referencePolyline = referencePolylineRef.current;
    const livePolyline = livePolylineRef.current;
    const marker = currentMarkerRef.current;
    if (!map || !referencePolyline || !livePolyline || !marker || !hasReference) return;

    referencePolyline.setLatLngs(referenceLatLngs);

    if (hasLive && liveTrace.length === previousLiveLengthRef.current + 1) {
      const latest = liveTrace[liveTrace.length - 1];
      livePolyline.addLatLng([latest.lat, latest.lng]);
      marker.setLatLng([latest.lat, latest.lng]);
      map.panTo([latest.lat, latest.lng], { animate: true, duration: 0.35 });
    } else {
      livePolyline.setLatLngs(liveLatLngs);
      const markerPoint = hasLive ? liveTrace[liveTrace.length - 1] : referenceTrace[0];
      marker.setLatLng([markerPoint.lat, markerPoint.lng]);
    }

    previousLiveLengthRef.current = liveTrace.length;
  }, [hasLive, hasReference, liveLatLngs, liveTrace, referenceLatLngs, referenceTrace]);

  if (!hasReference) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-card">
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
          background: rgba(180, 220, 90, 0.28);
          animation: pace-gps-pulse 1.8s ease-out infinite;
        }
        .pace-live-marker__dot {
          position: relative;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: ${LIME};
          border: 2px solid white;
          box-shadow: 0 0 0 2px rgba(180, 220, 90, 0.25);
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

      <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
        {`${progressKm.toFixed(1)} / ${totalKm.toFixed(1)} km`}
      </div>
    </div>
  );
}
