import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, Square, MapPin, Zap, Heart, ChevronUp, AlertCircle, Bluetooth, Loader2, X,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createPost, saveRun, type RunGpsPoint } from "@/lib/database";
import {
  connectHeartRateMonitor,
  disconnectHeartRateMonitor,
  isBluetoothAvailable,
  type BluetoothConnection,
} from "@/lib/bluetooth";

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

/* ── Run component ── */
export default function Run() {
  const { user } = useAuth();
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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastGpsPointRef = useRef<GPSPoint | null>(null);
  const runStartedAtRef = useRef<string | null>(null);
  const bluetoothConnectionRef = useRef<BluetoothConnection | null>(null);
  const heartRateSamplesRef = useRef<number[]>([]);
  const statusRef = useRef<"idle" | "running" | "paused">("idle");

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const pace = distance > 0 ? elapsed / 60 / distance : 0;
  const formatPace = (p: number) =>
    p > 0 ? `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, "0")}` : "--:--";
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
    };
  }, []);

  const start = () => {
    setRunSummary(null);
    setSaveError("");
    setGpsTrace([]);
    setDistance(0);
    setElapsed(0);
    setGpsAccuracy(null);
    setBluetoothError("");
    heartRateSamplesRef.current = [];
    lastGpsPointRef.current = null;
    runStartedAtRef.current = new Date().toISOString();
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

      if (user) {
        try {
          setIsSaving(true);
          setSaveError("");

          const title = "Nouvelle course enregistrée";
          const description = `Je viens de terminer ${finalDistance.toFixed(2)} km en ${formatTime(finalElapsed)}.`;

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

          await createPost(user.id, savedRun.id, title, description);
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
  };

  return (
    <div className="space-y-6">
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

      {bluetoothError && (
        <ScrollReveal delay={0.05}>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{bluetoothError}</p>
          </div>
        </ScrollReveal>
      )}

      <div className="space-y-6">
        {status === "idle" && (
          <ScrollReveal delay={0.04}>
            <Card className="border-accent/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Capteur cardiaque Bluetooth</p>
                    {!bluetoothAvailable ? (
                      <p className="text-xs text-muted-foreground">Bluetooth non disponible sur cet appareil</p>
                    ) : bluetoothDevice ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-lime-500" />
                        <span>{bluetoothDevice}</span>
                        <span>Connecté</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Connectez votre ceinture ou brassard BLE avant de démarrer.
                      </p>
                    )}
                  </div>

                  {bluetoothDevice ? (
                    <Button variant="outline" onClick={handleDisconnectBluetooth}>
                      Déconnecter
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => void handleConnectBluetooth()}
                      disabled={isConnectingBluetooth || !bluetoothAvailable}
                      className="border-accent/40"
                    >
                      {isConnectingBluetooth ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recherche d'appareils...
                        </>
                      ) : (
                        <>
                          <Bluetooth className="mr-2 h-4 w-4" />
                          Connecter un capteur cardiaque
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.05}>
          <Card className="border-accent/30">
            <CardContent className="p-6 flex flex-col items-center space-y-6">
              {(status === "running" || status === "paused") && bluetoothDevice && (
                <div className="flex w-full justify-center">
                  <Badge variant="outline" className="flex items-center gap-2 border-accent/40 px-3 py-1.5">
                    <span className="max-w-[110px] truncate">{truncatedDeviceName}</span>
                    <Heart className="h-3.5 w-3.5 animate-pulse text-red-500" />
                    <span className="font-bold tabular-nums">{heartRate ?? "--"} bpm</span>
                    <button
                      type="button"
                      onClick={handleDisconnectBluetooth}
                      className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Déconnecter le capteur"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                </div>
              )}

              <div className="text-6xl font-black tracking-tighter tabular-nums text-foreground" style={{ lineHeight: 1.1 }}>
                {formatTime(elapsed)}
              </div>
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Distance
                    {status === "running" && (
                      <div className={`w-2 h-2 rounded-full ${getAccuracyColor(gpsAccuracy)}`} />
                    )}
                  </div>
                  <div className="text-xl font-bold tabular-nums">{distance.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">km</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Zap className="h-3 w-3" /> Allure</div>
                  <div className="text-xl font-bold tabular-nums">{formatPace(pace)}</div>
                  <div className="text-[10px] text-muted-foreground">/km</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Heart className="h-3 w-3" /> Fréquence</div>
                  <div className="text-xl font-bold tabular-nums">{heartRate ?? "--"}</div>
                  <div className="text-[10px] text-muted-foreground">bpm</div>
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
                <h3 className="text-sm font-semibold">Résumé de la course</h3>
                {isSaving && <p className="text-xs text-muted-foreground">Enregistrement en cours...</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-lg font-bold">{runSummary.distance.toFixed(2)} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Durée</p>
                    <p className="text-lg font-bold">{formatTime(runSummary.duration)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Allure moyenne</p>
                    <p className="text-lg font-bold">{formatPace(runSummary.avgPace)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Dénivelé</p>
                    <p className="text-lg font-bold">+{Math.round(runSummary.elevation)} m</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">FC moyenne</p>
                    <p className="text-lg font-bold">{runSummary.averageHeartRate ?? "--"} bpm</p>
                  </div>
                </div>
                {runSummary.gpsTrace.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">Points GPS enregistrés: {runSummary.gpsTrace.length}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {elapsed > 0 && status !== "idle" && (
          <ScrollReveal delay={0.1}>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Splits (Km)</h3><ChevronUp className="h-4 w-4 text-muted-foreground" /></div>
                {gpsTrace.length > 0 ? (
                  Array.from({ length: Math.floor(distance) }, (_, i) => {
                    const splitStart = gpsTrace.findIndex((p) => {
                      const d = gpsTrace.slice(0, gpsTrace.indexOf(p) + 1).reduce((acc, curr, idx) => {
                        if (idx === 0) return 0;
                        return acc + haversineDistance(gpsTrace[idx - 1].lat, gpsTrace[idx - 1].lng, curr.lat, curr.lng);
                      }, 0);
                      return d >= i * 1;
                    });
                    const splitEnd = gpsTrace.findIndex((p) => {
                      const d = gpsTrace.slice(0, gpsTrace.indexOf(p) + 1).reduce((acc, curr, idx) => {
                        if (idx === 0) return 0;
                        return acc + haversineDistance(gpsTrace[idx - 1].lat, gpsTrace[idx - 1].lng, curr.lat, curr.lng);
                      }, 0);
                      return d >= (i + 1) * 1;
                    });

                    if (splitStart >= 0 && splitEnd > splitStart) {
                      const splitTime = (gpsTrace[splitEnd].time - gpsTrace[splitStart].time) / 1000;
                      const splitPace = splitTime / 60;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                          <span className="text-muted-foreground">Km {i + 1}</span>
                          <span className="font-bold tabular-nums">{formatPace(splitPace)}</span>
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">Attendez les données GPS...</p>
                )}
                {Math.floor(distance) === 0 && <p className="text-xs text-muted-foreground text-center py-2">Le premier split apparaîtra à 1 km</p>}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

      </div>
    </div>
  );
}
