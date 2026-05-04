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
import { PageContainer } from "@/components/ui/page-layout";
import { fetchCurrentWeather, type RunWeather } from "@/lib/weather";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== "undefined" ? window.innerWidth > window.innerHeight : false,
  );

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
    elevationGain,
    gradeAdjustedPace,
    estimatedFinishTimes,
    gpsTrace,
    gpsAccuracy,
    gpsError,
    formatTime,
    routeProgress,
    setRouteProgress,
    currentKmSplit,
    currentKmPaceSec,
    completedKmSplits,
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
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    screen.orientation?.addEventListener("change", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      screen.orientation?.removeEventListener("change", handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <PageContainer>
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

      <div className="space-y-6">
        {status === "idle" && !runSummary ? (
          <div className="flex min-h-screen flex-col bg-background">
            <div className="px-6 pt-4 pt-safe">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {format(new Date(), "EEEE dd MMMM", { locale: fr })}
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              {currentWeather ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xl">{currentWeather.emoji}</span>
                  <span>
                    {currentWeather.temperature}°C — {currentWeather.description}
                  </span>
                  <span>· Vent {currentWeather.windSpeed} km/h</span>
                </div>
              ) : null}

              {activeSession ? (
                <div className="rounded-2xl border border-accent/20 bg-accent/10 px-6 py-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Session programmée</p>
                  <p className="mt-0.5 font-bold text-accent">{activeSession.session.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activeSession.session.distance} km · {activeSession.session.pace} /km
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearActiveSession();
                      setActiveSession(null);
                    }}
                    className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Ignorer
                  </button>
                </div>
              ) : null}

              <div className="relative">
                <div className="absolute inset-0 scale-110 animate-ping rounded-full bg-accent/20 opacity-30" />
                <button
                  type="button"
                  onClick={start}
                  className="relative flex h-36 w-36 items-center justify-center rounded-full bg-accent shadow-2xl transition-all duration-150 active:scale-95"
                  style={{ boxShadow: "0 0 60px hsl(var(--accent) / 0.4)" }}
                >
                  <Play className="ml-2 h-14 w-14 fill-white text-white" />
                </button>
              </div>
              <p className="text-sm tracking-wide text-muted-foreground">Appuyez pour démarrer</p>
            </div>

            <div className="px-6 pb-4 pb-safe">
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2.5 text-xs font-medium text-muted-foreground"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Réglages
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/routes")}
                  className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2.5 text-xs font-medium text-muted-foreground"
                >
                  <Map className="h-3.5 w-3.5" />
                  Parcours
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {status === "running" ? (
          <div className="flex min-h-screen flex-col bg-background">
            <div className="flex items-center justify-between px-6 pt-3 pt-safe">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                <span className="text-xs font-semibold uppercase tracking-widest text-accent">Course en cours</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  gpsAccuracy && gpsAccuracy < 10
                    ? "text-accent"
                    : gpsAccuracy && gpsAccuracy < 30
                      ? "text-yellow-500"
                      : "text-red-400",
                )}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-current" />
                {gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : "GPS..."}
              </div>
            </div>

            <RunMainTimerCard
              formatTime={formatTime}
              elapsed={elapsed}
              displayDistance={displayDistance}
              distanceUnitShortLabel={distanceUnitShortLabel}
              displayPace={displayPace}
              formatPace={formatPace}
              gradeAdjustedPace={gradeAdjustedPace}
              elevationGain={elevationGain}
              bluetooth={{
                isBluetoothConnected: bluetooth.isBluetoothConnected,
                heartRate: bluetooth.heartRate,
              }}
              gpsAccuracy={gpsAccuracy}
              status={status}
              start={start}
              pause={pause}
              resume={resume}
              stop={stop}
              isProgrammedMode={isProgrammedMode}
              isProgramActive={isProgramActive}
              estimatedFinishTimes={estimatedFinishTimes}
              isLandscape={isLandscape}
              showControls={false}
              showStatusBadge={false}
              showGpsStatus={false}
              currentKmSplit={currentKmSplit}
              currentKmPaceSec={currentKmPaceSec}
              completedSplits={completedKmSplits}
            />

            <div className="flex justify-center gap-6 pb-6 pb-safe">
              <button
                type="button"
                onClick={pause}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted transition-all active:scale-95"
              >
                <Pause className="h-6 w-6" />
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

        {treadmill.isTreadmill && status === "running" && <RunTreadmillSpeedPanel treadmill={treadmill} />}

        {status === "paused" && (
          <RunMainTimerCard
            formatTime={formatTime}
            elapsed={elapsed}
            displayDistance={displayDistance}
            distanceUnitShortLabel={distanceUnitShortLabel}
            displayPace={displayPace}
            formatPace={formatPace}
            gradeAdjustedPace={gradeAdjustedPace}
            elevationGain={elevationGain}
            bluetooth={{
              isBluetoothConnected: bluetooth.isBluetoothConnected,
              heartRate: bluetooth.heartRate,
            }}
            gpsAccuracy={gpsAccuracy}
            status={status}
            start={start}
            pause={pause}
            resume={resume}
            stop={stop}
            isProgrammedMode={isProgrammedMode}
            isProgramActive={isProgramActive}
            estimatedFinishTimes={estimatedFinishTimes}
            isLandscape={isLandscape}
            currentKmSplit={currentKmSplit}
            currentKmPaceSec={currentKmPaceSec}
            completedSplits={completedKmSplits}
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
    </PageContainer>
  );
}
