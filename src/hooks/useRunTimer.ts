import { useState, useRef, useCallback, useEffect, type SetStateAction } from "react";
import { Capacitor } from "@capacitor/core";
import { logger } from "@/lib/logger";

export function useRunTimer() {
  const [elapsed, internalSetElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef<number>(0);

  const setElapsed = useCallback((value: SetStateAction<number>) => {
    internalSetElapsed((previous) => {
      const next = typeof value === "function" ? value(previous) : value;
      pausedElapsedRef.current = next;
      return next;
    });
  }, []);

  const startKeepAlive = useCallback(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume().catch(() => {});
      }
      return;
    }
    try {
      const ctx = new AudioContext();
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.00001;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 1;
      oscillator.start();
      audioContextRef.current = ctx;
      oscillatorRef.current = oscillator;
    } catch (e) {
      logger.error("AudioContext keepalive failed", e);
      void audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
      oscillatorRef.current = null;
    }
  }, []);

  const stopKeepAlive = useCallback(() => {
    try {
      oscillatorRef.current?.stop();
    } catch {
      /* already stopped */
    }
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    oscillatorRef.current = null;
  }, []);

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return;
    const elapsedSeconds =
      pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
    internalSetElapsed(elapsedSeconds);
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    startTimeRef.current = Date.now();
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const stopInterval = useCallback(() => {
    if (startTimeRef.current !== null) {
      pausedElapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      startTimeRef.current = null;
      internalSetElapsed(pausedElapsedRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopKeepAlive();
  }, [stopKeepAlive]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && audioContextRef.current?.state === "suspended") {
        void audioContextRef.current.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopKeepAlive();
      startTimeRef.current = null;
    };
  }, [stopKeepAlive]);

  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, []);

  return {
    elapsed,
    setElapsed,
    intervalRef,
    tick,
    startInterval,
    stopInterval,
    startKeepAlive,
    formatTime,
  };
}
