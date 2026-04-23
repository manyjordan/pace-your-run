import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { RouteRow, RunGpsPoint, RunRow } from "@/lib/database";
import {
  formatDuration as formatSocialDuration,
  formatPace as formatSocialPace,
  formatRelativeTime,
  getInitials,
  type CommunityPost,
} from "@/lib/runFormatters";
import { computeMovingTime, haversineDistanceKm } from "@/lib/parsers/gpxParser";
import { loadRunPreferences, type RunPreferences } from "@/lib/runPreferences";
import type { ActiveSession } from "@/lib/activeSession";
import { useGpsTracking } from "@/hooks/useGpsTracking";
import { useRunTimer } from "@/hooks/useRunTimer";
import type { RunBluetoothStatus } from "@/hooks/useBluetoothHR";
import type { TreadmillRunControls } from "@/hooks/useTreadmill";

export type RunSummary = {
  distance: number;
  duration: number;
  movingTime?: number;
  avgPace: number;
  elevation: number;
  averageHeartRate?: number;
  gpsTrace: RunGpsPoint[];
  startedAt: string;
};

type BluetoothApi = {
  heartRateSamplesRef: MutableRefObject<number[]>;
  disconnectHardware: () => void;
  clearErrorAndSamplesForRunStart: () => void;
  resetUiAfterFullStop: () => void;
};

