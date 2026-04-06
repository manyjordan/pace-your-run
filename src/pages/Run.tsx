import { ScrollReveal } from "@/components/ScrollReveal";
import { ActivityDetail } from "@/components/ActivityDetail";
import { ActivityPostCard } from "@/components/ActivityPostCard";
import GPSMap from "@/components/GPSMap";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Play, Pause, Square, MapPin, Zap, Heart, ChevronUp, AlertCircle, SlidersHorizontal,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createPost, saveRun, updatePostAudience, type RunGpsPoint } from "@/lib/database";
import {
  connectHeartRateMonitor,
  disconnectHeartRateMonitor,
  isBluetoothAvailable,
  type BluetoothConnection,
} from "@/lib/bluetooth";
import {
  formatDuration as formatSocialDuration,
  formatPace as formatSocialPace,
  formatRelativeTime,
  getInitials,
  type CommunityPost,
  type StravaActivity,
} from "@/lib/strava";
import {
  convertDistanceFromKm,
  convertPaceFromMinutesPerKm,
  convertSpeedFromKmPerHour,
  getDistanceUnitShortLabel,
  getDefaultRunPreferences,
  getSplitDistanceKm,
  getSpeedUnitLabel,
  loadRunPreferences,
  saveRunPreferences,
  type RunPreferences,
} from "@/lib/runPreferences";

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

type GPSPoint = RunGpsPoint;

function buildSyntheticSplits(trace: GPSPoint[], totalDistanceKm: number, averageHeartRate?: number) {
  if (trace.length < 2 || totalDistanceKm < 1) return [];

  const cumulativeDistances: number[] = [];
  let total = 0;

  for (let index = 0; index < trace.length; index += 1) {
    if (index === 0) {
      cumulativeDistances.push(0);
      continue;
    }

    total += haversineDistance(trace[index - 1].lat, trace[index - 1].lng, trace[index].lat, trace[index].lng);
    cumulativeDistances.push(total);
  }

  const splits = [];
  let splitStartIndex = 0;

  for (let split = 1; split <= Math.floor(totalDistanceKm); split += 1) {
    const splitEndIndex = cumulativeDistances.findIndex((distanceKm) => distanceKm >= split);
    if (splitEndIndex <= splitStartIndex) continue;

    const splitSeconds = Math.max(1, Math.round((trace[splitEndIndex].time - trace[splitStartIndex].time) / 1000));
    const startAltitude = trace[splitStartIndex].altitude;
    const endAltitude = trace[splitEndIndex].altitude;

    splits.push({
      split,
      distance: 1000,
      elapsed_time: splitSeconds,
      moving_time: splitSeconds,
      average_speed: 1000 / splitSeconds,
      average_heartrate: averageHeartRate,
      elevation_difference:
        typeof startAltitude === "number" && typeof endAltitude === "number"
          ? endAltitude - startAltitude
          : 0,
    });

    splitStartIndex = splitEndIndex;
  }

  return splits;
}

