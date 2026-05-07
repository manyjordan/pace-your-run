import { useState, useRef, useCallback, useEffect, type SetStateAction } from "react";
import { Capacitor } from "@capacitor/core";
import { logger } from "@/lib/logger";

export function useRunTimer() {
  const [elapsed, internalSetElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const keepAliveSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const keepAliveEnabledRef = useRef(false);
  const wakeLockRef = useRef<{
    release: () => Promise<void>;
    addEventListener: (type: string, listener: () => void) => void;
  } | null>(null);
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
      keepAliveEnabledRef.current = true;
      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume().catch(() => {});
      }
      return;
    }
    try {
      const ctx = new AudioContext();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      keepAliveEnabledRef.current = true;

      const playBuffer = () => {
        if (!keepAliveEnabledRef.current || !audioContextRef.current) return;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.001;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.onended = () => {
          if (!keepAliveEnabledRef.current) return;
          playBuffer();
        };
        keepAliveSourceRef.current = source;
        source.start();
      };

      if (ctx.state === "suspended") {
        void ctx.resume().catch(() => {});
      }
      audioContextRef.current = ctx;
      playBuffer();
    } catch (e) {
      logger.error("AudioContext keepalive failed", e);
      keepAliveEnabledRef.current = false;
      try {
        keepAliveSourceRef.current?.stop();
      } catch {
        /* already stopped */
      }
      keepAliveSourceRef.current = null;
      void audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const stopKeepAlive = useCallback(() => {
    keepAliveEnabledRef.current = false;
    try {
      keepAliveSourceRef.current?.stop();
    } catch {
      /* already stopped */
    }
    keepAliveSourceRef.current = null;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  }, []);

  const pauseKeepAlive = useCallback(() => {
    if (audioContextRef.current?.state === "running") {
      void audioContextRef.current.suspend().catch(() => {});
    }
  }, []);

  const resumeKeepAlive = useCallback(() => {
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return;
    const elapsedSeconds =
      pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
    internalSetElapsed(elapsedSeconds);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    try {
      const wl = await (navigator as Navigator & { wakeLock: { request: (type: "screen") => Promise<{
        release: () => Promise<void>;
        addEventListener: (type: string, listener: () => void) => void;
      }> } }).wakeLock.request("screen");
      wakeLockRef.current = wl;
      wl.addEventListener("release", () => {
        if (startTimeRef.current !== null) {
          void requestWakeLock();
        }
      });
    } catch (e) {
      logger.error("Wake lock failed", e);
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    void wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current !== null) return;
    heartbeatRef.current = window.setInterval(() => {
      localStorage.setItem("pace_heartbeat", String(Date.now()));
    }, 5000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current !== null) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    startTimeRef.current = Date.now();
    tick();
    intervalRef.current = setInterval(tick, 1000);
    startHeartbeat();
    void requestWakeLock();
  }, [requestWakeLock, startHeartbeat, tick]);

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
    stopHeartbeat();
    releaseWakeLock();
    stopKeepAlive();
  }, [releaseWakeLock, stopHeartbeat, stopKeepAlive]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (audioContextRef.current?.state === "suspended") {
          void audioContextRef.current.resume().catch(() => {});
        }
        if (startTimeRef.current !== null) {
          void requestWakeLock();
        }
        if (intervalRef.current === null && startTimeRef.current !== null) {
          intervalRef.current = window.setInterval(tick, 1000);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [requestWakeLock, tick]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopHeartbeat();
      releaseWakeLock();
      stopKeepAlive();
      startTimeRef.current = null;
    };
  }, [releaseWakeLock, stopHeartbeat, stopKeepAlive]);

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
    stopKeepAlive,
    pauseKeepAlive,
    resumeKeepAlive,
    formatTime,
  };
}
