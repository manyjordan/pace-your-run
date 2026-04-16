import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { BarChart3, Clock, Heart, Mountain, Play, Route, TrendingUp, X, Zap } from "lucide-react";
import { Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getRunWithGps, type RunRow } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatDuration, formatPace, formatPaceFromSeconds, type GPSTracePoint } from "@/lib/runFormatters";

const GPSMap = lazy(() => import("@/components/GPSMap"));

type ActivitySplitMetric = {
  distance: number;
  elapsed_time: number;
  elevation_difference?: number;
  moving_time: number;
  split: number;
  average_speed?: number;
  average_heartrate?: number;
};

type NormalizedActivity = {
  id: string;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  start_date: string;
  splits_metric?: ActivitySplitMetric[];
  map?: { summary_polyline?: string | null };
};

function normalizeActivityDetailInput(input: RunRow): NormalizedActivity {
  const r = input;
  return {
    id: r.id,
    name: r.title ?? "Course",
    distance: r.distance_km * 1000,
    moving_time: r.moving_time_seconds ?? r.duration_seconds,
    elapsed_time: r.duration_seconds,
    total_elevation_gain: r.elevation_gain ?? 0,
    average_heartrate: r.average_heartrate ?? undefined,
    start_date: r.started_at ?? r.created_at ?? new Date().toISOString(),
    splits_metric: undefined,
    map: undefined,
  };
}

type ActivityDetailProps = {
  activity: RunRow;
  onClose: () => void;
  allActivities?: RunRow[];
  fallbackTrace?: GPSTracePoint[];
};

