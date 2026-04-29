type Point = { lat: number; lng: number };

export function traceCentroid(trace: Point[]): Point {
  const lat = trace.reduce((sum, point) => sum + point.lat, 0) / trace.length;
  const lng = trace.reduce((sum, point) => sum + point.lng, 0) / trace.length;
  return { lat, lng };
}

export function distKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

export interface RouteMatch {
  run: {
    id: string;
    started_at: string;
    distance_km: number;
    duration_seconds: number;
    avg_pace?: number;
  };
  similarity: number;
}

type MatchableRun = {
  id: string;
  started_at: string;
  distance_km: number;
  duration_seconds: number;
  gps_trace?: Point[];
  average_pace?: number | null;
};

export function findSimilarRoutes(
  currentRun: { id?: string; distance_km: number; gps_trace: Point[] },
  allRuns: MatchableRun[],
  maxResults = 5,
): RouteMatch[] {
  if (!currentRun.gps_trace?.length || currentRun.distance_km <= 0) return [];

  const currentStart = currentRun.gps_trace[0];
  const currentEnd = currentRun.gps_trace[currentRun.gps_trace.length - 1];
  const currentDist = currentRun.distance_km;

  return allRuns
    .filter((run) => run.id !== currentRun.id && run.gps_trace?.length)
    .map((run) => {
      const trace = run.gps_trace!;
      const runStart = trace[0];
      const runEnd = trace[trace.length - 1];

      const startDist = distKm(currentStart, runStart);
      if (startDist > 0.2) return null;

      const endDist = distKm(currentEnd, runEnd);
      if (endDist > 0.3) return null;

      const distDiff = Math.abs(run.distance_km - currentDist) / currentDist;
      if (distDiff > 0.15) return null;

      const similarity = 1 - (startDist / 0.2 + endDist / 0.3 + distDiff / 0.15) / 3;

      return {
        run: {
          id: run.id,
          started_at: run.started_at,
          distance_km: run.distance_km,
          duration_seconds: run.duration_seconds,
          avg_pace: run.average_pace ?? undefined,
        },
        similarity,
      };
    })
    .filter((match): match is RouteMatch => match !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
}
