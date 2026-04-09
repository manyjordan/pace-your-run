import { useRef, useEffect, useCallback, type MutableRefObject } from "react";
import type { RouteRow, RunGpsPoint } from "@/lib/database";
import { convertPaceFromMinutesPerKm, type RunPreferences } from "@/lib/runPreferences";
import type { ActiveSession } from "@/lib/activeSession";
import { haversineDistanceKm } from "@/lib/parsers/gpxParser";

/** Minutes per km over the trace from kilometre (endKm - 1) to endKm; null if GPS data is insufficient. */
function paceMinutesPerKmForLastKm(trace: RunGpsPoint[], endKm: number): number | null {
  if (trace.length < 2 || endKm < 1) return null;
  let cum = 0;
  let startTime: number | null = null;
  let endTime: number | null = null;
  for (let i = 1; i < trace.length; i++) {
    const prev = trace[i - 1];
    const curr = trace[i];
    cum += haversineDistanceKm({ lat: prev.lat, lng: prev.lng }, { lat: curr.lat, lng: curr.lng });
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

function parsePaceToSeconds(pace: string): number {
  const normalizedPace = pace.replace("/km", "").trim();
  const parts = normalizedPace.split(":");
  if (parts.length !== 2) return 0;

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;

  return minutes * 60 + seconds;
}

type RunStatus = "idle" | "running" | "paused";

type UseSpeechAnnouncementsParams = {
  speechPrefsRef: MutableRefObject<RunPreferences>;
  distance: number;
  elapsed: number;
  gpsTrace: RunGpsPoint[];
  status: RunStatus;
  pace: number;
  activeSession: ActiveSession | null;
  activeRoute: RouteRow | null;
  routeProgress: number;
  routeArrivalAnnouncedRef: MutableRefObject<boolean>;
};

export function useSpeechAnnouncements({
  speechPrefsRef,
  distance,
  elapsed,
  gpsTrace,
  status,
  pace,
  activeSession,
  activeRoute,
  routeProgress,
  routeArrivalAnnouncedRef,
}: UseSpeechAnnouncementsParams) {
  const lastAnnouncedKmRef = useRef(0);
  const lastPaceAlertRef = useRef(0);

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
  }, [activeRoute, routeProgress, status, routeArrivalAnnouncedRef]);

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
  }, [distance, elapsed, gpsTrace, speechPrefsRef, status]);

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

    const message =
      diff > 0
        ? `Allure prévue ${targetMin} minutes ${targetSec > 0 ? `${targetSec} secondes` : ""}. Allure actuelle ${currentMin} minutes ${currentSec > 0 ? `${currentSec} secondes` : ""}. Accélérez légèrement.`
        : `Allure prévue ${targetMin} minutes ${targetSec > 0 ? `${targetSec} secondes` : ""}. Allure actuelle ${currentMin} minutes ${currentSec > 0 ? `${currentSec} secondes` : ""}. Ralentissez légèrement.`;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "fr-FR";
    utterance.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    lastPaceAlertRef.current = now;
  }, [activeSession, pace, speechPrefsRef, status]);

  const resetAnnouncementRefs = useCallback(() => {
    lastAnnouncedKmRef.current = 0;
    lastPaceAlertRef.current = 0;
  }, []);

  /** Match Run.tsx stop(): only reset km split counter, keep pace-alert cooldown. */
  const resetKilometreAnnouncementRef = useCallback(() => {
    lastAnnouncedKmRef.current = 0;
  }, []);

  return { resetAnnouncementRefs, resetKilometreAnnouncementRef };
}
