import { useEffect, type MutableRefObject } from "react";
import { useSpeechAnnouncements } from "@/hooks/useSpeechAnnouncements";
import type { SessionSegment } from "@/hooks/useSessionProgram";
import type { ActiveSession } from "@/lib/activeSession";
import type { RouteRow, RunGpsPoint } from "@/lib/database";
import type { RunPreferences } from "@/lib/runPreferences";

type RunStatus = "idle" | "running" | "paused";

export type RunSpeechBridgeProps = {
  speechPrefsRef: MutableRefObject<RunPreferences>;
  resetAnnouncementRefsRef: MutableRefObject<() => void>;
  resetKilometreAnnouncementRefRef: MutableRefObject<() => void>;
  distance: number;
  elapsed: number;
  gpsTrace: RunGpsPoint[];
  status: RunStatus;
  pace: number;
  rollingPaceSecondsPerKm: number;
  activeSession: ActiveSession | null;
  activeRoute: RouteRow | null;
  routeProgress: number;
  routeArrivalAnnouncedRef: MutableRefObject<boolean>;
  heartRate?: number;
  isBluetoothConnected?: boolean;
  isProgrammedSessionActive: boolean;
  programmedSegments: SessionSegment[];
  currentProgramSegmentIndex: number;
  secondsRemainingInCurrentSegment: number;
  thirtySecondAnnouncedRef: MutableRefObject<Set<number>>;
  segmentTransitionAnnouncedRef: MutableRefObject<Set<number>>;
  pauseKeepAlive?: () => void;
  resumeKeepAlive?: () => void;
};

export default function RunSpeechBridge(props: RunSpeechBridgeProps) {
  const { resetAnnouncementRefs, resetKilometreAnnouncementRef } = useSpeechAnnouncements({
    speechPrefsRef: props.speechPrefsRef,
    distance: props.distance,
    elapsed: props.elapsed,
    gpsTrace: props.gpsTrace,
    status: props.status,
    pace: props.pace,
    rollingPaceSecondsPerKm: props.rollingPaceSecondsPerKm,
    activeSession: props.activeSession,
    activeRoute: props.activeRoute,
    routeProgress: props.routeProgress,
    routeArrivalAnnouncedRef: props.routeArrivalAnnouncedRef,
    heartRate: props.heartRate,
    isBluetoothConnected: props.isBluetoothConnected,
    isProgrammedSessionActive: props.isProgrammedSessionActive,
    programmedSegments: props.programmedSegments,
    currentProgramSegmentIndex: props.currentProgramSegmentIndex,
    secondsRemainingInCurrentSegment: props.secondsRemainingInCurrentSegment,
    thirtySecondAnnouncedRef: props.thirtySecondAnnouncedRef,
    segmentTransitionAnnouncedRef: props.segmentTransitionAnnouncedRef,
    pauseKeepAlive: props.pauseKeepAlive,
    resumeKeepAlive: props.resumeKeepAlive,
  });

  useEffect(() => {
    props.resetAnnouncementRefsRef.current = resetAnnouncementRefs;
    props.resetKilometreAnnouncementRefRef.current = resetKilometreAnnouncementRef;
  }, [
    resetAnnouncementRefs,
    resetKilometreAnnouncementRef,
    props.resetAnnouncementRefsRef,
    props.resetKilometreAnnouncementRefRef,
  ]);

  return null;
}
