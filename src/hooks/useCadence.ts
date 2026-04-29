import { useRef, useState, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function useCadence(isRunning: boolean) {
  const [cadence, setCadence] = useState<number>(0);
  const windowStepsRef = useRef<Array<{ time: number }>>([]);
  const listenerRef = useRef<(() => void) | null>(null);

  const startCadenceTracking = useCallback(() => {
    windowStepsRef.current = [];
    setCadence(0);

    if (typeof window === "undefined") return;
    if (!Capacitor.isNativePlatform() && !("DeviceMotionEvent" in window)) return;

    const GRAVITY = 9.81;
    const STEP_THRESHOLD = 1.2;
    const MIN_STEP_INTERVAL = 250;
    let lastStepTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const magnitude = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2) / GRAVITY;
      const now = Date.now();

      if (magnitude > STEP_THRESHOLD && now - lastStepTime > MIN_STEP_INTERVAL) {
        lastStepTime = now;
        windowStepsRef.current.push({ time: now });

        const cutoff = now - 30_000;
        windowStepsRef.current = windowStepsRef.current.filter((step) => step.time > cutoff);

        const firstStepTime = windowStepsRef.current[0]?.time;
        if (!firstStepTime) return;

        const windowSec = Math.min(30, (now - firstStepTime) / 1000);
        if (windowSec > 3) {
          const spm = Math.round((windowStepsRef.current.length / windowSec) * 60 * 2);
          if (spm >= 100 && spm <= 220) setCadence(spm);
        }
      }
    };

    const motionEvent = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    if (typeof motionEvent.requestPermission === "function") {
      void motionEvent
        .requestPermission()
        .then((permission) => {
          if (permission === "granted") {
            window.addEventListener("devicemotion", handleMotion);
            listenerRef.current = () => window.removeEventListener("devicemotion", handleMotion);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener("devicemotion", handleMotion);
      listenerRef.current = () => window.removeEventListener("devicemotion", handleMotion);
    }
  }, []);

  const stopCadenceTracking = useCallback(() => {
    listenerRef.current?.();
    listenerRef.current = null;
    setCadence(0);
  }, []);

  useEffect(() => {
    if (isRunning) startCadenceTracking();
    else stopCadenceTracking();
    return stopCadenceTracking;
  }, [isRunning, startCadenceTracking, stopCadenceTracking]);

  return { cadence };
}
