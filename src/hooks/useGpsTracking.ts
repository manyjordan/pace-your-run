import { useState, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import type { RunGpsPoint } from "@/lib/database";
import { logger } from "@/lib/logger";
import { haversineDistanceKm } from "@/lib/parsers/gpxParser";

type UseGpsTrackingOptions = {
  onPermissionDenied?: () => void;
  onDistanceDelta: (deltaKm: number) => void;
};

type WatchId = string | number;

export function useGpsTracking({ onPermissionDenied, onDistanceDelta }: UseGpsTrackingOptions) {
  const [gpsTrace, setGpsTrace] = useState<RunGpsPoint[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [rollingPaceSecondsPerKm, setRollingPaceSecondsPerKm] = useState(0);
  const watchIdRef = useRef<WatchId | null>(null);
  const lastGpsPointRef = useRef<RunGpsPoint | null>(null);
  const watchEpochRef = useRef(0);

  const calculateRollingPace = useCallback((points: RunGpsPoint[]): number => {
    if (points.length < 2) return 0;
    const windowMs = 15_000;
    const now = points[points.length - 1].time;
    const windowPoints = points.filter((p) => now - p.time <= windowMs);
    if (windowPoints.length < 2) return 0;

    const first = windowPoints[0];
    const last = windowPoints[windowPoints.length - 1];
    const distKm = haversineDistanceKm(
      { lat: first.lat, lng: first.lng },
      { lat: last.lat, lng: last.lng },
    );
    const timeSec = (last.time - first.time) / 1000;
    if (distKm < 0.001 || timeSec <= 0) return 0;
    return timeSec / distKm;
  }, []);

  const requestLocationPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      const { Geolocation } = await import("@capacitor/geolocation");

      const current = await Geolocation.checkPermissions();

      if (current.location === "granted") return current;

      return await Geolocation.requestPermissions({
        permissions: ["location", "coarseLocation"],
      });
    } catch (e) {
      logger.error("Location permission request failed", e);
      return null;
    }
  }, []);

  const applyPosition = useCallback(
    (latitude: number, longitude: number, accuracy: number, altitude: number | null | undefined, now: number) => {
      setGpsAccuracy(accuracy);

      const isFirstPoint = lastGpsPointRef.current === null;
      if (!isFirstPoint && accuracy > 50) {
        return;
      }

      setGpsError("");

      const newPoint: RunGpsPoint = {
        lat: latitude,
        lng: longitude,
        time: now,
        altitude: altitude ?? undefined,
        accuracy,
      };

      if (lastGpsPointRef.current) {
        const dist = haversineDistanceKm(
          { lat: lastGpsPointRef.current.lat, lng: lastGpsPointRef.current.lng },
          { lat: latitude, lng: longitude },
        );

        if (dist >= 0.005) {
          onDistanceDelta(dist);
          setGpsTrace((t) => {
            const nextTrace = [...t, newPoint];
            setRollingPaceSecondsPerKm(calculateRollingPace(nextTrace));
            return nextTrace;
          });
          lastGpsPointRef.current = newPoint;
        }
      } else {
        setGpsTrace([newPoint]);
        setRollingPaceSecondsPerKm(0);
        lastGpsPointRef.current = newPoint;
      }
    },
    [calculateRollingPace, onDistanceDelta],
  );

  const startGpsTracking = useCallback(async (): Promise<boolean> => {
    const epoch = ++watchEpochRef.current;

    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        const perm = await requestLocationPermission();
        if (!perm || perm.location === "denied") {
          setGpsError("GPS non disponible. Activez la localisation pour enregistrer votre course.");
          onPermissionDenied?.();
          return false;
        }

        if (epoch !== watchEpochRef.current) return false;

        const watchOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        };

        const callbackId = await Geolocation.watchPosition(watchOptions, (position, err) => {
          if (epoch !== watchEpochRef.current) return;
          if (err) {
            logger.error("Geolocation error", err);
            return;
          }
          if (!position) return;
          const { latitude, longitude, accuracy, altitude } = position.coords;
          applyPosition(latitude, longitude, accuracy, altitude, Date.now());
        });

        if (epoch !== watchEpochRef.current) {
          await Geolocation.clearWatch({ id: callbackId });
          return false;
        }

        watchIdRef.current = callbackId;
        return true;
      } catch (e) {
        logger.error("Native geolocation start failed", e);
        setGpsError("Impossible de démarrer le suivi GPS.");
        return false;
      }
    }

    if (!navigator.geolocation) {
      setGpsError("GPS non disponible sur ce navigateur.");
      return false;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (epoch !== watchEpochRef.current) return;
        const { latitude, longitude, accuracy, altitude } = position.coords;
        applyPosition(latitude, longitude, accuracy, altitude, Date.now());
      },
      (error) => {
        logger.error("Geolocation error", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("GPS non disponible. Activez la localisation pour enregistrer votre course.");
          onPermissionDenied?.();
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
      },
    );

    return true;
  }, [applyPosition, onPermissionDenied, requestLocationPermission]);

  const stopGpsTracking = useCallback(async () => {
    watchEpochRef.current += 1;
    const id = watchIdRef.current;
    watchIdRef.current = null;

    if (id === null) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        await Geolocation.clearWatch({ id: String(id) });
      } catch (e) {
        logger.error("Native geolocation clearWatch failed", e);
      }
      return;
    }

    navigator.geolocation.clearWatch(id as number);
  }, []);

  const getAccuracyColor = useCallback((accuracy: number | null) => {
    if (accuracy === null) return "bg-gray-400";
    if (accuracy < 10) return "bg-lime-500";
    if (accuracy < 30) return "bg-yellow-500";
    return "bg-red-500";
  }, []);

  return {
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
  };
}
