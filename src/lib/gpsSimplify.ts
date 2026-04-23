export interface Point {
  lat: number;
  lng: number;
  [key: string]: unknown;
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.lng - lineStart.lng;
  const dy = lineEnd.lat - lineStart.lat;
  if (dx === 0 && dy === 0) {
    return Math.sqrt(Math.pow(point.lng - lineStart.lng, 2) + Math.pow(point.lat - lineStart.lat, 2));
  }
  const t =
    ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / (dx * dx + dy * dy);
  const nearestLng = lineStart.lng + t * dx;
  const nearestLat = lineStart.lat + t * dy;
  return Math.sqrt(Math.pow(point.lng - nearestLng, 2) + Math.pow(point.lat - nearestLat, 2));
}

export function simplifyGpsTrace<T extends Point>(points: T[], epsilon = 0.00005): T[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyGpsTrace(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyGpsTrace(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}
