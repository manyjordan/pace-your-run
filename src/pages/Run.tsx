import { ScrollReveal } from "@/components/ScrollReveal";
import { ActivityDetail } from "@/components/ActivityDetail";
import { RunLiveMapBlock } from "@/components/run/RunLiveMapBlock";
import { RunMainTimerCard } from "@/components/run/RunMainTimerCard";
import { RunPerformanceRecapCard } from "@/components/run/RunPerformanceRecapCard";
import { RunSplitsCard } from "@/components/run/RunSplitsCard";
import { RunTreadmillSpeedPanel } from "@/components/run/RunTreadmillSpeedPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Map, Settings, Play, Pause, Square } from "lucide-react";
import { lazy, Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBluetoothHR, type RunBluetoothStatus } from "@/hooks/useBluetoothHR";
import { useRunSave } from "@/hooks/useRunSave";
import { useRunSession, type RunSummary } from "@/hooks/useRunSession";
import { useSessionProgram } from "@/hooks/useSessionProgram";
import { useTreadmill } from "@/hooks/useTreadmill";
import { updatePostAudience, type RouteRow, type RunRow } from "@/lib/database";
import { convertPaceFromMinutesPerKm, type CommunityPost } from "@/lib/runFormatters";
import {
  convertDistanceFromKm,
  getDistanceUnitShortLabel,
  getDefaultRunPreferences,
  getSplitDistanceKm,
  loadRunPreferences,
  saveRunPreferences,
  type RunPreferences,
} from "@/lib/runPreferences";
import { clearActiveSession, loadActiveSession, type ActiveSession } from "@/lib/activeSession";
import { AppCard, PageContainer } from "@/components/ui/page-layout";
import { fetchCurrentWeather, type RunWeather } from "@/lib/weather";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const SELECTED_ROUTE_KEY = "pace-selected-route";

