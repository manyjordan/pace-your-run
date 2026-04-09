import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  saveRun,
  createPost,
  detectSimultaneousRuns,
  getProfilesByIds,
  updateRunRanWith,
  updatePostDescription,
  type RouteRow,
} from "@/lib/database";
import { clearActiveSession, type ActiveSession } from "@/lib/activeSession";
import type { CommunityPost } from "@/lib/strava";

const OFFLINE_RUNS_KEY = "pace-offline-runs";

function isLikelyNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (error instanceof TypeError) {
    const m = String(error.message);
    if (/fetch|network|load failed/i.test(m)) return true;
  }
  const msg = String((error as { message?: string })?.message ?? error);
  if (/failed to fetch|networkerror|network request failed/i.test(msg)) return true;
  return false;
}

export type RunSummaryForPersist = {
  distance: number;
  duration: number;
  movingTime?: number;
  avgPace: number;
  elevation: number;
  averageHeartRate?: number;
  gpsTrace: Array<{ lat: number; lng: number; time: number; altitude?: number; accuracy?: number }>;
  startedAt: string;
};

export type PersistCompletedRunInput = {
  runSummary: RunSummaryForPersist;
  title: string;
  isTreadmill: boolean;
  postAudienceRef: MutableRefObject<"private" | "friends" | "public">;
  selectRouteKey: string;
  formatTime: (seconds: number) => string;
  setCompletedPostId: (id: string | null) => void;
  setActiveRoute: (r: RouteRow | null) => void;
  setRouteProgress: (n: number) => void;
  setActiveSession: (s: ActiveSession | null) => void;
  setCompletedPost: Dispatch<SetStateAction<CommunityPost | null>>;
};

export function useRunSave() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const persistCompletedRun = useCallback(
    async ({
      runSummary,
      title,
      isTreadmill,
      postAudienceRef,
      selectRouteKey,
      formatTime,
      setCompletedPostId,
      setActiveRoute,
      setRouteProgress,
      setActiveSession,
      setCompletedPost,
    }: PersistCompletedRunInput) => {
      if (!user || !runSummary) return;

      const activityTitle = title.trim() || generateDefaultTitle();
      const description = `Je viens de terminer ${runSummary.distance.toFixed(2)} km en ${formatTime(runSummary.duration)}.`;
      const runData = {
        distance_km: runSummary.distance,
        duration_seconds: runSummary.duration,
        moving_time_seconds: isTreadmill
          ? runSummary.duration
          : runSummary.movingTime && runSummary.movingTime > 0
            ? runSummary.movingTime
            : null,
        average_pace: runSummary.avgPace,
        average_heartrate: runSummary.averageHeartRate ?? null,
        elevation_gain: isTreadmill ? 0 : runSummary.elevation,
        gps_trace: isTreadmill ? [] : runSummary.gpsTrace,
        run_type: (isTreadmill ? "treadmill" : "run") as const,
        started_at: runSummary.startedAt,
        title: activityTitle,
      };

      try {
        setIsSaving(true);
        setSaveError("");

        const savedRun = await saveRun(user.id, runData);

        const createdPost = await createPost(user.id, savedRun.id, activityTitle, description, postAudienceRef.current);
        setCompletedPostId(createdPost.id);
        window.dispatchEvent(new Event("pace-community-updated"));
        localStorage.removeItem(selectRouteKey);
        setActiveRoute(null);
        setRouteProgress(0);
        clearActiveSession();
        setActiveSession(null);

        const ranWithIds = isTreadmill
          ? []
          : await detectSimultaneousRuns(
              user.id,
              runSummary.startedAt,
              runSummary.duration,
              runSummary.gpsTrace,
            ).catch(() => []);

        if (ranWithIds.length > 0) {
          toast({
            title: "Course partagée détectée",
            description: `Il semblerait que vous ayez couru avec ${ranWithIds.length} ami(s) !`,
          });

          await updateRunRanWith(savedRun.id, user.id, ranWithIds).catch(() => {});

          const ranWithProfiles = await getProfilesByIds(ranWithIds).catch(() => []);
          const names = ranWithProfiles
            .map((p) => p.first_name ?? p.full_name ?? p.username ?? "Un ami")
            .join(", ");

          const updatedDescription = `${description} · Couru avec ${names}`;

          await updatePostDescription(createdPost.id, user.id, updatedDescription).catch(() => {});

          setCompletedPost((p) => (p ? { ...p, description: updatedDescription } : null));
        }
      } catch (error) {
        console.error("[Run] operation failed:", error);
        import("@sentry/react")
          .then(({ captureException }) => {
            captureException(error);
          })
          .catch(() => {});

        if (isLikelyNetworkError(error)) {
          console.error("Failed to save run online:", error);
          try {
            const existing = JSON.parse(localStorage.getItem(OFFLINE_RUNS_KEY) ?? "[]");
            const queue = Array.isArray(existing) ? existing : [];
            const offlineRun = {
              ...runData,
              offlinePostDescription: description,
              offlinePostAudience: postAudienceRef.current,
              savedOfflineAt: new Date().toISOString(),
              id: crypto.randomUUID(),
            };
            localStorage.setItem(OFFLINE_RUNS_KEY, JSON.stringify([offlineRun, ...queue]));
            toast({
              title: "Course sauvegardée localement",
              description: "Elle sera synchronisée automatiquement dès que vous serez reconnecté.",
            });
            setSaveError("");
          } catch (err) {
            console.error("[Run] save failed:", err);
            import("@sentry/react").then(({ captureException }) => captureException(err)).catch(() => {});
            setSaveError("Impossible d'enregistrer cette course pour le moment.");
          }
        } else {
          setSaveError("Impossible d'enregistrer cette course pour le moment.");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [user, toast],
  );

  return { persistCompletedRun, isSaving, saveError, setSaveError };
}

function generateDefaultTitle(): string {
  const now = new Date();
  const hour = now.getHours();

  const timeOfDay =
    hour >= 5 && hour < 9
      ? "matinale"
      : hour >= 9 && hour < 12
        ? "du matin"
        : hour >= 12 && hour < 14
          ? "de midi"
          : hour >= 14 && hour < 18
            ? "de l'après-midi"
            : hour >= 18 && hour < 21
              ? "du soir"
              : "nocturne";

  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const day = days[now.getDay()];

  return `Course ${timeOfDay} — ${day}`;
}
