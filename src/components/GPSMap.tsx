import { MapPin } from "lucide-react";

type GPSTrace = {
  lat: number;
  lng: number;
  time: number;
};

export default function GPSMap({ trace }: { trace: GPSTrace[] }) {
  if (!trace || trace.length === 0) return null;

  // Calculer bounds
  const lats = trace.map(p => p.lat);
  const lngs = trace.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  // Scaling (simple Mercator projection simulation)
  const width = 300;
  const height = 200;
  const padding = 20;
  const rangeY = maxLat - minLat || 0.01;
  const rangeX = maxLng - minLng || 0.01;
  const scale = Math.min(
    (width - padding * 2) / rangeX,
    (height - padding * 2) / rangeY
  );

  const toX = (lng: number) => padding + (lng - minLng) * scale;
  const toY = (lat: number) => height - padding - (lat - minLat) * scale;

  return (
    <div className="rounded-lg overflow-hidden bg-slate-900 relative">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        className="bg-gradient-to-br from-slate-900 to-slate-950"
      >
        {/* Grid */}
        <defs>
          <pattern id="grid-map" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid-map)" />

        {/* Trace line */}
        {trace.length > 1 && (
          <polyline
            points={trace.map(p => `${toX(p.lng)},${toY(p.lat)}`).join(" ")}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            opacity="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Start point (green) */}
        <circle cx={toX(trace[0].lng)} cy={toY(trace[0].lat)} r="3" fill="rgb(34, 197, 94)" stroke="white" strokeWidth="1" />
        <circle cx={toX(trace[0].lng)} cy={toY(trace[0].lat)} r="5" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="1" opacity="0.5" />

        {/* End point (red) */}
        <circle cx={toX(trace[trace.length - 1].lng)} cy={toY(trace[trace.length - 1].lat)} r="3" fill="rgb(239, 68, 68)" stroke="white" strokeWidth="1" />
        <circle cx={toX(trace[trace.length - 1].lng)} cy={toY(trace[trace.length - 1].lat)} r="5" fill="none" stroke="rgb(239, 68, 68)" strokeWidth="1" opacity="0.5" />

        {/* Points d'étape tous les 25% */}
        {[0.25, 0.5, 0.75].map((pct, idx) => {
          const index = Math.floor(trace.length * pct);
          if (index > 0 && index < trace.length - 1) {
            return (
              <circle
                key={idx}
                cx={toX(trace[index].lng)}
                cy={toY(trace[index].lat)}
                r="2"
                fill="rgb(168, 85, 247)"
                opacity="0.8"
              />
            );
          }
          return null;
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded p-2 text-[10px] text-white space-y-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span>Départ</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <span>Arrivée</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-4 bg-blue-400"></div>
          <span>{trace.length} points GPS</span>
        </div>
      </div>
    </div>
  );
}