const RunSpeechBridge = lazy(() => import("@/components/run/RunSpeechBridge"));
const RunCourseSettingsDialog = lazy(() =>
  import("@/components/run/RunCourseSettingsDialog").then((m) => ({ default: m.RunCourseSettingsDialog })),
);

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
  const [currentWeather, setCurrentWeather] = useState<RunWeather | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
    rollingPaceSecondsPerKm,
    gpsTrace,
    gpsAccuracy,
    gpsError,
    formatTime,
    routeProgress,
    setRouteProgress,
    showRunRecovery,
    runRecoveryData,
    handleSaveRecoveredRun,
    dismissRunRecovery,
    start,
    pause,
    resume,
    stop,
    pauseKeepAlive,
    resumeKeepAlive,
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

  const formatPace = useCallback(
    (paceMinPerKm: number): string => {
      if (!paceMinPerKm || paceMinPerKm <= 0) return "--:-- /km";
      const wholeMin = Math.floor(paceMinPerKm);
      const secs = Math.round((paceMinPerKm - wholeMin) * 60);
      const safeSecs = secs === 60 ? 59 : secs;
      const unit = runPreferences.distanceUnit === "mi" ? "/mi" : "/km";
      return `${wholeMin}:${String(safeSecs).padStart(2, "0")} ${unit}`;
    },
    [runPreferences.distanceUnit],
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
        logger.error("[Run] operation failed", error);
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
    if (status !== "idle") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchCurrentWeather(pos.coords.latitude, pos.coords.longitude)
          .then((weather) => {
            setCurrentWeather(weather);
          })
          .catch(() => {});
      },
      () => {},
      { timeout: 5000, maximumAge: 300_000 },
    );
  }, [status]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <PageContainer className="space-y-0 px-0 pb-0">
      {showRunRecovery && runRecoveryData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background/90 p-6 backdrop-blur">
          <AppCard className="w-full max-w-sm space-y-4 text-center">
            <p className="text-2xl">⚠️</p>
            <h2 className="text-lg font-bold text-foreground">Course interrompue</h2>
            <p className="text-sm text-muted-foreground">
              Une course de {runRecoveryData.distance.toFixed(2)} km a été interrompue. Voulez-vous la sauvegarder ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSaveRecoveredRun(runRecoveryData)}
                className="flex-1 rounded-xl bg-accent py-3 font-semibold text-white"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={dismissRunRecovery}
                className="flex-1 rounded-xl bg-muted py-3 font-medium text-foreground"
              >
                Ignorer
              </button>
            </div>
          </AppCard>
        </div>
      )}

      <Suspense fallback={null}>
        <RunSpeechBridge
          speechPrefsRef={speechPrefsRef}
          resetAnnouncementRefsRef={resetAnnouncementRefsRef}
          resetKilometreAnnouncementRefRef={resetKilometreAnnouncementRefRef}
          distance={distance}
          elapsed={elapsed}
          gpsTrace={gpsTrace}
          status={status}
          pace={pace}
          rollingPaceSecondsPerKm={rollingPaceSecondsPerKm}
          activeSession={activeSession}
          activeRoute={activeRoute}
          routeProgress={routeProgress}
          routeArrivalAnnouncedRef={routeArrivalAnnouncedRef}
          heartRate={bluetooth.heartRate}
          isBluetoothConnected={bluetooth.isBluetoothConnected}
          isProgrammedSessionActive={isProgramActive}
          programmedSegments={segments}
          currentProgramSegmentIndex={currentSegmentIndex}
          secondsRemainingInCurrentSegment={secondsRemainingInCurrentSegment}
          thirtySecondAnnouncedRef={thirtySecondAnnouncedRef}
          segmentTransitionAnnouncedRef={segmentTransitionAnnouncedRef}
          pauseKeepAlive={pauseKeepAlive}
          resumeKeepAlive={resumeKeepAlive}
        />
      </Suspense>

      {completedActivity && showCompletedActivityDetail && (
        <ActivityDetail
          activity={completedActivity}
          onClose={() => setShowCompletedActivityDetail(false)}
          allActivities={[completedActivity]}
          fallbackTrace={completedPost?.gpsTrace}
        />
      )}

      <Suspense fallback={null}>
        <RunCourseSettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          hideTrigger
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
      </Suspense>

      {status === "idle" && !runSummary ? (
        <div className="flex min-h-[100dvh] flex-col bg-background">
          <div className="pt-safe shrink-0" />
          <div className="flex shrink-0 items-center justify-between px-6 pt-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {format(new Date(), "EEEE dd MMMM", { locale: fr })}
            </p>
            {currentWeather ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{currentWeather.emoji}</span>
                <span>{currentWeather.temperature}°C</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            {activeSession ? (
              <div className="px-6 text-center">
                <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Séance du jour
                </p>
                <p className="font-bold text-foreground">{activeSession.session.label}</p>
                <p className="text-sm text-muted-foreground">{activeSession.session.distance} km</p>
                <button
                  type="button"
                  onClick={() => {
                    clearActiveSession();
                    setActiveSession(null);
                  }}
                  className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Ignorer
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={start}
              disabled={isProgrammedMode && !isProgramActive}
              className={cn(
                "flex h-28 w-28 items-center justify-center rounded-full bg-accent transition-all duration-150 active:scale-95",
                isProgrammedMode && !isProgramActive && "cursor-not-allowed opacity-50 active:scale-100",
              )}
              style={{ boxShadow: "0 4px 24px hsl(141 69% 42% / 0.35)" }}
            >
              <Play className="ml-1 h-10 w-10 fill-white text-white" />
            </button>

            <p className="text-sm text-muted-foreground">Appuyez pour démarrer</p>
          </div>

          <div className="flex shrink-0 justify-center gap-3 px-6 pb-8 pb-safe">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2.5 text-xs font-medium text-muted-foreground transition-all active:scale-95"
            >
              <Settings className="h-3.5 w-3.5" />
              Réglages
            </button>
            <button
              type="button"
              onClick={() => navigate("/routes")}
              className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2.5 text-xs font-medium text-muted-foreground transition-all active:scale-95"
            >
              <Map className="h-3.5 w-3.5" />
              Parcours
            </button>
          </div>
        </div>
      ) : null}

      {status === "running" ? (
        <div className="flex min-h-[100dvh] flex-col bg-background">
          <div className="shrink-0 pt-safe" />
          <div className="flex shrink-0 justify-end px-6 pt-3">
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs",
                gpsAccuracy && gpsAccuracy < 15
                  ? "text-accent"
                  : gpsAccuracy && gpsAccuracy < 40
                    ? "text-yellow-500"
                    : "text-muted-foreground",
              )}
            >
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              {gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : "GPS..."}
            </div>
          </div>

          {treadmill.isTreadmill ? (
            <div className="shrink-0 px-4 pt-2">
              <RunTreadmillSpeedPanel treadmill={treadmill} />
            </div>
          ) : null}

          <RunMainTimerCard
            formatTime={formatTime}
            elapsed={elapsed}
            displayDistance={displayDistance}
            distanceUnitShortLabel={distanceUnitShortLabel}
            displayPace={displayPace}
            formatPace={formatPace}
            className="min-h-0"
          />

          <div className="flex shrink-0 justify-center gap-6 pb-10 pb-safe">
            <button
              type="button"
              onClick={pause}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted transition-all active:scale-95"
            >
              <Pause className="h-6 w-6 text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 transition-all active:scale-95"
            >
              <Square className="h-5 w-5 fill-destructive text-destructive" />
            </button>
          </div>
        </div>
      ) : null}

      {status === "paused" ? (
        <div className="flex min-h-[100dvh] flex-col bg-background">
          <div className="shrink-0 pt-safe" />
          <div className="flex shrink-0 justify-end px-6 pt-3">
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs",
                gpsAccuracy && gpsAccuracy < 15
                  ? "text-accent"
                  : gpsAccuracy && gpsAccuracy < 40
                    ? "text-yellow-500"
                    : "text-muted-foreground",
              )}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-current" />
              {gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : "GPS..."}
            </div>
          </div>

          {treadmill.isTreadmill ? (
            <div className="shrink-0 px-4 pt-2">
              <RunTreadmillSpeedPanel treadmill={treadmill} />
            </div>
          ) : null}

          <RunMainTimerCard
            formatTime={formatTime}
            elapsed={elapsed}
            displayDistance={displayDistance}
            distanceUnitShortLabel={distanceUnitShortLabel}
            displayPace={displayPace}
            formatPace={formatPace}
            className="min-h-0"
          />

          <div className="flex shrink-0 justify-center gap-6 pb-10 pb-safe">
            <button
              type="button"
              onClick={resume}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-accent transition-all active:scale-95"
              style={{ boxShadow: "0 4px 24px hsl(141 69% 42% / 0.35)" }}
            >
              <Play className="ml-1 h-8 w-8 fill-white text-white" />
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              className="flex h-16 w-16 items-center justify-center self-center rounded-full border border-destructive/30 bg-destructive/10 transition-all active:scale-95"
            >
              <Square className="h-5 w-5 fill-destructive text-destructive" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-6 px-4 pb-24">
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

        {!treadmill.isTreadmill && isRunActive && activeRoute && status === "running" && (
          <RunLiveMapBlock
            activeRoute={activeRoute}
            gpsTrace={gpsTrace}
            routeProgress={routeProgress}
            status={status}
            hasLiveGpsTrace={hasLiveGpsTrace}
          />
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

        {status === "idle" ? (
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
        ) : null}
      </div>
    </PageContainer>
  );
}
