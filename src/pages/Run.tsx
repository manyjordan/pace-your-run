import { ScrollReveal } from "@/components/ScrollReveal";
import { ActivityDetail } from "@/components/ActivityDetail";
import { ActivityPostCard } from "@/components/ActivityPostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Play, Pause, Square, MapPin, Zap, Heart, ChevronUp, AlertCircle, SlidersHorizontal, Volume2, Gauge, ChevronRight,
} from "lucide-react";
import { lazy, Suspense, useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  createPost,
  detectSimultaneousRuns,
  getProfilesByIds,
  saveRun,
  updatePostAudience,
  updatePostDescription,
  updateRunRanWith,
  type RouteRow,
  type RunGpsPoint,
  type RunRow,
} from "@/lib/database";
import {
  connectHeartRateMonitor,
  disconnectHeartRateMonitor,
  isBluetoothAvailable,
  type BluetoothConnection,
} from "@/lib/bluetooth";
import {
  formatDuration as formatSocialDuration,
  formatPaceFromSeconds,
  formatPace as formatSocialPace,
  formatRelativeTime,
  getInitials,
  type CommunityPost,
} from "@/lib/strava";
import { computeMovingTime } from "@/lib/parsers/gpxParser";
import {
  convertDistanceFromKm,
  convertPaceFromMinutesPerKm,
  getDistanceUnitShortLabel,
  getDefaultRunPreferences,
  getSplitDistanceKm,
  loadRunPreferences,
  saveRunPreferences,
  type RunPreferences,
} from "@/lib/runPreferences";
import { clearActiveSession, loadActiveSession, type ActiveSession } from "@/lib/activeSession";

const GPSMap = lazy(() => import("@/components/GPSMap"));
const RouteMap = lazy(() => import("@/components/RouteMap"));

// Haversine formula: calculates distance between two lat/lng points in kilometers
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const OFFLINE_RUNS_KEY = "pace-offline-runs";
const SELECTED_ROUTE_KEY = "pace-selected-route";

function findClosestPointIndex(
  trace: Array<{ lat: number; lng: number }>,
  current: { lat: number; lng: number }
): number {
  let minDist = Infinity;
  let closest = 0;
  for (let i = 0; i < trace.length; i++) {
    const d = Math.sqrt(
      Math.pow(trace[i].lat - current.lat, 2) +
      Math.pow(trace[i].lng - current.lng, 2)
    );
    if (d < minDist) {
      minDist = d;
      closest = i;
    }
  }
  return closest;
}

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

type GPSPoint = RunGpsPoint;

