import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, MapPin, MessageCircle } from "lucide-react";
import { GpsTraceSvg } from "@/components/GpsTraceSvg";
import { cn } from "@/lib/utils";
import { getRunWithGps, type ProfileRow, type RunRow } from "@/lib/database";
import type { CommunityPost } from "@/lib/runFormatters";

type SocialFeedPost = CommunityPost & {
  activityId: number;
  dbId?: string;
  liked: boolean;
  likes: number;
  comments: number;
  sourceRun?: RunRow | null;
  authorProfile?: ProfileRow | null;
};

type TracePoint = { lat: number; lng: number; time: number };

type ActivityPostCardProps = {
  post: SocialFeedPost;
  userId?: string;
  onOpen?: (post: SocialFeedPost) => void;
  onLike?: (post: SocialFeedPost) => void;
  onComment?: (post: SocialFeedPost) => void;
  isLikeBusy?: boolean;
};

function formatPaceFromMinutes(paceMinPerKm: number): string {
  if (!paceMinPerKm || !Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) return "--:--";
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  const safeSeconds = seconds === 60 ? 59 : seconds;
  return `${minutes}:${String(safeSeconds).padStart(2, "0")}`;
}

function parseDurationToSeconds(duration: string): number {
  const chunks = duration.split(":").map((p) => Number.parseInt(p, 10));
  if (chunks.some((v) => Number.isNaN(v))) return 0;
  if (chunks.length === 3) return chunks[0] * 3600 + chunks[1] * 60 + chunks[2];
  if (chunks.length === 2) return chunks[0] * 60 + chunks[1];
  return 0;
}

export function ActivityPostCard({ post, userId, onOpen, onLike, onComment, isLikeBusy = false }: ActivityPostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [gpsTrace, setGpsTrace] = useState<TracePoint[] | null>(
    Array.isArray(post.gpsTrace) && post.gpsTrace.length > 1 ? (post.gpsTrace as TracePoint[]) : null,
  );

  const runId = post.sourceRun?.id;
  const displayName =
    post.authorProfile?.first_name?.trim() ||
    post.authorProfile?.username ||
    post.authorProfile?.full_name ||
    post.user ||
    "Coureur";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !runId || !userId || gpsTrace !== null) return;

    let cancelled = false;
    void getRunWithGps(userId, runId)
      .then((run) => {
        if (cancelled) return;
        if (Array.isArray(run?.gps_trace)) {
          const trace = run.gps_trace.filter(
            (point): point is TracePoint =>
              typeof point === "object" &&
              point !== null &&
              typeof (point as { lat?: unknown }).lat === "number" &&
              typeof (point as { lng?: unknown }).lng === "number" &&
              typeof (point as { time?: unknown }).time === "number",
          );
          setGpsTrace(trace);
          return;
        }
        setGpsTrace([]);
      })
      .catch(() => {
        if (!cancelled) setGpsTrace([]);
      });

    return () => {
      cancelled = true;
    };
  }, [gpsTrace, isVisible, runId, userId]);

  const stats = useMemo(() => {
    const parsedDistance = Number.parseFloat((post.stats.distance ?? "0").replace(",", ".").replace(/[^\d.]/g, ""));
    const distanceKm =
      post.sourceRun?.distance_km ?? (Number.isFinite(parsedDistance) ? parsedDistance : 0);
    const durationSeconds = post.sourceRun?.duration_seconds ?? parseDurationToSeconds(post.stats.duration ?? "0:00");
    const avgPaceMin = post.sourceRun?.average_pace ?? (distanceKm > 0 ? durationSeconds / distanceKm / 60 : 0);
    return {
      distanceKm,
      durationSeconds,
      paceLabel: formatPaceFromMinutes(avgPaceMin),
    };
  }, [post.sourceRun, post.stats.distance, post.stats.duration]);

  return (
    <div
      ref={cardRef}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      onClick={() => onOpen?.(post)}
    >
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">{post.time}</p>
        </div>
        <div className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">Course</div>
      </div>

      {gpsTrace && gpsTrace.length > 1 ? (
        <GpsTraceSvg trace={gpsTrace} height={180} className="w-full" />
      ) : isVisible && gpsTrace === null ? (
        <div className="h-[180px] animate-pulse bg-muted" />
      ) : (
        <div className="flex h-[100px] items-center justify-center bg-muted/30">
          <MapPin className="h-5 w-5 text-muted-foreground/40" />
        </div>
      )}

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <div className="px-4 py-3 text-center">
          <p className="font-metric text-base font-bold text-foreground">{stats.distanceKm > 0 ? stats.distanceKm.toFixed(2) : "--"}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">km</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="font-metric text-base font-bold text-foreground">{post.stats.duration || "--:--"}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">duree</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="font-metric text-base font-bold text-accent">{stats.paceLabel}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">allure</p>
        </div>
      </div>

      {post.description ? <p className="px-4 py-2 text-sm text-foreground/80">{post.description}</p> : null}

      <div className="flex items-center gap-1 border-t border-border px-4 py-3">
        <button
          type="button"
          disabled={isLikeBusy}
          onClick={(event) => {
            event.stopPropagation();
            onLike?.(post);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all active:scale-95",
            post.liked ? "bg-red-50 text-red-500" : "text-muted-foreground hover:bg-muted",
            isLikeBusy && "opacity-50",
          )}
        >
          <Heart className={cn("h-4 w-4", post.liked && "fill-red-500")} />
          <span className="font-medium">{post.likes || 0}</span>
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onComment?.(post);
          }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-muted active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">{post.comments || 0}</span>
        </button>
        <div className="flex-1" />
        <p className="text-xs text-muted-foreground">{post.time}</p>
      </div>
    </div>
  );
}