function findClosestPointIndex(
  trace: Array<{ lat: number; lng: number }>,
  current: { lat: number; lng: number },
): number {
  let minDist = Infinity;
  let closest = 0;
  for (let i = 0; i < trace.length; i++) {
    const d = Math.sqrt(
      Math.pow(trace[i].lat - current.lat, 2) + Math.pow(trace[i].lng - current.lng, 2),
    );
    if (d < minDist) {
      minDist = d;
      closest = i;
    }
  }
  return closest;
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

type RunStatus = "idle" | "running" | "paused";

export type UseRunSessionOptions = {
  statusRef: MutableRefObject<RunBluetoothStatus>;
  user: User | null;
  userPreferencesUserId: string | undefined;
  activeSession: ActiveSession | null;
  activeRoute: RouteRow | null;
  treadmill: TreadmillRunControls;
  bluetooth: BluetoothApi;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  runSummary: RunSummary | null;
  showTreadmillCorrection: boolean;
  completedActivity: RunRow | null;
  completedPost: CommunityPost | null;
  setRunSummary: Dispatch<SetStateAction<RunSummary | null>>;
  setCompletedActivity: Dispatch<SetStateAction<RunRow | null>>;
  setCompletedPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setCompletedPostId: Dispatch<SetStateAction<string | null>>;
  setShowCompletedActivityDetail: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<string>>;
  routeArrivalAnnouncedRef: MutableRefObject<boolean>;
  speechPrefsRef: MutableRefObject<RunPreferences>;
  currentIntervalRepRef: MutableRefObject<number>;
  resetProgramProgressRef: MutableRefObject<() => void>;
  resetAnnouncementRefsRef: MutableRefObject<() => void>;
  resetKilometreAnnouncementRefRef: MutableRefObject<() => void>;
};

export function useRunSession({
  statusRef,
  user,
  userPreferencesUserId,
  activeSession,
  activeRoute,
  treadmill,
  bluetooth,
  title,
  setTitle,
  runSummary,
  showTreadmillCorrection,
  completedActivity,
  completedPost,
  setRunSummary,
  setCompletedActivity,
  setCompletedPost,
  setCompletedPostId,
  setShowCompletedActivityDetail,
  setSaveError,
  routeArrivalAnnouncedRef,
  speechPrefsRef,
  currentIntervalRepRef,
  resetProgramProgressRef,
  resetAnnouncementRefsRef,
  resetKilometreAnnouncementRefRef,
}: UseRunSessionOptions) {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [distance, setDistance] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);

  const runStartedAtRef = useRef<string | null>(null);

  const bumpDistance = useCallback((deltaKm: number) => {
    setDistance((d) => d + deltaKm);
  }, []);

  const {
    gpsTrace,
    setGpsTrace,
    gpsAccuracy,
    setGpsAccuracy,
    gpsError,
    setGpsError,
    rollingPaceSecondsPerKm,
    setRollingPaceSecondsPerKm,
    lastGpsPointRef,
    startGpsTracking,
    stopGpsTracking,
    getAccuracyColor,
  } = useGpsTracking({
    onPermissionDenied: () => setStatus("idle"),
    onDistanceDelta: bumpDistance,
  });

  const { elapsed, setElapsed, startInterval, stopInterval, startKeepAlive, formatTime } = useRunTimer();

  const averagePace = distance > 0 ? elapsed / 60 / distance : 0;
  const pace = treadmill.isTreadmill ? averagePace : rollingPaceSecondsPerKm > 0 ? rollingPaceSecondsPerKm / 60 : averagePace;

  const calories: number | undefined = undefined;

  useEffect(() => {
    statusRef.current = status;
  }, [status, statusRef]);

  useEffect(() => {
    if (status === "paused") {
      void stopGpsTracking();
      stopInterval();
    } else if (status === "idle") {
      void stopGpsTracking();
      stopInterval();
    }

    return () => {
      stopInterval();
      void stopGpsTracking();
    };
  }, [
    treadmill.isTreadmill,
    status,
    startGpsTracking,
    stopGpsTracking,
    startInterval,
    stopInterval,
  ]);

  useEffect(() => {
    if (!treadmill.isTreadmill || status !== "running") return;

    const interval = setInterval(() => {
      setDistance((prev) => Number((prev + treadmill.treadmillSpeedKmh / 3600).toFixed(4)));
    }, 1000);

    return () => clearInterval(interval);
  }, [treadmill.isTreadmill, treadmill.treadmillSpeedKmh, status]);

  useEffect(() => {
    if (!activeRoute || treadmill.isTreadmill || gpsTrace.length === 0) return;

    const current = gpsTrace[gpsTrace.length - 1];
    const closestIndex = findClosestPointIndex(activeRoute.gps_trace, current);
    let coveredKm = 0;
    for (let i = 1; i <= closestIndex; i++) {
      coveredKm += haversineDistanceKm(activeRoute.gps_trace[i - 1], activeRoute.gps_trace[i]);
    }
    setRouteProgress(Number(coveredKm.toFixed(2)));
  }, [activeRoute, gpsTrace, treadmill.isTreadmill]);

  const calculateElevationGain = useCallback((trace: RunGpsPoint[]): number => {
    if (trace.length < 2) return 0;
    let gain = 0;
    for (let i = 1; i < trace.length; i++) {
      const diff = (trace[i].altitude ?? 0) - (trace[i - 1].altitude ?? 0);
      if (diff > 0) gain += diff;
    }
    return gain;
  }, []);

  const start = useCallback(() => {
    // Reset state before starting interval so timer refs are not reset after start.
    if (runSummary || showTreadmillCorrection || completedActivity || completedPost) {
      treadmill.resetTreadmillForFreshRun();
    }
    setElapsed(0);
    setDistance(0);
    setGpsTrace([]);
    setRollingPaceSecondsPerKm(0);
    setGpsAccuracy(null);
    setRunSummary(null);
    setCompletedActivity(null);
    setCompletedPost(null);
    setCompletedPostId(null);
    setShowCompletedActivityDetail(false);
    setSaveError("");

    // Start timer/keepalive only after state reset.
    startInterval();
    startKeepAlive();
    setStatus("running");
    if (!treadmill.isTreadmill) {
      void startGpsTracking();
    }

    setTitle(activeSession?.session.type ?? "");
    bluetooth.clearErrorAndSamplesForRunStart();
    lastGpsPointRef.current = null;
    runStartedAtRef.current = new Date().toISOString();
    speechPrefsRef.current = loadRunPreferences(userPreferencesUserId);
    resetAnnouncementRefsRef.current();
    resetProgramProgressRef.current();
    currentIntervalRepRef.current = 0;
    setRouteProgress(0);
    routeArrivalAnnouncedRef.current = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [
    startInterval,
    runSummary,
    showTreadmillCorrection,
    completedActivity,
    completedPost,
    treadmill.resetTreadmillForFreshRun,
    activeSession,
    setTitle,
    setRunSummary,
    setCompletedActivity,
    setCompletedPost,
    setCompletedPostId,
    setShowCompletedActivityDetail,
    setSaveError,
    setGpsTrace,
    setElapsed,
    setGpsAccuracy,
    bluetooth.clearErrorAndSamplesForRunStart,
    lastGpsPointRef,
    speechPrefsRef,
    resetAnnouncementRefsRef,
    resetProgramProgressRef,
    currentIntervalRepRef,
    routeArrivalAnnouncedRef,
    userPreferencesUserId,
    startKeepAlive,
    setRollingPaceSecondsPerKm,
    treadmill.isTreadmill,
    startGpsTracking,
  ]);

  const pause = useCallback(() => setStatus("paused"), []);
  const resume = useCallback(() => {
    startInterval();
    startKeepAlive();
    if (!treadmill.isTreadmill) {
      void startGpsTracking();
    }
    setStatus("running");
  }, [startInterval, startKeepAlive, treadmill.isTreadmill, startGpsTracking]);

  const stop = useCallback(async () => {
    const finalDistance =
      treadmill.isTreadmill && treadmill.correctedDistanceKm && parseFloat(treadmill.correctedDistanceKm) > 0
        ? parseFloat(treadmill.correctedDistanceKm)
        : distance;
    const finalElapsed = elapsed;
    const finalGpsTrace = treadmill.isTreadmill ? [] : gpsTrace;
    const movingTimeSeconds = treadmill.isTreadmill ? finalElapsed : computeMovingTime(finalGpsTrace);
    const finalStartedAt = runStartedAtRef.current ?? new Date().toISOString();
    const finalElevation = treadmill.isTreadmill ? 0 : calculateElevationGain(finalGpsTrace);
    const finalAvgPace = finalDistance > 0 ? finalElapsed / 60 / finalDistance : 0;
    const finalAverageHeartRate =
      bluetooth.heartRateSamplesRef.current.length > 0
        ? Math.round(
            bluetooth.heartRateSamplesRef.current.reduce((sum, bpm) => sum + bpm, 0) /
              bluetooth.heartRateSamplesRef.current.length,
          )
        : undefined;

    if (treadmill.isTreadmill && !treadmill.showTreadmillCorrection) {
      bluetooth.disconnectHardware();
      await stopGpsTracking();
      stopInterval();
      if (status !== "idle" && finalElapsed > 0 && finalDistance > 0) {
        setRunSummary({
          distance: finalDistance,
          duration: finalElapsed,
          movingTime: finalElapsed,
          avgPace: finalAvgPace,
          elevation: 0,
          averageHeartRate: finalAverageHeartRate,
          gpsTrace: [],
          startedAt: finalStartedAt,
        });
      }
      setStatus("idle");
      treadmill.setShowTreadmillCorrection(true);
      treadmill.setCorrectedDistanceKm("");
      return;
    }

    if (status !== "idle" && finalElapsed > 0 && finalDistance > 0) {
      setRunSummary({
        distance: finalDistance,
        duration: finalElapsed,
        movingTime:
          treadmill.isTreadmill ? finalElapsed : movingTimeSeconds > 0 ? movingTimeSeconds : undefined,
        avgPace: finalAvgPace,
        elevation: finalElevation,
        averageHeartRate: finalAverageHeartRate,
        gpsTrace: finalGpsTrace,
        startedAt: finalStartedAt,
      });

      const resolvedTitle = title.trim() || generateDefaultTitle();
      if (!title.trim()) {
        setTitle(resolvedTitle);
      }

      const activityName = resolvedTitle;
      const activityDescription = `Je viens de terminer ${finalDistance.toFixed(2)} km en ${formatTime(finalElapsed)}.`;
      const postNumericId = Date.now();
      const syntheticRun: RunRow = {
        id: String(postNumericId),
        user_id: user?.id ?? null,
        distance_km: finalDistance,
        duration_seconds: finalElapsed,
        moving_time_seconds: movingTimeSeconds > 0 ? movingTimeSeconds : null,
        elevation_gain: finalElevation,
        average_pace: finalAvgPace,
        average_heartrate: finalAverageHeartRate ?? null,
        gps_trace: finalGpsTrace,
        run_type: treadmill.isTreadmill ? "treadmill" : "run",
        started_at: finalStartedAt,
        title: activityName,
        created_at: new Date().toISOString(),
      };
      const identity = user?.email ?? "Vous";
      const syntheticPost: CommunityPost = {
        id: postNumericId,
        user: identity,
        initials: getInitials(identity),
        time: formatRelativeTime(finalStartedAt),
        type: "run",
        title: activityName,
        description: activityDescription,
        stats: {
          distance: `${finalDistance.toFixed(2)} km`,
          pace: formatSocialPace(finalDistance * 1000, finalElapsed),
          duration: formatSocialDuration(finalElapsed),
          elevation: `+${Math.round(finalElevation)} m`,
        },
        likes: 0,
        comments: 0,
        liked: false,
        gpsTrace: finalGpsTrace,
      };

      setCompletedActivity(syntheticRun);
      setCompletedPost(syntheticPost);
      setShowCompletedActivityDetail(true);

      if (user) {
        setCompletedPostId(null);
        setSaveError("");
      } else {
        setSaveError("Impossible d'enregistrer cette course sans session active.");
      }
    }

    bluetooth.disconnectHardware();
    await stopGpsTracking();
    setStatus("idle");
    setElapsed(0);
    setDistance(0);
    setGpsTrace([]);
    setRollingPaceSecondsPerKm(0);
    lastGpsPointRef.current = null;
    runStartedAtRef.current = null;
    bluetooth.heartRateSamplesRef.current = [];
    bluetooth.resetUiAfterFullStop();
    setGpsError("");
    resetKilometreAnnouncementRefRef.current();
    setRouteProgress(0);
    routeArrivalAnnouncedRef.current = false;
    treadmill.setShowTreadmillCorrection(false);
    treadmill.setCorrectedDistanceKm("");
    resetProgramProgressRef.current();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [
    treadmill.isTreadmill,
    treadmill.showTreadmillCorrection,
    treadmill.correctedDistanceKm,
    treadmill.treadmillSpeedKmh,
    treadmill.setShowTreadmillCorrection,
    treadmill.setCorrectedDistanceKm,
    distance,
    elapsed,
    gpsTrace,
    status,
    title,
    user,
    bluetooth.disconnectHardware,
    bluetooth.resetUiAfterFullStop,
    bluetooth.heartRateSamplesRef,
    stopGpsTracking,
    stopInterval,
    calculateElevationGain,
    formatTime,
    setRunSummary,
    setTitle,
    setCompletedActivity,
    setCompletedPost,
    setShowCompletedActivityDetail,
    setCompletedPostId,
    setSaveError,
    setElapsed,
    setGpsTrace,
    lastGpsPointRef,
    setGpsError,
    resetKilometreAnnouncementRefRef,
    resetProgramProgressRef,
    routeArrivalAnnouncedRef,
    setRollingPaceSecondsPerKm,
  ]);

  return {
    status,
    distance,
    setDistance,
    elapsed,
    pace,
    calories,
    gpsTrace,
    setGpsTrace,
    gpsAccuracy,
    setGpsAccuracy,
    gpsError,
    setGpsError,
    lastGpsPointRef,
    startGpsTracking,
    stopGpsTracking,
    getAccuracyColor,
    formatTime,
    routeProgress,
    setRouteProgress,
    start,
    pause,
    resume,
    stop,
  };
}