/** Minutes per km over the trace from kilometre (endKm - 1) to endKm; null if GPS data is insufficient. */
function paceMinutesPerKmForLastKm(trace: GPSPoint[], endKm: number): number | null {
  if (trace.length < 2 || endKm < 1) return null;
  let cum = 0;
  let startTime: number | null = null;
  let endTime: number | null = null;
  for (let i = 1; i < trace.length; i++) {
    const prev = trace[i - 1];
    const curr = trace[i];
    cum += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    if (startTime === null && cum >= endKm - 1) {
      startTime = curr.time;
    }
    if (cum >= endKm) {
      endTime = curr.time;
      break;
    }
  }
  if (startTime === null || endTime === null || endTime <= startTime) return null;
  const seconds = (endTime - startTime) / 1000;
  if (seconds <= 0) return null;
  return seconds / 60;
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

function parsePaceToSeconds(pace: string): number {
  const normalizedPace = pace.replace("/km", "").trim();
  const parts = normalizedPace.split(":");
  if (parts.length !== 2) return 0;

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;

  return minutes * 60 + seconds;
}

/* ── Run component ── */
export default function Run() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [postAudience, setPostAudience] = useState<"private" | "friends" | "public">("public");
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isTreadmill, setIsTreadmill] = useState(false);
  const [treadmillSpeedKmh, setTreadmillSpeedKmh] = useState(10);
  const [showTreadmillCorrection, setShowTreadmillCorrection] = useState(false);
  const [correctedDistanceKm, setCorrectedDistanceKm] = useState("");
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteRow | null>(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const [gpsTrace, setGpsTrace] = useState<GPSPoint[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string>("");
  const [title, setTitle] = useState("");
  const [runSummary, setRunSummary] = useState<{
    distance: number;
    duration: number;
    movingTime?: number;
    avgPace: number;
    elevation: number;
    averageHeartRate?: number;
    gpsTrace: GPSPoint[];
    startedAt: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState<string | null>(null);
  const [isConnectingBluetooth, setIsConnectingBluetooth] = useState(false);
  const [bluetoothError, setBluetoothError] = useState("");
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [bluetoothAvailable] = useState(() => isBluetoothAvailable());
  const [runPreferences, setRunPreferences] = useState<RunPreferences>(() => getDefaultRunPreferences());
  const [completedActivity, setCompletedActivity] = useState<RunRow | null>(null);
  const [completedPost, setCompletedPost] = useState<CommunityPost | null>(null);
  const [showCompletedActivityDetail, setShowCompletedActivityDetail] = useState(false);
  const [completedPostId, setCompletedPostId] = useState<string | null>(null);
  const [isUpdatingAudience, setIsUpdatingAudience] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastGpsPointRef = useRef<GPSPoint | null>(null);
  const runStartedAtRef = useRef<string | null>(null);
  const bluetoothConnectionRef = useRef<BluetoothConnection | null>(null);
  const heartRateSamplesRef = useRef<number[]>([]);
  const statusRef = useRef<"idle" | "running" | "paused">("idle");
  /** Preferences snapshot for speech for this run (set in start()). */
  const speechPrefsRef = useRef<RunPreferences>(getDefaultRunPreferences());
  const lastAnnouncedKmRef = useRef(0);
  const postAudienceRef = useRef<"private" | "friends" | "public">("public");
  const routeArrivalAnnouncedRef = useRef(false);
  const lastPaceAlertRef = useRef<number>(0);
  const currentIntervalRepRef = useRef<number>(0);

  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, []);

  const pace = distance > 0 ? elapsed / 60 / distance : 0;
  const formatPace = useCallback(
    (p: number) => (p > 0 ? `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, "0")}` : "--:--"),
    [],
  );
  const distanceUnitShortLabel = getDistanceUnitShortLabel(runPreferences.distanceUnit);
  const splitDistanceKm = getSplitDistanceKm(runPreferences.distanceUnit);
  const displayDistance = convertDistanceFromKm(distance, runPreferences.distanceUnit);
  const displayPace = convertPaceFromMinutesPerKm(pace, runPreferences.distanceUnit);
  const averageHeartRate =
    heartRateSamplesRef.current.length > 0
      ? Math.round(
        heartRateSamplesRef.current.reduce((sum, bpm) => sum + bpm, 0) / heartRateSamplesRef.current.length
      )
      : undefined;
  const truncatedDeviceName =
    bluetoothDevice && bluetoothDevice.length > 15
      ? `${bluetoothDevice.slice(0, 15)}…`
      : bluetoothDevice;
  const isRunActive = status === "running" || status === "paused";
  const hasLiveGpsTrace = gpsTrace.length > 0;

  // GPS accuracy indicator color
  const getAccuracyColor = (accuracy: number | null) => {
    if (accuracy === null) return "bg-gray-400";
    if (accuracy < 10) return "bg-lime-500";
    if (accuracy < 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Start GPS tracking
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS non disponible sur ce navigateur.");
      return false;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords;
        const now = Date.now();

        // Filter out inaccurate points
        if (accuracy > 50) {
          setGpsAccuracy(accuracy);
          return;
        }

        setGpsAccuracy(accuracy);
        setGpsError("");

        const newPoint: GPSPoint = {
          lat: latitude,
          lng: longitude,
          time: now,
          altitude: altitude ?? undefined,
          accuracy,
        };

        // Only add point if user has moved at least 5 meters
        if (lastGpsPointRef.current) {
          const dist = haversineDistance(
            lastGpsPointRef.current.lat,
            lastGpsPointRef.current.lng,
            latitude,
            longitude
          );

          if (dist >= 0.005) { // 5 meters in km
            setDistance((d) => d + dist);
            setGpsTrace((t) => [...t, newPoint]);
            lastGpsPointRef.current = newPoint;
          }
        } else {
          // First point
          setGpsTrace([newPoint]);
          lastGpsPointRef.current = newPoint;
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("GPS non disponible. Activez la localisation pour enregistrer votre course.");
          setStatus("idle");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError("Signal GPS perdu. Vérifiez que vous êtes à l'extérieur.");
        } else if (error.code === error.TIMEOUT) {
          setGpsError("Délai d'attente GPS dépassé.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return true;
  }, []);

  // Stop GPS tracking
  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Timer tick
  const tick = useCallback(() => {
    setElapsed((e) => e + 1);
  }, []);

  // Note: On iOS (Safari), geolocation requires HTTPS
  // This app must be served over HTTPS or from localhost for geolocation to work on iOS

  const resetBluetoothState = useCallback((message = "") => {
    setBluetoothDevice(null);
    setHeartRate(null);
    setIsConnectingBluetooth(false);
    setBluetoothError(message);
    bluetoothConnectionRef.current = null;
  }, []);

  const handleBluetoothDisconnect = useCallback(() => {
    const disconnectMessage =
      statusRef.current === "running" || statusRef.current === "paused"
        ? "Capteur déconnecté. Vérifiez qu'il est toujours allumé et à portée."
        : "";
    resetBluetoothState(disconnectMessage);
  }, [resetBluetoothState]);

  const handleConnectBluetooth = useCallback(async () => {
    if (!bluetoothAvailable) {
      setBluetoothError("Bluetooth non disponible sur cet appareil");
      return;
    }

    setBluetoothError("");
    setIsConnectingBluetooth(true);

    try {
      const connection = await connectHeartRateMonitor();
      bluetoothConnectionRef.current = connection;
      setBluetoothDevice(connection.deviceName);
      setHeartRate(null);

      connection.onHeartRate((bpm) => {
        setHeartRate(bpm);
        if (statusRef.current === "running") {
          heartRateSamplesRef.current = [...heartRateSamplesRef.current, bpm];
        }
      });

      connection.onDisconnect(() => {
        handleBluetoothDisconnect();
      });
    } catch (error) {
      console.error("[Run] operation failed:", error);
      import("@sentry/react")
        .then(({ captureException }) => {
          captureException(error);
        })
        .catch(() => {});
      setBluetoothError("Appareil non trouvé. Vérifiez que votre capteur est allumé.");
      setBluetoothDevice(null);
      setHeartRate(null);
      bluetoothConnectionRef.current = null;
    } finally {
      setIsConnectingBluetooth(false);
    }
  }, [bluetoothAvailable, handleBluetoothDisconnect]);

  const handleDisconnectBluetooth = useCallback(() => {
    disconnectHeartRateMonitor();
    resetBluetoothState("");
  }, [resetBluetoothState]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    setRunPreferences(loadRunPreferences(user?.id));
    setPreferencesLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    saveRunPreferences(runPreferences, user?.id);
  }, [preferencesLoaded, runPreferences, user?.id]);

  useEffect(() => {
    postAudienceRef.current = postAudience;
  }, [postAudience]);

  useEffect(() => {
    const session = loadActiveSession();
    if (!session) return;
    setActiveSession(session);
    setTitle(session.session.type);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SELECTED_ROUTE_KEY);
      if (stored) {
        const route = JSON.parse(stored) as RouteRow;
        setActiveRoute(route);
      }
    } catch {
      // ignore invalid localStorage payload
    }
  }, []);

  useEffect(() => {
    if (status === "running") {
      if (isTreadmill) {
        intervalRef.current = setInterval(tick, 1000);
      } else {
        const startOk = startGpsTracking();
        if (startOk) {
          intervalRef.current = setInterval(tick, 1000);
        }
      }
    } else if (status === "paused") {
      stopGpsTracking();
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else if (status === "idle") {
      stopGpsTracking();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (status === "idle") stopGpsTracking();
    };
  }, [isTreadmill, status, tick, startGpsTracking, stopGpsTracking]);

  useEffect(() => {
    if (!isTreadmill || status !== "running") return;

    const interval = setInterval(() => {
      setDistance((prev) => Number((prev + treadmillSpeedKmh / 3600).toFixed(4)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTreadmill, status, treadmillSpeedKmh]);

  useEffect(() => {
    if (!activeRoute || isTreadmill || gpsTrace.length === 0) return;

    const current = gpsTrace[gpsTrace.length - 1];
    const closestIndex = findClosestPointIndex(activeRoute.gps_trace, current);
    let coveredKm = 0;
    for (let i = 1; i <= closestIndex; i++) {
      coveredKm += haversineDistance(
        activeRoute.gps_trace[i - 1].lat,
        activeRoute.gps_trace[i - 1].lng,
        activeRoute.gps_trace[i].lat,
        activeRoute.gps_trace[i].lng,
      );
    }
    setRouteProgress(Number(coveredKm.toFixed(2)));
  }, [activeRoute, gpsTrace, isTreadmill]);

  useEffect(() => {
    if (!activeRoute || status !== "running" || routeArrivalAnnouncedRef.current) return;
    if (activeRoute.distance_km <= 0) return;

    if (routeProgress >= activeRoute.distance_km * 0.95) {
      routeArrivalAnnouncedRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance("Vous approchez de l'arrivée");
        utterance.lang = "fr-FR";
        utterance.rate = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [activeRoute, routeProgress, status]);

  useEffect(() => {
    return () => {
      disconnectHeartRateMonitor();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Kilometre voice announcements (Web Speech API).
  // iOS Safari only allows speech after a user gesture; tapping Start satisfies that.
  // On iOS, speechSynthesis can be interrupted when the screen locks — limitation of the platform.
  useEffect(() => {
    if (status !== "running") return;

    const prefs = speechPrefsRef.current;
    if (!prefs.announceSplitSpeed && prefs.cumulativeTimeAnnouncement === "off") return;

    const currentKm = Math.floor(distance);
    if (currentKm <= lastAnnouncedKmRef.current) return;

    lastAnnouncedKmRef.current = currentKm;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const messages: string[] = [];

    if (prefs.announceSplitSpeed && currentKm > 0) {
      const splitMinPerKm =
        paceMinutesPerKmForLastKm(gpsTrace, currentKm) ?? (distance > 0 ? elapsed / 60 / distance : 0);
      const paceForUnit = convertPaceFromMinutesPerKm(splitMinPerKm, prefs.distanceUnit);
      const paceMinutes = Math.floor(paceForUnit);
      const paceSeconds = Math.round((paceForUnit % 1) * 60);
      const unit = prefs.distanceUnit === "mi" ? "mile" : "kilomètre";
      const pacePart =
        paceSeconds > 0
          ? `Allure ${paceMinutes} minutes ${paceSeconds} secondes par ${unit}.`
          : `Allure ${paceMinutes} minutes par ${unit}.`;
      messages.push(`Kilomètre ${currentKm}. ${pacePart}`);
    }

    const cumInterval = parseInt(prefs.cumulativeTimeAnnouncement, 10);
    if (!Number.isNaN(cumInterval) && cumInterval > 0 && currentKm % cumInterval === 0) {
      const totalMinutes = Math.floor(elapsed / 60);
      const totalSeconds = elapsed % 60;
      const timePart =
        totalSeconds > 0
          ? `Temps total : ${totalMinutes} minutes ${totalSeconds} secondes.`
          : `Temps total : ${totalMinutes} minutes.`;
      messages.push(timePart);
    }

    if (messages.length === 0) return;

    const utterance = new SpeechSynthesisUtterance(messages.join(" "));
    utterance.lang = "fr-FR";
    utterance.rate = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [distance, elapsed, gpsTrace, status]);

  useEffect(() => {
    if (status !== "running" || !activeSession || pace <= 0) return;

    const prefs = speechPrefsRef.current;
    if (!prefs.paceAlerts) return;

    const now = Date.now();
    const timeSinceLastAlert = (now - lastPaceAlertRef.current) / 1000;
    if (timeSinceLastAlert < 15) return;

    const targetPaceSeconds = parsePaceToSeconds(activeSession.session.pace);
    if (targetPaceSeconds <= 0) return;

    const currentPaceSeconds = pace * 60;
    const diff = currentPaceSeconds - targetPaceSeconds;
    const threshold = prefs.paceAlertThresholdSeconds;
    if (Math.abs(diff) <= threshold) return;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const targetMin = Math.floor(targetPaceSeconds / 60);
    const targetSec = targetPaceSeconds % 60;
    const currentMin = Math.floor(currentPaceSeconds / 60);
    const currentSec = Math.round(currentPaceSeconds % 60);

    const message = diff > 0
      ? `Allure prévue ${targetMin} minutes ${targetSec > 0 ? `${targetSec} secondes` : ""}. Allure actuelle ${currentMin} minutes ${currentSec > 0 ? `${currentSec} secondes` : ""}. Accélérez légèrement.`
      : `Allure prévue ${targetMin} minutes ${targetSec > 0 ? `${targetSec} secondes` : ""}. Allure actuelle ${currentMin} minutes ${currentSec > 0 ? `${currentSec} secondes` : ""}. Ralentissez légèrement.`;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "fr-FR";
    utterance.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    lastPaceAlertRef.current = now;
  }, [activeSession, pace, status]);

  const start = () => {
    if (runSummary || showTreadmillCorrection || completedActivity || completedPost) {
      setIsTreadmill(false);
      setTreadmillSpeedKmh(10);
      setShowTreadmillCorrection(false);
      setCorrectedDistanceKm("");
    }
    setTitle(activeSession?.session.type ?? "");
    setRunSummary(null);
    setCompletedActivity(null);
    setCompletedPost(null);
    setCompletedPostId(null);
    setShowCompletedActivityDetail(false);
    setSaveError("");
    setGpsTrace([]);
    setDistance(0);
    setElapsed(0);
    setGpsAccuracy(null);
    setBluetoothError("");
    heartRateSamplesRef.current = [];
    lastGpsPointRef.current = null;
    runStartedAtRef.current = new Date().toISOString();
    speechPrefsRef.current = loadRunPreferences(user?.id);
    lastAnnouncedKmRef.current = 0;
    lastPaceAlertRef.current = 0;
    currentIntervalRepRef.current = 0;
    setRouteProgress(0);
    routeArrivalAnnouncedRef.current = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStatus("running");
  };

  const pause = () => setStatus("paused");
  const resume = () => setStatus("running");

  const calculateElevationGain = (trace: GPSPoint[]): number => {
    if (trace.length < 2) return 0;
    let gain = 0;
    for (let i = 1; i < trace.length; i++) {
      const diff = (trace[i].altitude ?? 0) - (trace[i - 1].altitude ?? 0);
      if (diff > 0) gain += diff;
    }
    return gain;
  };

  const stop = async () => {
    const finalDistance = isTreadmill && correctedDistanceKm && parseFloat(correctedDistanceKm) > 0
      ? parseFloat(correctedDistanceKm)
      : distance;
    const finalElapsed = elapsed;
    const finalGpsTrace = isTreadmill ? [] : gpsTrace;
    const movingTimeSeconds = isTreadmill ? finalElapsed : computeMovingTime(finalGpsTrace);
    const finalStartedAt = runStartedAtRef.current ?? new Date().toISOString();
    const finalElevation = isTreadmill ? 0 : calculateElevationGain(finalGpsTrace);
    const finalAvgPace = finalDistance > 0 ? finalElapsed / 60 / finalDistance : 0;
    const finalAverageHeartRate =
      heartRateSamplesRef.current.length > 0
        ? Math.round(
          heartRateSamplesRef.current.reduce((sum, bpm) => sum + bpm, 0) / heartRateSamplesRef.current.length
        )
        : undefined;

    if (isTreadmill && !showTreadmillCorrection) {
      disconnectHeartRateMonitor();
      stopGpsTracking();
      if (intervalRef.current) clearInterval(intervalRef.current);
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
      setShowTreadmillCorrection(true);
      setCorrectedDistanceKm("");
      return;
    }

    if (status !== "idle" && finalElapsed > 0 && finalDistance > 0) {
      setRunSummary({
        distance: finalDistance,
        duration: finalElapsed,
        movingTime: isTreadmill ? finalElapsed : movingTimeSeconds > 0 ? movingTimeSeconds : undefined,
        avgPace: finalAvgPace,
        elevation: finalElevation,
        averageHeartRate: finalAverageHeartRate,
        gpsTrace: finalGpsTrace,
        startedAt: finalStartedAt,
      });

      // Set default title when run ends, only if user hasn't typed one
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
        run_type: isTreadmill ? "treadmill" : "run",
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

    disconnectHeartRateMonitor();
    stopGpsTracking();
    setStatus("idle");
    setElapsed(0);
    setDistance(0);
    setGpsTrace([]);
    lastGpsPointRef.current = null;
    runStartedAtRef.current = null;
    heartRateSamplesRef.current = [];
    setBluetoothDevice(null);
    setHeartRate(null);
    setGpsError("");
    setBluetoothError("");
    lastAnnouncedKmRef.current = 0;
    setRouteProgress(0);
    routeArrivalAnnouncedRef.current = false;
    setShowTreadmillCorrection(false);
    setCorrectedDistanceKm("");
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const persistCompletedRun = useCallback(async () => {
    if (!user || !runSummary) return;

    const activityTitle = title.trim() || generateDefaultTitle();
    const description = `Je viens de terminer ${runSummary.distance.toFixed(2)} km en ${formatTime(runSummary.duration)}.`;
    const runData = {
      distance_km: runSummary.distance,
      duration_seconds: runSummary.duration,
      moving_time_seconds: isTreadmill ? runSummary.duration : runSummary.movingTime && runSummary.movingTime > 0 ? runSummary.movingTime : null,
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
      localStorage.removeItem(SELECTED_ROUTE_KEY);
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
  }, [user, runSummary, title, formatTime, isTreadmill, toast]);

  const handleAudienceChange = useCallback(
    async (value: "private" | "friends" | "public") => {
      setPostAudience(value);

      if (!user || !completedPostId) return;

      try {
        setIsUpdatingAudience(true);
        await updatePostAudience(completedPostId, user.id, value);
        window.dispatchEvent(new Event("pace-community-updated"));
      } catch (error) {
        console.error("[Run] operation failed:", error);
        import("@sentry/react")
          .then(({ captureException }) => {
            captureException(error);
          })
          .catch(() => {});
        setSaveError("Impossible de mettre à jour l'audience de cette course.");
      } finally {
        setIsUpdatingAudience(false);
      }
    },
    [completedPostId, user],
  );

  return (
    <div className="space-y-6">
      {completedActivity && showCompletedActivityDetail && (
        <ActivityDetail
          activity={completedActivity}
          onClose={() => setShowCompletedActivityDetail(false)}
          allActivities={[completedActivity]}
          fallbackTrace={completedPost?.gpsTrace}
        />
      )}

      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course</h1>
          <p className="text-sm text-muted-foreground">Enregistrez votre course en temps réel</p>
        </div>
      </ScrollReveal>

      {gpsError && (
        <ScrollReveal>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{gpsError}</p>
          </div>
        </ScrollReveal>
      )}

      {saveError && (
        <ScrollReveal>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{saveError}</p>
          </div>
        </ScrollReveal>
      )}

      <div className="space-y-6">
        {status === "idle" && (
          <ScrollReveal>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between border-accent/30 bg-card/95 px-4 py-6">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <SlidersHorizontal className="h-4 w-4" />
                    Réglages de la course
                  </span>
                  <span className="text-xs text-muted-foreground">Ouvrir</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Réglages de la course</DialogTitle>
                  <DialogDescription>
                    Choisissez vos unités et les annonces vocales avant de démarrer.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Unité de distance</Label>
                    <Select
                      value={runPreferences.distanceUnit}
                      onValueChange={(value) =>
                        setRunPreferences((current) => ({ ...current, distanceUnit: value as "km" | "mi" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une unité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">Kilomètres</SelectItem>
                        <SelectItem value="mi">Miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Annonce vocale de vitesse</p>
                      <p className="text-xs text-muted-foreground">
                        Si activée, vous entendrez{" "}
                        {runPreferences.distanceUnit === "mi"
                          ? "\"mile X, vitesse X mph\" à chaque mile."
                          : "\"km X, vitesse X km/h\" à chaque kilomètre."}
                      </p>
                    </div>
                    <Switch
                      checked={runPreferences.announceSplitSpeed}
                      onCheckedChange={(checked) =>
                        setRunPreferences((current) => ({ ...current, announceSplitSpeed: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Annonce du temps cumulé</Label>
                    <Select
                      value={runPreferences.cumulativeTimeAnnouncement}
                      onValueChange={(value) =>
                        setRunPreferences((current) => ({
                          ...current,
                          cumulativeTimeAnnouncement: value as RunPreferences["cumulativeTimeAnnouncement"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Aucune annonce</SelectItem>
                        <SelectItem value="1">Chaque {runPreferences.distanceUnit === "mi" ? "mile" : "km"}</SelectItem>
                        <SelectItem value="5">Tous les 5 {runPreferences.distanceUnit === "mi" ? "miles" : "km"}</SelectItem>
                        <SelectItem value="10">Tous les 10 {runPreferences.distanceUnit === "mi" ? "miles" : "km"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </ScrollReveal>
        )}

        {status === "idle" && (
          <div className="flex w-full gap-2">
            <button
              onClick={() => setIsTreadmill(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all",
                !isTreadmill
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/50"
              )}
            >
              <MapPin className="h-4 w-4" />
              Course extérieure
            </button>
            <button
              onClick={() => setIsTreadmill(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all",
                isTreadmill
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/50"
              )}
            >
              <Gauge className="h-4 w-4" />
              Tapis roulant
            </button>
          </div>
        )}

        {activeSession && status === "idle" && (
          <div className="space-y-2 rounded-lg border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {activeSession.planName} · Semaine {activeSession.weekNumber}
                </p>
                <p className="text-sm font-semibold">{activeSession.session.type}</p>
              </div>
              <button
                onClick={() => {
                  clearActiveSession();
                  setActiveSession(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Ignorer
              </button>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{activeSession.session.distance} km</span>
              <span>·</span>
              <span>Allure cible : {activeSession.session.pace} /km</span>
              {activeSession.session.intervals && (
                <>
                  <span>·</span>
                  <span>
                    {activeSession.session.intervals.reps} ×{" "}
                    {activeSession.session.intervals.distanceM
                      ? `${activeSession.session.intervals.distanceM}m`
                      : `${activeSession.session.intervals.durationSeconds}s`}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {status === "idle" && (
          <Link
            to="/routes"
            className="flex items-center gap-2 rounded-lg border border-accent/20 bg-card p-4 hover:border-accent/50 transition-colors"
          >
            <MapPin className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-semibold">Mes parcours</p>
              <p className="text-xs text-muted-foreground">Importez et naviguez sur vos parcours GPX</p>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Link>
        )}

        {activeRoute && status === "idle" && (
          <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{activeRoute.name}</p>
              <p className="text-xs text-muted-foreground">
                {activeRoute.distance_km.toFixed(1)} km · {Math.round(activeRoute.elevation_gain)}m D+
              </p>
            </div>
            <button
              onClick={() => {
                setActiveRoute(null);
                localStorage.removeItem(SELECTED_ROUTE_KEY);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Retirer
            </button>
          </div>
        )}

        {!isTreadmill && isRunActive && (
          <ScrollReveal>
            {hasLiveGpsTrace ? (
              <Card className="border-accent/30">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Carte en direct</p>
                      <p className="text-xs text-muted-foreground">Votre tracé GPS se met à jour en temps réel</p>
                    </div>
                    <Badge variant="outline" className="border-accent/40 text-accent">
                      {status === "running" ? "En direct" : "En pause"}
                    </Badge>
                  </div>
                  <Suspense fallback={<div className="h-[220px] rounded-lg bg-muted animate-pulse" />}>
                    {activeRoute ? (
                      <RouteMap
                        referenceTrace={activeRoute.gps_trace}
                        liveTrace={gpsTrace}
                        isLive
                        height={220}
                        progressKm={routeProgress}
                        totalKm={activeRoute.distance_km}
                      />
                    ) : (
                      <GPSMap trace={gpsTrace} isLive height={220} />
                    )}
                  </Suspense>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-accent/30">
                <CardContent className="flex h-[220px] flex-col items-center justify-center gap-4 p-4">
                  <div className="relative flex h-14 w-14 items-center justify-center">
                    <span className="absolute h-14 w-14 animate-ping rounded-full bg-accent/20" />
                    <span className="relative h-5 w-5 rounded-full bg-accent" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-semibold">Acquisition du signal GPS...</p>
                    <p className="text-xs text-muted-foreground">
                      Attendez les premiers points GPS pour afficher la carte en direct.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </ScrollReveal>
        )}

        {isTreadmill && status === "running" && (
          <Card className="border-accent/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Vitesse tapis</p>
                <p className="text-xs text-muted-foreground">
                  {(60 / treadmillSpeedKmh).toFixed(1).replace(".", ":")} /km
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTreadmillSpeedKmh((s) => Math.max(3, Number((s - 0.5).toFixed(1))))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg font-bold hover:border-accent hover:text-accent transition-colors"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-4xl font-black tabular-nums">{treadmillSpeedKmh.toFixed(1)}</span>
                  <span className="ml-1 text-sm text-muted-foreground">km/h</span>
                </div>
                <button
                  onClick={() => setTreadmillSpeedKmh((s) => Math.min(30, Number((s + 0.5).toFixed(1))))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg font-bold hover:border-accent hover:text-accent transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Distance calculée automatiquement depuis la vitesse
              </p>
            </CardContent>
          </Card>
        )}

        <ScrollReveal>
          <Card className="border-accent/30">
            <CardContent className="p-6 flex flex-col items-center space-y-6">
              <div className="text-6xl font-black tracking-tighter tabular-nums text-foreground" style={{ lineHeight: 1.1 }}>
                {formatTime(elapsed)}
              </div>
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Distance
                    {isRunActive && !isTreadmill && (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center"
                              aria-label={
                                gpsAccuracy !== null
                                  ? `Précision GPS : ${Math.round(gpsAccuracy)} m`
                                  : "Précision GPS indisponible"
                              }
                            >
                              <span className={`h-2 w-2 rounded-full ${getAccuracyColor(gpsAccuracy)}`} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Précision GPS : {gpsAccuracy !== null ? `${Math.round(gpsAccuracy)}m` : "--"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {isRunActive && isTreadmill && (
                      <Badge variant="outline" className="border-muted-foreground/30 text-[10px] text-muted-foreground">
                        Mode tapis
                      </Badge>
                    )}
                  </div>
                  {isRunActive && runPreferences.announceSplitSpeed && (
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Volume2 className="h-3 w-3 shrink-0" aria-hidden />
                      <span>Annonces vocales actives</span>
                    </div>
                  )}
                  <div className="text-xl font-bold tabular-nums">{displayDistance.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">{distanceUnitShortLabel}</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Zap className="h-3 w-3" /> Allure</div>
                  <div className="text-xl font-bold tabular-nums">{formatPace(displayPace)}</div>
                  <div className="text-[10px] text-muted-foreground">/{distanceUnitShortLabel}</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Heart className="h-3 w-3" /> Fréquence</div>
                  {bluetoothDevice ? (
                    <>
                      <div className="text-xl font-bold tabular-nums">{heartRate ?? "--"}</div>
                      <div className="text-[10px] text-muted-foreground">bpm</div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-xs font-medium text-muted-foreground text-center">
                        Pas d&apos;information disponible
                      </div>
                      <Link
                        to="/plan?tab=equipment&section=gear"
                        className="text-[10px] text-accent underline underline-offset-2"
                      >
                        Équipement requis pour mesurer la fréquence cardiquage
                      </Link>
                      <p className="mt-1 text-center text-xs text-muted-foreground">
                        Compatible ceintures cardiaques Bluetooth et montres Suunto, Garmin, Polar
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {status === "idle" && (
                  <Button size="lg" onClick={start} className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25">
                    <Play className="h-7 w-7 ml-0.5" />
                  </Button>
                )}
                {status === "running" && (
                  <>
                    <Button size="lg" variant="outline" onClick={() => void stop()} className="h-14 w-14 rounded-full border-destructive text-destructive hover:bg-destructive/10"><Square className="h-5 w-5" /></Button>
                    <Button size="lg" onClick={pause} className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"><Pause className="h-7 w-7" /></Button>
                  </>
                )}
                {status === "paused" && (
                  <>
                    <Button size="lg" variant="outline" onClick={() => void stop()} className="h-14 w-14 rounded-full border-destructive text-destructive hover:bg-destructive/10"><Square className="h-5 w-5" /></Button>
                    <Button size="lg" onClick={resume} className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"><Play className="h-7 w-7 ml-0.5" /></Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {runSummary && status === "idle" && (
          <ScrollReveal>
            <Card className="border-accent/50 bg-accent/10">
              <CardContent className="p-5 space-y-3">
                {isTreadmill && showTreadmillCorrection && (
                  <div className="space-y-4 rounded-lg border border-border/60 bg-background/60 p-3">
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold">Distance calculée</p>
                      <p className="text-3xl font-black tabular-nums">{distance.toFixed(2)} km</p>
                      <p className="text-xs text-muted-foreground">
                        Basée sur {treadmillSpeedKmh} km/h pendant {Math.floor(elapsed / 60)}min
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Corriger la distance si nécessaire
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max="100"
                          value={correctedDistanceKm}
                          onChange={(e) => setCorrectedDistanceKm(e.target.value)}
                          placeholder={distance.toFixed(2)}
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-lg font-bold tabular-nums focus:border-accent focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">km</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Le tapis affiche parfois une distance différente - corrigez si besoin
                      </p>
                    </div>

                    <Button
                      className="w-full bg-accent text-accent-foreground"
                      onClick={() => {
                        if (correctedDistanceKm && parseFloat(correctedDistanceKm) > 0) {
                          setDistance(parseFloat(correctedDistanceKm));
                        }
                        setShowTreadmillCorrection(false);
                        void stop();
                      }}
                    >
                      Confirmer et continuer
                    </Button>
                  </div>
                )}

                {(!isTreadmill || !showTreadmillCorrection) && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">Récapitulatif de performance</h3>
                      <Button variant="outline" size="sm" onClick={() => setShowCompletedActivityDetail(true)}>
                        Ouvrir l'analyse
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {runSummary.averageHeartRate
                        ? `FC moyenne : ${runSummary.averageHeartRate} bpm`
                        : "Connectez une ceinture cardiaque pour mesurer votre FC"}
                    </p>
                    {isSaving && <p className="text-xs text-muted-foreground">Enregistrement en cours...</p>}
                    <div className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold tabular-nums">
                        {formatSocialDuration(runSummary.duration)}
                      </div>
                      <div className="text-xs text-muted-foreground">Temps total</div>
                    </div>
                    {runSummary.movingTime && Math.abs(runSummary.duration - runSummary.movingTime) > 30 ? (
                      <div className="text-center border-l border-border pl-4">
                        <div className="text-2xl font-bold tabular-nums text-accent">
                          {formatSocialDuration(runSummary.movingTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">Temps de course</div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold tabular-nums">
                        {formatPaceFromSeconds(runSummary.duration, runSummary.distance)}
                      </div>
                      <div className="text-xs text-muted-foreground">Allure moyenne</div>
                    </div>
                    {runSummary.movingTime && Math.abs(runSummary.duration - runSummary.movingTime) > 30 ? (
                      <div className="text-center border-l border-border pl-4">
                        <div className="text-lg font-semibold tabular-nums text-accent">
                          {formatPaceFromSeconds(runSummary.movingTime, runSummary.distance)}
                        </div>
                        <div className="text-xs text-muted-foreground">Allure de course</div>
                      </div>
                    ) : null}
                  </div>
                    </div>
                    <div className="space-y-2">
                  <Label htmlFor="run-title">Nom de la course</Label>
                  <Input
                    id="run-title"
                    value={title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTitle(v);
                      setCompletedActivity((a) => (a ? { ...a, title: v } : null));
                      setCompletedPost((p) => (p ? { ...p, title: v } : null));
                    }}
                    placeholder="Nom de votre course"
                    className="border-border"
                  />
                    </div>
                    <div className="space-y-2">
                  <Label>Audience de cette course</Label>
                  <Select value={postAudience} onValueChange={(value) => void handleAudienceChange(value as "private" | "friends" | "public")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir l'audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Moi uniquement</SelectItem>
                      <SelectItem value="friends">Mes amis</SelectItem>
                      <SelectItem value="public">Tout le monde</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {postAudience === "public"
                      ? "Cette course apparaît dans le fil public."
                      : postAudience === "friends"
                        ? "Cette course est masquée du fil public et réservée à l'audience amis."
                        : "Cette course reste visible uniquement par vous."}
                  </p>
                  {isUpdatingAudience ? <p className="text-xs text-muted-foreground">Mise à jour de l'audience...</p> : null}
                    </div>
                    {user && !completedPostId ? (
                      <Button
                        type="button"
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={isSaving}
                        onClick={() => void persistCompletedRun()}
                      >
                        {isSaving ? "Enregistrement…" : "Enregistrer la course"}
                      </Button>
                    ) : null}
                    {completedPost ? <ActivityPostCard post={completedPost} onOpen={() => setShowCompletedActivityDetail(true)} /> : null}
                  </>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {elapsed > 0 && status !== "idle" && (
          <ScrollReveal>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Splits ({distanceUnitShortLabel.toUpperCase()})</h3><ChevronUp className="h-4 w-4 text-muted-foreground" /></div>
                {gpsTrace.length > 0 ? (
                  Array.from({ length: Math.floor(distance / splitDistanceKm) }, (_, i) => {
                    const splitStart = gpsTrace.findIndex((p) => {
                      const d = gpsTrace.slice(0, gpsTrace.indexOf(p) + 1).reduce((acc, curr, idx) => {
                        if (idx === 0) return 0;
                        return acc + haversineDistance(gpsTrace[idx - 1].lat, gpsTrace[idx - 1].lng, curr.lat, curr.lng);
                      }, 0);
                      return d >= i * splitDistanceKm;
                    });
                    const splitEnd = gpsTrace.findIndex((p) => {
                      const d = gpsTrace.slice(0, gpsTrace.indexOf(p) + 1).reduce((acc, curr, idx) => {
                        if (idx === 0) return 0;
                        return acc + haversineDistance(gpsTrace[idx - 1].lat, gpsTrace[idx - 1].lng, curr.lat, curr.lng);
                      }, 0);
                      return d >= (i + 1) * splitDistanceKm;
                    });

                    if (splitStart >= 0 && splitEnd > splitStart) {
                      const splitTime = (gpsTrace[splitEnd].time - gpsTrace[splitStart].time) / 1000;
                      const splitPace = (splitTime / 60) / splitDistanceKm;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                          <span className="text-muted-foreground">
                            {runPreferences.distanceUnit === "mi" ? "Mile" : "Km"} {i + 1}
                          </span>
                          <span className="font-bold tabular-nums">{formatPace(convertPaceFromMinutesPerKm(splitPace, runPreferences.distanceUnit))}</span>
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">Attendez les données GPS...</p>
                )}
                {Math.floor(distance / splitDistanceKm) === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Le premier split apparaîtra à 1 {runPreferences.distanceUnit === "mi" ? "mile" : "km"}
                  </p>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

      </div>
    </div>
  );
}
