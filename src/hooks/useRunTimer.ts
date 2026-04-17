import { useState, useRef, useCallback, useEffect } from "react";

export function useRunTimer() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keepAliveAudioRef = useRef<AudioContext | null>(null);
  const keepAliveOscRef = useRef<OscillatorNode | null>(null);

  const startKeepAlive = useCallback(async () => {
    if (keepAliveAudioRef.current) return;
    try {
      const ctx = new AudioContext();
      keepAliveAudioRef.current = ctx;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.001;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      keepAliveOscRef.current = oscillator;
    } catch {
      keepAliveAudioRef.current?.close().catch(() => {});
      keepAliveAudioRef.current = null;
      keepAliveOscRef.current = null;
    }
  }, []);

  const stopKeepAlive = useCallback(() => {
    try {
      keepAliveOscRef.current?.stop();
    } catch {
      /* already stopped */
    }
    keepAliveOscRef.current = null;
    keepAliveAudioRef.current?.close().catch(() => {});
    keepAliveAudioRef.current = null;
  }, []);

  const tick = useCallback(() => {
    setElapsed((e) => e + 1);
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    void startKeepAlive();
    intervalRef.current = setInterval(tick, 1000);
  }, [tick, startKeepAlive]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopKeepAlive();
  }, [stopKeepAlive]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopKeepAlive();
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
    formatTime,
  };
}
