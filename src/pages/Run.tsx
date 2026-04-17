import { ScrollReveal } from "@/components/ScrollReveal";
import { ActivityDetail } from "@/components/ActivityDetail";
import { RunCourseSettingsDialog } from "@/components/run/RunCourseSettingsDialog";
import { RunLiveMapBlock } from "@/components/run/RunLiveMapBlock";
import { RunMainTimerCard } from "@/components/run/RunMainTimerCard";
import { RunPerformanceRecapCard } from "@/components/run/RunPerformanceRecapCard";
import { RunSplitsCard } from "@/components/run/RunSplitsCard";
import { RunTreadmillSpeedPanel } from "@/components/run/RunTreadmillSpeedPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBluetoothHR, type RunBluetoothStatus } from "@/hooks/useBluetoothHR";
import { useRunSave } from "@/hooks/useRunSave";
import { useRunSession, type RunSummary } from "@/hooks/useRunSession";
import { useSpeechAnnouncements } from "@/hooks/useSpeechAnnouncements";
import { INTERVAL_TEMPLATES, useSessionProgram } from "@/hooks/useSessionProgram";
import { useTreadmill } from "@/hooks/useTreadmill";
import { updatePostAudience, type RouteRow, type RunRow } from "@/lib/database";
import type { CommunityPost } from "@/lib/runFormatters";
import {
  convertDistanceFromKm,
  convertPaceFromMinutesPerKm,
  getDistanceUnitShortLabel,
  getDefaultRunPreferences,
  getSplitDistanceKm,
  loadRunPreferences,
  saveRunPreferences,
  type RunPreferences,
} from "@/lib/runPreferences";
import { clearActiveSession, loadActiveSession, type ActiveSession } from "@/lib/activeSession";

const SELECTED_ROUTE_KEY = "pace-selected-route";

