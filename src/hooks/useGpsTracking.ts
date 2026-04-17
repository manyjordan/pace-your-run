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
  const watchIdRef = useRef<WatchId | null>(null);
  const lastGpsPointRef = useRef<RunGpsPoint | null>(null);
  const watchEpochRef = useRef(0);

  const applyPosition = useCallback(
    (latitude: number, longitude: number, accuracy: number, altitude: number | null | undefined, now: number) => {
      if (accuracy > 50) {
        setGpsAccuracy(accuracy);
        return;
      }

      setGpsAccuracy(accuracy);
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
          setGpsTrace((t) => [...t, newPoint]);
          lastGpsPointRef.current = newPoint;
        }
      } else {
        setGpsTrace([newPoint]);
        lastGpsPointRef.current = newPoint;
      }
    },
    [onDistanceDelta],
  );

  const startGpsTracking = useCallback(async (): Promise<boolean> => {
    const epoch = ++watchEpochRef.current;

    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        const perm = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
        if (perm.location === "denied") {
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
  }, [applyPosition, onPermissionDenied]);

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
    lastGpsPointRef,
    startGpsTracking,
    stopGpsTracking,
    getAccuracyColor,
  };
}