/* ── Run component ── */
export default function Run() {
  const { user } = useAuth();
  const [postAudience, setPostAudience] = useState<"private" | "friends" | "public">("public");
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gpsTrace, setGpsTrace] = useState<GPSPoint[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string>("");
  const [runSummary, setRunSummary] = useState<{
    distance: number;
    duration: number;
    avgPace: number;
    elevation: number;
    averageHeartRate?: number;
    gpsTrace: GPSPoint[];
  } | null>(null);
  const [saveError, setSaveError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState<string | null>(null);
  const [isConnectingBluetooth, setIsConnectingBluetooth] = useState(false);
  const [bluetoothError, setBluetoothError] = useState("");
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [bluetoothAvailable] = useState(() => isBluetoothAvailable());
  const [runPreferences, setRunPreferences] = useState<RunPreferences>(() => getDefaultRunPreferences());
  const [completedActivity, setCompletedActivity] = useState<StravaActivity | null>(null);
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
  const nextSplitAnnouncementRef = useRef(1);
  const lastSplitAnnouncementElapsedRef = useRef(0);
  const nextCumulativeAnnouncementRef = useRef<number | null>(null);
  const postAudienceRef = useRef<"private" | "friends" | "public">("public");

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
  const speedUnitLabel = getSpeedUnitLabel(runPreferences.distanceUnit);
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

  const announce = useCallback((message: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "fr-FR";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

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
    } catch {
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
    if (status === "running") {
      const startOk = startGpsTracking();
      if (startOk) {
        intervalRef.current = setInterval(tick, 1000);
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
  }, [status, tick, startGpsTracking, stopGpsTracking]);

  useEffect(() => {
    return () => {
      disconnectHeartRateMonitor();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "running") return;

    const currentDistanceInPreferredUnit = convertDistanceFromKm(distance, runPreferences.distanceUnit);

    while (runPreferences.announceSplitSpeed && currentDistanceInPreferredUnit >= nextSplitAnnouncementRef.current) {
      const splitElapsed = elapsed - lastSplitAnnouncementElapsedRef.current;
      const splitSpeedKmPerHour = splitElapsed > 0 ? (splitDistanceKm / splitElapsed) * 3600 : 0;
      const announcedSpeed = convertSpeedFromKmPerHour(splitSpeedKmPerHour, runPreferences.distanceUnit)
        .toFixed(1)
        .replace(".", ",");
      const unitKeyword = runPreferences.distanceUnit === "mi" ? "mile" : "km";

      announce(`${unitKeyword} ${nextSplitAnnouncementRef.current}, vitesse ${announcedSpeed}${speedUnitLabel}`);
      lastSplitAnnouncementElapsedRef.current = elapsed;
      nextSplitAnnouncementRef.current += 1;
    }

    const cumulativeInterval =
      runPreferences.cumulativeTimeAnnouncement === "off"
        ? null
        : Number(runPreferences.cumulativeTimeAnnouncement);

    if (!cumulativeInterval) {
      nextCumulativeAnnouncementRef.current = null;
      return;
    }

    if (nextCumulativeAnnouncementRef.current === null) {
      nextCumulativeAnnouncementRef.current = cumulativeInterval;
    }

    while (
      nextCumulativeAnnouncementRef.current !== null &&
      currentDistanceInPreferredUnit >= nextCumulativeAnnouncementRef.current
    ) {
      const unitKeyword = runPreferences.distanceUnit === "mi" ? "mile" : "km";
      announce(`${unitKeyword} ${nextCumulativeAnnouncementRef.current}, temps cumulé ${formatTime(elapsed)}`);
      nextCumulativeAnnouncementRef.current += cumulativeInterval;
    }
  }, [announce, distance, elapsed, formatTime, runPreferences, speedUnitLabel, splitDistanceKm, status]);

  const start = () => {
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
    nextSplitAnnouncementRef.current = 1;
    lastSplitAnnouncementElapsedRef.current = 0;
    nextCumulativeAnnouncementRef.current =
      runPreferences.cumulativeTimeAnnouncement === "off"
        ? null
        : Number(runPreferences.cumulativeTimeAnnouncement);
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
    const finalDistance = distance;
    const finalElapsed = elapsed;
    const finalGpsTrace = gpsTrace;
    const finalStartedAt = runStartedAtRef.current ?? new Date().toISOString();
    const finalElevation = calculateElevationGain(finalGpsTrace);
    const finalAvgPace = finalDistance > 0 ? finalElapsed / 60 / finalDistance : 0;
    const finalAverageHeartRate =
      heartRateSamplesRef.current.length > 0
        ? Math.round(
          heartRateSamplesRef.current.reduce((sum, bpm) => sum + bpm, 0) / heartRateSamplesRef.current.length
        )
        : undefined;

    if (status !== "idle" && finalElapsed > 0 && finalDistance > 0) {
      setRunSummary({
        distance: finalDistance,
        duration: finalElapsed,
        avgPace: finalAvgPace,
        elevation: finalElevation,
        averageHeartRate: finalAverageHeartRate,
        gpsTrace: finalGpsTrace,
      });

      const activityName = "Nouvelle course enregistrée";
      const activityDescription = `Je viens de terminer ${finalDistance.toFixed(2)} km en ${formatTime(finalElapsed)}.`;
      const syntheticActivity: StravaActivity = {
        id: Date.now(),
        name: activityName,
        distance: finalDistance * 1000,
        moving_time: finalElapsed,
        elapsed_time: finalElapsed,
        total_elevation_gain: finalElevation,
        average_heartrate: finalAverageHeartRate,
        start_date: finalStartedAt,
        type: "Run",
        sport_type: "Run",
        splits_metric: buildSyntheticSplits(finalGpsTrace, finalDistance, finalAverageHeartRate),
      };
      const identity = user?.email ?? "Vous";
      const syntheticPost: CommunityPost = {
        id: syntheticActivity.id,
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

      setCompletedActivity(syntheticActivity);
      setCompletedPost(syntheticPost);
      setShowCompletedActivityDetail(true);

      if (user) {
        try {
          setIsSaving(true);
          setSaveError("");

          const title = activityName;
          const description = activityDescription;

          const savedRun = await saveRun(user.id, {
            distance_km: finalDistance,
            duration_seconds: finalElapsed,
            average_pace: finalAvgPace,
            average_heartrate: finalAverageHeartRate ?? null,
            elevation_gain: finalElevation,
            gps_trace: finalGpsTrace,
            run_type: "run",
            started_at: runStartedAtRef.current,
            title,
          });

          const createdPost = await createPost(user.id, savedRun.id, title, description, postAudienceRef.current);
          setCompletedPostId(createdPost.id);
          window.dispatchEvent(new Event("pace-community-updated"));
        } catch {
          setSaveError("Impossible d'enregistrer cette course pour le moment.");
        } finally {
          setIsSaving(false);
        }
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
    nextSplitAnnouncementRef.current = 1;
    lastSplitAnnouncementElapsedRef.current = 0;
    nextCumulativeAnnouncementRef.current = null;
  };

  const handleAudienceChange = useCallback(
    async (value: "private" | "friends" | "public") => {
      setPostAudience(value);

      if (!user || !completedPostId) return;

      try {
        setIsUpdatingAudience(true);
        await updatePostAudience(completedPostId, user.id, value);
        window.dispatchEvent(new Event("pace-community-updated"));
      } catch {
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
        <ScrollReveal delay={0.05}>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{gpsError}</p>
          </div>
        </ScrollReveal>
      )}

      {saveError && (
        <ScrollReveal delay={0.05}>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{saveError}</p>
          </div>
        </ScrollReveal>
      )}

      <div className="space-y-6">
        {status === "idle" && (
          <ScrollReveal delay={0.04}>
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

        {isRunActive && (
          <ScrollReveal delay={0.045}>
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
                  <GPSMap trace={gpsTrace} isLive height={220} />
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

        <ScrollReveal delay={0.05}>
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
                    {isRunActive && (
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
                  </div>
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
                        Équipement requis : ceinture Bluetooth
                      </Link>
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
          <ScrollReveal delay={0.1}>
            <Card className="border-accent/50 bg-accent/10">
              <CardContent className="p-5 space-y-3">
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
                {completedPost ? <ActivityPostCard post={completedPost} onOpen={() => setShowCompletedActivityDetail(true)} /> : null}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {elapsed > 0 && status !== "idle" && (
          <ScrollReveal delay={0.1}>
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
