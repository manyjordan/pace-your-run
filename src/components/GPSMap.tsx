type GPSTrace = {
  lat: number;
  lng: number;
  time: number;
};

// Générer une "vue satellite" stylisée avec bruit Perlin-like
function generateSatelliteTexture(width: number, height: number, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Fond vert/bleu satellite
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    
    // Bruit perlin-like
    const noise = Math.sin((x + seed) * 0.05) * Math.sin((y + seed) * 0.05) * 0.5 + 0.5;
    const streetNoise = Math.sin((x + y + seed) * 0.08) * 0.3 + 0.3;
    
    // Couleur satellite : vert/bleu/gris
    if (noise > 0.6) {
      // Zones vertes (parcs, herbe)
      data[i] = 80 + noise * 30;      // R
      data[i + 1] = 140 + noise * 40; // G
      data[i + 2] = 60 + noise * 20;  // B
    } else if (noise > 0.3) {
      // Routes/bâtiments gris
      const gray = 120 + streetNoise * 60;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray + 10;
    } else {
      // Eau/fond bleu
      data[i] = 100 + noise * 20;
      data[i + 1] = 150 + noise * 30;
      data[i + 2] = 200 + noise * 40;
    }
    data[i + 3] = 255; // Alpha
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

export default function GPSMap({ trace }: { trace: GPSTrace[] }) {
  if (!trace || trace.length === 0) return null;

  // Calculer bounds
  const lats = trace.map(p => p.lat);
  const lngs = trace.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Scaling
  const width = 400;
  const height = 280;
  const padding = 20;
  const rangeY = maxLat - minLat || 0.01;
  const rangeX = maxLng - minLng || 0.01;
  const scale = Math.min(
    (width - padding * 2) / rangeX,
    (height - padding * 2) / rangeY
  );

  const toX = (lng: number) => padding + (lng - minLng) * scale;
  const toY = (lat: number) => height - padding - (lat - minLat) * scale;

  const satelliteUrl = generateSatelliteTexture(width, height, Math.floor(trace[0].lat * 1000));

  return (
    <div className="rounded-lg overflow-hidden w-full bg-gray-300 relative">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-auto"
      >
        <defs>
          <image id="satellite" href={satelliteUrl} x="0" y="0" width={width} height={height} />
        </defs>

        {/* Satellite background */}
        <rect width={width} height={height} fill="url(#satellite)" />

        {/* Trace line - orange/red comme Google Maps */}
        {trace.length > 1 && (
          <>
            <polyline
              points={trace.map(p => `${toX(p.lng)},${toY(p.lat)}`).join(" ")}
              fill="none"
              stroke="rgb(255, 87, 34)"
              strokeWidth="4"
              opacity="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Contour blanc pour meilleure visibilité */}
            <polyline
              points={trace.map(p => `${toX(p.lng)},${toY(p.lat)}`).join(" ")}
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              opacity="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Start point - vert */}
        <circle cx={toX(trace[0].lng)} cy={toY(trace[0].lat)} r="5" fill="rgb(34, 197, 94)" stroke="white" strokeWidth="2" />

        {/* End point - rouge */}
        <circle cx={toX(trace[trace.length - 1].lng)} cy={toY(trace[trace.length - 1].lat)} r="5" fill="rgb(239, 68, 68)" stroke="white" strokeWidth="2" />
      </svg>

      {/* Info overlay */}
      <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 text-[10px] text-white">
        <p>📍 {trace.length} points GPS</p>
      </div>
    </div>
  );
}