export default function Run() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [postAudience, setPostAudience] = useState<"private" | "friends" | "public">("public");
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteRow | null>(null);
  const [title, setTitle] = useState("");
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [runPreferences, setRunPreferences] = useState<RunPreferences>(() => getDefaultRunPreferences());
  const [completedActivity, setCompletedActivity] = useState<RunRow | null>(null);
  const [completedPost, setCompletedPost] = useState<CommunityPost | null>(null);
  const [showCompletedActivityDetail, setShowCompletedActivityDetail] = useState(false);
  const [completedPostId, setCompletedPostId] = useState<string | null>(null);
  const [isUpdatingAudience, setIsUpdatingAudience] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const speechPrefsRef = useRef<RunPreferences>(getDefaultRunPreferences());
  const postAudienceRef = useRef<"private" | "friends" | "public">("public");
  const routeArrivalAnnouncedRef = useRef(false);
  const currentIntervalRepRef = useRef<number>(0);
  const resetProgramProgressRef = useRef<() => void>(() => {});
  const resetAnnouncementRefsRef = useRef<() => void>(() => {});
  const resetKilometreAnnouncementRefRef = useRef<() => void>(() => {});
  const statusRef = useRef<RunBluetoothStatus>("idle");

  const bluetooth = useBluetoothHR({ statusRef });
  const treadmill = useTreadmill();
  const { persistCompletedRun, isSaving, saveError, setSaveError } = useRunSave();

  const session = useRunSession({
    statusRef,
    user,
    userPreferencesUserId: user?.id,
    activeSession,
    activeRoute,
    treadmill,
    bluetooth,
    title,
    setTitle,
    runSummary,
    showTreadmillCorrection: treadmill.showTreadmillCorrection,
    completedActivity,
    completedPost,
    setRunSummary,
    setCompletedActivity,
    setCompletedPost,
    setCompletedPostId,
    setShowCompletedActivityDetail,
    setSaveError,
    routeArrivalAnnouncedRef,
    speechPrefsRef,
    currentIntervalRepRef,
    resetProgramProgressRef,
    resetAnnouncementRefsRef,
    resetKilometreAnnouncementRefRef,
  });

  const {
    status,
    distance,
    setDistance,
    elapsed,
    pace,
    gpsTrace,
    gpsAccuracy,
    gpsError,
    getAccuracyColor,
    formatTime,
    routeProgress,
    setRouteProgress,
    start,
    pause,
    resume,
    stop,
  } = session;

  const {
    runMode,
    setRunMode,
    programSource,
    setProgramSource,
    selectedTemplateId,
    loadTemplate,
    segments,
    addSegment,
    removeSegment,
    updateSegment,
    isProgrammedMode,
    isProgramActive,
    currentSegmentIndex,
    currentSegment,
    nextSegment,
    secondsRemainingInCurrentSegment,
    currentSegmentDurationSeconds,
    totalProgramDurationSeconds,
    resetProgramProgress,
    thirtySecondAnnouncedRef,
    segmentTransitionAnnouncedRef,
  } = useSessionProgram({ elapsed, status });

  resetProgramProgressRef.current = resetProgramProgress;

  const { resetAnnouncementRefs, resetKilometreAnnouncementRef } = useSpeechAnnouncements({
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
    isProgrammedSessionActive: isProgramActive,
    programmedSegments: segments,
    currentProgramSegmentIndex: currentSegmentIndex,
    secondsRemainingInCurrentSegment,
    thirtySecondAnnouncedRef,
    segmentTransitionAnnouncedRef,
  });

  resetAnnouncementRefsRef.current = resetAnnouncementRefs;
  resetKilometreAnnouncementRefRef.current = resetKilometreAnnouncementRef;

  const formatPace = useCallback(
    (p: number) => (p > 0 ? `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, "0")}` : "--:--"),
    [],
  );
  const distanceUnitShortLabel = getDistanceUnitShortLabel(runPreferences.distanceUnit);
  const splitDistanceKm = getSplitDistanceKm(runPreferences.distanceUnit);
  const displayDistance = convertDistanceFromKm(distance, runPreferences.distanceUnit);
  const displayPace = convertPaceFromMinutesPerKm(pace, runPreferences.distanceUnit);
  const isRunActive = status === "running" || status === "paused";
  const hasLiveGpsTrace = gpsTrace.length > 0;

  const handlePersistCompletedRun = useCallback(() => {
    if (!runSummary) return;
    void persistCompletedRun({
      runSummary,
      title,
      isTreadmill: treadmill.isTreadmill,
      postAudienceRef,
      selectRouteKey: SELECTED_ROUTE_KEY,
      formatTime,
      setCompletedPostId,
      setActiveRoute,
      setRouteProgress: () => {},
      setActiveSession,
      setCompletedPost,
    });
  }, [runSummary, title, treadmill.isTreadmill, persistCompletedRun, formatTime, setCompletedPost, setRouteProgress]);

  const handleAudienceChange = useCallback(
    async (value: "private" | "friends" | "public") => {
      setPostAudience(value);

      if (!user || !completedPostId) return;

      try {
        setIsUpdatingAudience(true);
        await updatePostAudience(completedPostId, user.id, value);
        window.dispatchEvent(new Event("pace-community-updated"));
      } catch (error) {
        console.error("[Run] operation failed:", error);
        import("@sentry/react")
          .then(({ captureException }) => {
            captureException(error);
          })
          .catch(() => {});
        setSaveError("Impossible de mettre à jour l'audience de cette course.");
      } finally {
        setIsUpdatingAudience(false);
      }
    },
    [completedPostId, user, setSaveError],
  );

  useEffect(() => {
    setRunPreferences(loadRunPreferences(user?.id));
    setPreferencesLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    saveRunPreferences(runPreferences, user?.id);
  }, [preferencesLoaded, runPreferences, user?.id]);

  useEffect(() => {
    postAudienceRef.current = postAudience;
  }, [postAudience]);

  useEffect(() => {
    const s = loadActiveSession();
    if (!s) return;
    setActiveSession(s);
    setTitle(s.session.type);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SELECTED_ROUTE_KEY);
      if (stored) {
        const route = JSON.parse(stored) as RouteRow;
        setActiveRoute(route);
      }
    } catch {
      // ignore invalid localStorage payload
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {completedActivity && showCompletedActivityDetail && (
        <ActivityDetail
          activity={completedActivity}
          onClose={() => setShowCompletedActivityDetail(false)}
          allActivities={[completedActivity]}
          fallbackTrace={completedPost?.gpsTrace}
        />
      )}

      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course</h1>
          <p className="text-sm text-muted-foreground">Enregistrez votre course en temps réel</p>
        </div>
      </ScrollReveal>

      {gpsError && (
        <ScrollReveal>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{gpsError}</p>
          </div>
        </ScrollReveal>
      )}

      {saveError && (
        <ScrollReveal>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{saveError}</p>
          </div>
        </ScrollReveal>
      )}

      <div className="space-y-6">
        {activeSession && status === "idle" && (
          <div className="space-y-2 rounded-lg border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {activeSession.planName} · Semaine {activeSession.weekNumber}
                </p>
                <p className="text-sm font-semibold">{activeSession.session.type}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearActiveSession();
                  setActiveSession(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Ignorer
              </button>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{activeSession.session.distance} km</span>
              <span>·</span>
              <span>Allure cible : {activeSession.session.pace} /km</span>
              {activeSession.session.intervals && (
                <>
                  <span>·</span>
                  <span>
                    {activeSession.session.intervals.reps} ×{" "}
                    {activeSession.session.intervals.distanceM
                      ? `${activeSession.session.intervals.distanceM}m`
                      : `${activeSession.session.intervals.durationSeconds}s`}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {activeRoute && status === "idle" && (
          <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{activeRoute.name}</p>
              <p className="text-xs text-muted-foreground">
                {activeRoute.distance_km.toFixed(1)} km · {Math.round(activeRoute.elevation_gain)}m D+
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveRoute(null);
                localStorage.removeItem(SELECTED_ROUTE_KEY);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Retirer
            </button>
          </div>
        )}

        {status === "idle" && (
          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 shrink-0" />
              Réglages
            </Button>
            <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => navigate("/routes")}>
              <Map className="h-4 w-4 shrink-0" />
              Mes parcours
            </Button>
          </div>
        )}

        {isRunActive && isProgramActive && currentSegment ? (
          <Card className="border-accent/30 bg-card/95">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Segment {currentSegmentIndex + 1}/{segments.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(((currentSegmentIndex + 1) / Math.max(segments.length, 1)) * 100)}%
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-accent transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((currentSegmentIndex + 1) / Math.max(segments.length, 1)) * 100),
                    )}%`,
                  }}
                />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold">Objectif : {currentSegment.target_pace} /km</p>
                <p className="text-xs text-muted-foreground">
                  {currentSegment.label?.trim() || `Segment ${currentSegmentIndex + 1}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Temps restant : {formatTime(secondsRemainingInCurrentSegment)}
                </p>
                {nextSegment ? (
                  <p className="text-xs text-muted-foreground">
                    Ensuite : {nextSegment.label?.trim() || "Segment suivant"} ({nextSegment.target_pace} /km)
                  </p>
                ) : null}
                <p className="text-[11px] text-muted-foreground">
                  Durée programmée : {formatTime(totalProgramDurationSeconds)} · Segment actuel :{" "}
                  {formatTime(currentSegmentDurationSeconds)}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!treadmill.isTreadmill && isRunActive && (
          <RunLiveMapBlock
            activeRoute={activeRoute}
            gpsTrace={gpsTrace}
            routeProgress={routeProgress}
            status={status}
            hasLiveGpsTrace={hasLiveGpsTrace}
          />
        )}

        {treadmill.isTreadmill && status === "running" && <RunTreadmillSpeedPanel treadmill={treadmill} />}

        <RunMainTimerCard
          formatTime={formatTime}
          elapsed={elapsed}
          displayDistance={displayDistance}
          distanceUnitShortLabel={distanceUnitShortLabel}
          displayPace={displayPace}
          formatPace={formatPace}
          treadmill={treadmill}
          bluetooth={{
            bluetoothDevice: bluetooth.bluetoothDevice,
            heartRate: bluetooth.heartRate,
          }}
          gpsAccuracy={gpsAccuracy}
          getAccuracyColor={getAccuracyColor}
          isRunActive={isRunActive}
          runPreferences={runPreferences}
          status={status}
          start={start}
          pause={pause}
          resume={resume}
          stop={stop}
          isProgrammedMode={isProgrammedMode}
          isProgramActive={isProgramActive}
        />

        {status === "idle" && (
          <div className="flex flex-col gap-3 pt-1">
            <Button type="button" variant="outline" className="h-12 w-full gap-2" onClick={() => navigate("/routes")}>
              <Map className="h-4 w-4 shrink-0" />
              Mes parcours
            </Button>
            <RunCourseSettingsDialog
              runPreferences={runPreferences}
              setRunPreferences={setRunPreferences}
              runMode={runMode}
              setRunMode={setRunMode}
              isProgrammedMode={isProgrammedMode}
              isTreadmill={treadmill.isTreadmill}
              setIsTreadmill={treadmill.setIsTreadmill}
              programmed={{
                programSource,
                setProgramSource,
                selectedTemplateId,
                loadTemplate,
                segments,
                addSegment,
                removeSegment,
                updateSegment,
              }}
            />
          </div>
        )}

        {runSummary && status === "idle" && (
          <RunPerformanceRecapCard
            runSummary={runSummary}
            title={title}
            setTitle={setTitle}
            distance={distance}
            elapsed={elapsed}
            setDistance={setDistance}
            stop={stop}
            isTreadmill={treadmill.isTreadmill}
            showTreadmillCorrection={treadmill.showTreadmillCorrection}
            treadmillSpeedKmh={treadmill.treadmillSpeedKmh}
            correctedDistanceKm={treadmill.correctedDistanceKm}
            setCorrectedDistanceKm={treadmill.setCorrectedDistanceKm}
            setShowTreadmillCorrection={treadmill.setShowTreadmillCorrection}
            postAudience={postAudience}
            handleAudienceChange={handleAudienceChange}
            isUpdatingAudience={isUpdatingAudience}
            user={user}
            completedPostId={completedPostId}
            isSaving={isSaving}
            handlePersistCompletedRun={handlePersistCompletedRun}
            completedPost={completedPost}
            setCompletedActivity={setCompletedActivity}
            setCompletedPost={setCompletedPost}
            setShowCompletedActivityDetail={setShowCompletedActivityDetail}
          />
        )}

        <RunSplitsCard
          elapsed={elapsed}
          status={status}
          distance={distance}
          gpsTrace={gpsTrace}
          splitDistanceKm={splitDistanceKm}
          distanceUnitShortLabel={distanceUnitShortLabel}
          runPreferences={runPreferences}
          formatPace={formatPace}
        />
      </div>
    </div>
  );
}
