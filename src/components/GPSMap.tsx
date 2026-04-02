type GPSTrace = {
  lat: number;
  lng: number;
  time: number;
};

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function perlin2D(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const u = smoothstep(xf);
  const v = smoothstep(yf);

  const n00 = Math.sin((xi + seed) * 12.9898 + (yi + seed) * 78.233) * 0.5 + 0.5;
  const n10 = Math.sin((xi + 1 + seed) * 12.9898 + (yi + seed) * 78.233) * 0.5 + 0.5;
  const n01 = Math.sin((xi + seed) * 12.9898 + (yi + 1 + seed) * 78.233) * 0.5 + 0.5;
  const n11 = Math.sin((xi + 1 + seed) * 12.9898 + (yi + 1 + seed) * 78.233) * 0.5 + 0.5;

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
}

function generateSatelliteTexture(width: number, height: number, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);

    const noise1 = perlin2D(x * 0.04, y * 0.04, seed);
    const noise2 = perlin2D(x * 0.08, y * 0.08, seed + 1) * 0.5;
    const noise3 = perlin2D(x * 0.15, y * 0.15, seed + 2) * 0.25;
    const noise = noise1 + noise2 + noise3;

    const roadPattern = Math.abs(Math.sin((x + y + seed) * 0.06)) * Math.abs(Math.cos((x - y + seed) * 0.08));
    const buildingPattern = Math.abs(Math.sin((x * 0.12 + seed) * 0.5)) * Math.abs(Math.sin((y * 0.12 + seed) * 0.5));

    let r = 0, g = 0, b = 0;

    if (noise > 0.65) {
      // Zones vertes denses (parcs, forêts)
      r = 45 + noise * 35;
      g = 110 + noise * 50;
      b = 40 + noise * 25;
    } else if (noise > 0.5) {
      // Zones résidentielles/urbaines claires
      const blend = (noise - 0.5) / 0.15;
      const buildR = 160 + buildingPattern * 40;
      const buildG = 150 + buildingPattern * 35;
      const buildB = 140 + buildingPattern * 30;

      r = buildR * blend + (100 + noise * 40) * (1 - blend);
      g = buildG * blend + (120 + noise * 40) * (1 - blend);
      b = buildB * blend + (100 + noise * 35) * (1 - blend);
    } else if (noise > 0.35) {
      // Routes asphaltées
      const roadIntensity = roadPattern * 0.4 + 0.3;
      const asphalt = 90 + roadIntensity * 40;
      r = asphalt;
      g = asphalt - 5;
      b = asphalt - 8;
    } else if (noise > 0.2) {
      // Eau/zones aquatiques
      r = 80 + noise * 40;
      g = 140 + noise * 50;
      b = 200 + noise * 40;
    } else {
      // Zones très sombres (eau profonde, ombres)
      r = 60 + noise * 30;
      g = 110 + noise * 40;
      b = 160 + noise * 50;
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    data[i + 3] = 255;
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