function formatClockLabel(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatTrendComment({
  activity,
  allActivities,
  zoneSummary,
}: {
  activity: NormalizedActivity;
  allActivities: NormalizedActivity[];
  zoneSummary: Array<{ label: string; percentage: number }>;
}) {
  const previousActivities = allActivities
    .filter((item) => item.id !== activity.id && new Date(item.start_date) < new Date(activity.start_date))
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const similarRuns = previousActivities.filter((item) => {
    const ratio = item.distance / Math.max(activity.distance, 1);
    return ratio >= 0.8 && ratio <= 1.2;
  });

  const currentPaceSeconds = activity.moving_time / Math.max(activity.distance / 1000, 1);
  const previousPaceSeconds = similarRuns.length
    ? similarRuns.slice(0, 4).reduce((sum, item) => sum + item.moving_time / Math.max(item.distance / 1000, 1), 0) /
      Math.min(similarRuns.length, 4)
    : null;

  const recent28Days = allActivities.filter((item) => {
    const diffMs = new Date(activity.start_date).getTime() - new Date(item.start_date).getTime();
    return diffMs >= 0 && diffMs <= 28 * 24 * 60 * 60 * 1000;
  });
  const previous28Days = allActivities.filter((item) => {
    const diffMs = new Date(activity.start_date).getTime() - new Date(item.start_date).getTime();
    return diffMs > 28 * 24 * 60 * 60 * 1000 && diffMs <= 56 * 24 * 60 * 60 * 1000;
  });

  const recentKm = recent28Days.reduce((sum, item) => sum + item.distance / 1000, 0);
  const previousKm = previous28Days.reduce((sum, item) => sum + item.distance / 1000, 0);
  const highIntensityShare = zoneSummary
    .filter((zone) => zone.label === "Zone 4" || zone.label === "Zone 5")
    .reduce((sum, zone) => sum + zone.percentage, 0);
  const enduranceShare = zoneSummary
    .filter((zone) => zone.label === "Zone 1" || zone.label === "Zone 2")
    .reduce((sum, zone) => sum + zone.percentage, 0);

  if (previousPaceSeconds && currentPaceSeconds < previousPaceSeconds * 0.97 && highIntensityShare < 30) {
    return "Très belle sortie: tu vas plus vite que sur tes courses comparables tout en gardant une intensité bien maîtrisée. C'est un vrai signal de progression.";
  }

  if (highIntensityShare >= 35) {
    return "Séance exigeante: une grosse part du temps a été passée dans les zones hautes. Pense à bien récupérer sur les prochaines sorties pour consolider le bénéfice.";
  }

  if (recentKm > previousKm * 1.15 && previousKm > 0) {
    return "Ton volume récent est en hausse par rapport aux semaines précédentes. La dynamique est bonne, mais garde un oeil sur la fatigue pour éviter d'enchaîner trop fort.";
  }

  const recentDistanceAverage = previousActivities.length
    ? previousActivities.slice(0, 6).reduce((sum, item) => sum + item.distance / 1000, 0) /
      Math.min(previousActivities.length, 6)
    : null;

  if (recentDistanceAverage && activity.distance / 1000 > recentDistanceAverage * 1.2) {
    return "Bravo, tu t'es bien dépassé sur cette activité qui était plus longue que ce que tu fais d'habitude. C'est un bon marqueur de confiance et d'endurance.";
  }

  if (enduranceShare >= 60) {
    return "Sortie propre et régulière: tu as passé l'essentiel du temps dans les zones d'endurance. C'est excellent pour construire une base solide.";
  }

  if (previousPaceSeconds && currentPaceSeconds > previousPaceSeconds * 1.03) {
    return "Cette activité semble un peu plus difficile que tes repères récents. Rien d'inquiétant, mais ça peut valoir le coup d'alléger un peu la récupération ensuite.";
  }

  return "Sortie cohérente avec ta charge récente. Continue à empiler les kilomètres avec régularité, c'est ce qui fera la différence sur la durée.";
}

function decodePolyline(polyline: string): Array<{ lat: number; lng: number }> {
  const coordinates: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return coordinates;
}

function buildTraceFromActivityPolyline(activity: NormalizedActivity): GPSTracePoint[] | undefined {
  const polyline = activity.map?.summary_polyline;
  if (!polyline) return undefined;

  const points = decodePolyline(polyline);
  if (points.length === 0) return undefined;

  const startedAt = new Date(activity.start_date).getTime();
  const stepMs =
    points.length > 1 ? Math.max(1000, Math.round((activity.moving_time * 1000) / points.length)) : 1000;

  return points.map((point, index) => ({
    lat: point.lat,
    lng: point.lng,
    time: startedAt + index * stepMs,
  }));
}

export function ActivityDetail({
  activity,
  onClose,
  allActivities = [],
  fallbackTrace,
}: ActivityDetailProps) {
  const { session } = useAuth();
  const [fullRun, setFullRun] = useState<RunRow | null>(null);
  const [isLoadingGpsTrace, setIsLoadingGpsTrace] = useState(false);
  const [gpsLoadAttempted, setGpsLoadAttempted] = useState(false);

  useEffect(() => {
    setFullRun(null);
    setGpsLoadAttempted(false);
  }, [activity.id]);

  useEffect(() => {
    if (!activity?.id || !session?.user?.id || gpsLoadAttempted) return;
    if (Array.isArray(activity.gps_trace) && activity.gps_trace.length > 0) {
      setFullRun(activity);
      setGpsLoadAttempted(true);
      return;
    }

    let isCancelled = false;
    setIsLoadingGpsTrace(true);
    setGpsLoadAttempted(true);

    void getRunWithGps(session.user.id, activity.id)
      .then((run) => {
        if (!isCancelled) setFullRun(run);
      })
      .catch(() => {
        if (!isCancelled) setFullRun(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingGpsTrace(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activity, gpsLoadAttempted, session?.user?.id]);

  const resolvedActivity = useMemo(() => normalizeActivityDetailInput(activity), [activity]);
  const normalizedAllActivities = useMemo(
    () => allActivities.map((a) => normalizeActivityDetailInput(a)),
    [allActivities],
  );

  const analysis = useMemo(() => {
    const distanceKm = resolvedActivity.distance / 1000;
    const avgPace = formatPace(resolvedActivity.distance, resolvedActivity.moving_time);
    const avgHr = resolvedActivity.average_heartrate ?? 0;

    const timeData: number[] = [];
    const distanceData: number[] = [];
    const heartRateData: number[] = [];
    const altitudeData: number[] = [];
    const splitMetrics = resolvedActivity.splits_metric ?? [];

    const splits: Array<{
      km: number;
      paceLabel: string;
      paceSeconds: number;
      heartRate: string;
      elevation: number;
    }> = [];

    if (splitMetrics.length > 0) {
      splitMetrics.forEach((split) => {
        const splitSeconds = split.average_speed && split.average_speed > 0
          ? split.distance / split.average_speed
          : split.moving_time;

        splits.push({
          km: split.split,
          paceLabel: formatPace(split.distance, splitSeconds).replace(" /km", ""),
          paceSeconds: Math.round(splitSeconds),
          heartRate: split.average_heartrate ? `${Math.round(split.average_heartrate)}` : "--",
          elevation: Math.round(split.elevation_difference ?? 0),
        });
      });
    } else {
      const wholeKmCount = Math.max(1, Math.floor(distanceKm));

      for (let km = 1; km <= wholeKmCount; km += 1) {
        const startMeters = (km - 1) * 1000;
        const endMeters = km * 1000;
        const indexes = distanceData
          .map((meters, index) => ({ meters, index }))
          .filter(({ meters }) => meters >= startMeters && meters < endMeters)
          .map(({ index }) => index);

        if (indexes.length === 0) continue;

        const firstIndex = indexes[0];
        const lastIndex = indexes[indexes.length - 1];
        const splitSeconds = Math.max(1, (timeData[lastIndex] ?? 0) - (timeData[firstIndex] ?? 0));
        const hrValues = indexes
          .map((index) => heartRateData[index])
          .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
        const avgSplitHr = hrValues.length
          ? `${Math.round(hrValues.reduce((sum, value) => sum + value, 0) / hrValues.length)}`
          : "--";

        const startAltitude = altitudeData[firstIndex];
        const endAltitude = altitudeData[lastIndex];
        const elevation = typeof startAltitude === "number" && typeof endAltitude === "number"
          ? Math.round(endAltitude - startAltitude)
          : 0;

        splits.push({
          km,
          paceLabel: formatPace(1000, splitSeconds).replace(" /km", ""),
          paceSeconds: splitSeconds,
          heartRate: avgSplitHr,
          elevation,
        });
      }
    }

    if (splits.length === 0 && distanceKm > 0) {
      const defaultHr = resolvedActivity.average_heartrate
        ? `${Math.round(resolvedActivity.average_heartrate)}`
        : "--";
      const fullKm = Math.floor(distanceKm);
      const paceSecondsPerKm = resolvedActivity.moving_time / Math.max(distanceKm, 0.001);
      if (fullKm >= 1) {
        for (let km = 1; km <= fullKm; km += 1) {
          splits.push({
            km,
            paceLabel: formatPace(1000, paceSecondsPerKm).replace(" /km", ""),
            paceSeconds: Math.round(paceSecondsPerKm),
            heartRate: defaultHr,
            elevation: 0,
          });
        }
      } else {
        splits.push({
          km: 1,
          paceLabel: formatPace(resolvedActivity.distance, resolvedActivity.moving_time).replace(" /km", ""),
          paceSeconds: resolvedActivity.moving_time,
          heartRate: defaultHr,
          elevation: 0,
        });
      }
    }

    const slowestSplit = Math.max(...splits.map((split) => split.paceSeconds), 1);
    const fastestSplit = Math.min(...splits.map((split) => split.paceSeconds), slowestSplit);
    const splitChartData = splits.map((split) => {
      const denominator = Math.max(1, slowestSplit - fastestSplit);
      const normalized = (slowestSplit - split.paceSeconds) / denominator;
      return {
        ...split,
        barWidth: Math.round(28 + normalized * 72),
      };
    });

    const heartRateSeries = heartRateData.length
      ? heartRateData
          .map((value, index) => ({
            label: formatClockLabel(timeData[index] ?? 0),
            value,
            rawIndex: index,
          }))
          .filter((_, index) => index % Math.max(1, Math.floor(heartRateData.length / 24)) === 0)
      : [];

    const zoneDefinitions = [
      { label: "Zone 1", range: "50-60%", color: "hsl(200, 80%, 55%)", min: 0, max: 120 },
      { label: "Zone 2", range: "60-70%", color: "hsl(120, 80%, 50%)", min: 120, max: 140 },
      { label: "Zone 3", range: "70-85%", color: "hsl(45, 97%, 54%)", min: 140, max: 160 },
      { label: "Zone 4", range: "85-95%", color: "hsl(38, 92%, 50%)", min: 160, max: 175 },
      { label: "Zone 5", range: "95-100%", color: "hsl(0, 72%, 51%)", min: 175, max: Number.POSITIVE_INFINITY },
    ];

    const zones = zoneDefinitions.map((zone) => {
      const count = heartRateData.filter((value) => value >= zone.min && value < zone.max).length;
      const percentage = heartRateData.length ? Math.round((count / heartRateData.length) * 100) : 0;
      const seconds = timeData.length
        ? Math.round((percentage / 100) * (timeData[timeData.length - 1] ?? resolvedActivity.moving_time))
        : 0;

      return {
        ...zone,
        percentage,
        durationLabel: seconds ? formatDuration(seconds) : "00:00",
      };
    });

    const loadedTrace = Array.isArray(fullRun?.gps_trace)
      ? (fullRun.gps_trace as GPSTracePoint[])
      : undefined;
    const trace = loadedTrace ?? fallbackTrace ?? buildTraceFromActivityPolyline(resolvedActivity);
    const comment = formatTrendComment({
      activity: resolvedActivity,
      allActivities: normalizedAllActivities,
      zoneSummary: zones.map(({ label, percentage }) => ({ label, percentage })),
    });

    return {
      distanceKm,
      avgPace,
      avgHr,
      splitChartData,
      heartRateSeries,
      zones,
      trace,
      comment,
      hasDetailedSplits: splitChartData.length > 0,
      hasHeartRateCurve: heartRateSeries.length > 1,
      startDate: new Date(resolvedActivity.start_date),
    };
  }, [fallbackTrace, fullRun?.gps_trace, normalizedAllActivities, resolvedActivity]);
  const showMovingMetrics = Math.abs(resolvedActivity.elapsed_time - resolvedActivity.moving_time) > 30;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-sm">
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-accent/50 bg-gradient-to-r from-accent/90 to-accent/70 p-4 text-accent-foreground">
        <h2 className="truncate text-lg font-bold">{resolvedActivity.name}</h2>
        <button onClick={onClose} className="rounded-lg p-1 transition hover:bg-accent-foreground/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-8 pt-16">
        <div className="rounded-lg border border-accent/20 bg-card p-4">
          {activity.run_type === "treadmill" && (
            <Badge variant="outline" className="mb-2 border-muted-foreground/30 text-xs text-muted-foreground">
              Tapis roulant
            </Badge>
          )}
          <p className="text-xs font-medium text-muted-foreground">Date</p>
          <p className="mt-1 text-sm font-semibold">
            {analysis.startDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-accent/20 bg-card p-3">
            <div className="flex items-center gap-1.5">
              <Route className="h-4 w-4 text-lime" />
              <span className="text-xs text-muted-foreground">Distance</span>
            </div>
            <p className="mt-2 text-lg font-bold">{formatDistance(resolvedActivity.distance)}</p>
          </div>
          <div className="rounded-lg border border-accent/20 bg-card p-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-lime" />
              <span className="text-xs text-muted-foreground">Durée totale</span>
            </div>
            <p className="mt-2 text-lg font-bold">{formatDuration(resolvedActivity.elapsed_time)}</p>
          </div>
          {showMovingMetrics ? (
            <div className="rounded-lg border border-accent/20 bg-card p-3">
              <div className="flex items-center gap-1.5">
                <Play className="h-4 w-4 text-lime" />
                <span className="text-xs text-muted-foreground">Temps de course</span>
              </div>
              <p className="mt-2 text-lg font-bold text-accent">{formatDuration(resolvedActivity.moving_time)}</p>
            </div>
          ) : null}
          <div className="rounded-lg border border-accent/20 bg-card p-3">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-lime" />
              <span className="text-xs text-muted-foreground">{showMovingMetrics ? "Allure de course" : "Allure moyenne"}</span>
            </div>
            <p className="mt-2 text-lg font-bold">
              {formatPaceFromSeconds(
                showMovingMetrics ? resolvedActivity.moving_time : resolvedActivity.elapsed_time,
                resolvedActivity.distance,
              )}
            </p>
          </div>
          {showMovingMetrics ? (
            <div className="rounded-lg border border-accent/20 bg-card p-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-lime" />
                <span className="text-xs text-muted-foreground">Allure moyenne</span>
              </div>
              <p className="mt-2 text-lg font-bold">
                {formatPaceFromSeconds(resolvedActivity.elapsed_time, resolvedActivity.distance)}
              </p>
            </div>
          ) : null}
          <div className="rounded-lg border border-accent/20 bg-card p-3">
            <div className="flex items-center gap-1.5">
              <Mountain className="h-4 w-4 text-lime" />
              <span className="text-xs text-muted-foreground">Dénivelé</span>
            </div>
            <p className="mt-2 text-lg font-bold">{Math.round(resolvedActivity.total_elevation_gain ?? 0)} m</p>
          </div>
        </div>

        {(isLoadingGpsTrace || analysis.trace) && (
          <div className="rounded-lg border border-accent/20 bg-card p-3">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Trace GPS</p>
            {isLoadingGpsTrace ? (
              <div className="h-[220px] rounded-lg bg-muted animate-pulse" />
            ) : analysis.trace ? (
              <Suspense fallback={<div className="h-[220px] rounded-lg bg-muted animate-pulse" />}>
                <GPSMap trace={analysis.trace} />
              </Suspense>
            ) : null}
          </div>
        )}

        {analysis.hasDetailedSplits && (
          <div className="rounded-lg border border-accent/20 bg-card p-4 shadow-[0_12px_30px_hsl(var(--accent)/0.06)]">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-lime" />
              <h3 className="text-lg font-bold">Temps intermédiaires</h3>
            </div>

            <div className="mb-3 grid grid-cols-[44px_72px_1fr_56px_54px] items-center gap-3 px-1 text-sm text-muted-foreground">
              <span>Km</span>
              <span>Allure</span>
              <span />
              <span className="text-right">Élév.</span>
              <span className="text-right">FC</span>
            </div>

            <div className="space-y-2">
              {analysis.splitChartData.map((split) => (
                <div key={split.km} className="grid grid-cols-[44px_72px_1fr_56px_54px] items-center gap-3">
                  <span className="text-base font-semibold tabular-nums text-foreground">{split.km}</span>
                  <span className="text-base font-semibold tabular-nums text-foreground">{split.paceLabel}</span>
                  <div className="h-10 rounded-xl bg-transparent">
                    <div
                      className="flex h-full items-center rounded-xl bg-accent px-3 text-accent-foreground shadow-[0_8px_20px_hsl(var(--accent)/0.18)]"
                      style={{ width: `${split.barWidth}%` }}
                    />
                  </div>
                  <span className="text-right text-base font-semibold tabular-nums text-foreground">{split.elevation}</span>
                  <span className="text-right text-base font-semibold tabular-nums text-foreground">{split.heartRate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.hasHeartRateCurve && (
          <div className="rounded-lg border border-accent/20 bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-lime" />
              <h3 className="text-sm font-semibold">Évolution de la fréquence cardiaque</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.heartRateSeries}>
                  {analysis.zones.map((zone, index) => {
                    const [minLabel, maxLabel] = zone.range.replace("%", "").split("-");
                    const zoneBounds = [
                      [0, 120],
                      [120, 140],
                      [140, 160],
                      [160, 175],
                      [175, 205],
                    ][index];

                    return (
                      <ReferenceArea
                        key={zone.label}
                        y1={zoneBounds[0]}
                        y2={zoneBounds[1]}
                        fill={zone.color}
                        fillOpacity={0.08}
                      />
                    );
                  })}
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    formatter={(value) => [`${Math.round(Number(value))} bpm`, "FC:"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(0, 72%, 51%)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {analysis.avgHr > 0 && (
          <div className="rounded-lg border border-accent/20 bg-card p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Temps passé dans les zones de fréquence cardiaque</p>
            <div className="space-y-2">
              {analysis.zones.map((zone) => (
                <div key={zone.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{zone.label} · {zone.range}</span>
                    <span className="text-muted-foreground">{zone.durationLabel} · {zone.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${zone.percentage}%`, backgroundColor: zone.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
          <p className="text-xs font-semibold text-muted-foreground">Commentaire de performance</p>
          <p className="mt-2 text-sm text-foreground">{analysis.comment}</p>
        </div>
      </div>
    </div>
  );
}
