import { useState, useRef, useCallback } from "react";
import type { RunGpsPoint } from "@/lib/database";
import { haversineDistanceKm } from "@/lib/parsers/gpxParser";

type UseGpsTrackingOptions = {
  onPermissionDenied?: () => void;
  onDistanceDelta: (deltaKm: number) => void;
};

export function useGpsTracking({ onPermissionDenied, onDistanceDelta }: UseGpsTrackingOptions) {
  const [gpsTrace, setGpsTrace] = useState<RunGpsPoint[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const lastGpsPointRef = useRef<RunGpsPoint | null>(null);

  const startGpsTracking = useCallback((): boolean => {
    if (!navigator.geolocation) {
      setGpsError("GPS non disponible sur ce navigateur.");
      return false;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords;
        const now = Date.now();

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
      (error) => {
        console.error("Geolocation error:", error);
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
  }, [onDistanceDelta, onPermissionDenied]);

  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
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
