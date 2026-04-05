import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { RunRow } from "@/lib/database";
import {
  formatDuration,
  formatPace,
  formatRelativeTime,
  getInitials,
  type CommunityPost,
  type GPSTracePoint,
} from "@/lib/strava";
import { ActivityPostCard } from "@/components/ActivityPostCard";

function hashStringToNumber(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseGpsTrace(trace: RunRow["gps_trace"]): GPSTracePoint[] | undefined {
  if (!Array.isArray(trace)) return undefined;

  const points = trace.filter((point): point is GPSTracePoint => {
    return (
      typeof point === "object" &&
      point !== null &&
      typeof (point as { lat?: unknown }).lat === "number" &&
      typeof (point as { lng?: unknown }).lng === "number" &&
      typeof (point as { time?: unknown }).time === "number"
    );
  });

  return points.length ? points : undefined;
}

function runToCommunityPost(run: RunRow, athleteName: string): CommunityPost {
  const id = hashStringToNumber(run.id);
  const distanceM = run.distance_km * 1000;
  const started = run.started_at ?? run.created_at ?? new Date().toISOString();

  return {
    id,
    user: athleteName,
    initials: getInitials(athleteName),
    time: formatRelativeTime(started),
    type: "run",
    title: run.title ?? "Course",
    description: `${run.distance_km.toFixed(2)} km · ${formatPace(distanceM, run.duration_seconds)}`,
    stats: {
      distance: `${run.distance_km.toFixed(2)} km`,
      pace: formatPace(distanceM, run.duration_seconds),
      duration: formatDuration(run.duration_seconds),
      elevation: `+${Math.round(run.elevation_gain ?? 0)} m`,
    },
    likes: 0,
    comments: 0,
    liked: false,
    gpsTrace: parseGpsTrace(run.gps_trace),
  };
}

export const ActivitySection = ({
  runs,
  athleteName,
  onOpenActivityDetail,
}: {
  runs: RunRow[];
  athleteName: string;
  onOpenActivityDetail: (run: RunRow) => void;
}) => {
  const items = useMemo(
    () =>
      [...runs]
        .sort((a, b) => {
          const ta = new Date(a.started_at ?? a.created_at ?? 0).getTime();
          const tb = new Date(b.started_at ?? b.created_at ?? 0).getTime();
          return tb - ta;
        })
        .map((run) => ({
          run,
          post: runToCommunityPost(run, athleteName),
        })),
    [runs, athleteName],
  );

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-accent/20 bg-card p-5 text-sm text-muted-foreground">
        Aucune activité trouvée, si tu as de l&apos;historique réalisée sur d&apos;autres applications ou supports,{" "}
        <Link to="/import" className="font-medium text-accent underline underline-offset-4">
          importe les données. Clique ici pour savoir comment faire
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(({ run, post }, index) => (
        <ScrollReveal key={run.id} delay={index * 0.04}>
          <ActivityPostCard post={post} onOpen={() => onOpenActivityDetail(run)} />
        </ScrollReveal>
      ))}
    </div>
  );
};
