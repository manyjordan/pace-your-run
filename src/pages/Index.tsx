import { useEffect, useMemo, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, getRuns, getRunWithGps, type ProfileRow, type RunGpsPoint, type RunRow } from "@/lib/database";
import { normalizeGoalData } from "@/lib/goalHelpers";
import { cache } from "@/lib/cache";
import { ActivityDetail } from "@/components/ActivityDetail";
import { GpsTraceSvg } from "@/components/GpsTraceSvg";
import { AppCard, PageContainer } from "@/components/ui/page-layout";
import { formatDuration, formatPaceFromSeconds, formatRelativeTime } from "@/lib/runFormatters";

type ProfileGoalData = {
  goalType: "weight" | "race" | "distance" | "none";
  raceType: "marathon" | "semi" | "20k" | "10k" | "5k" | "other";
  raceDistanceKm: string;
  raceTargetDate: string;
  raceTargetTime: string;
  distanceKm?: string;
  targetWeightKg?: string;
  selectedPlanId?: string;
  goalSavedAt?: string;
  distanceTargetDate?: string;
  weightTargetDate?: string;
};

function parseGpsTraceForDetail(trace: RunRow["gps_trace"]): RunGpsPoint[] | undefined {
  if (!Array.isArray(trace)) return undefined;
  const points = trace.filter((point): point is RunGpsPoint => {
    return (
      typeof point === "object" &&
      point !== null &&
      typeof (point as { lat?: unknown }).lat === "number" &&
      typeof (point as { lng?: unknown }).lng === "number" &&
      typeof (point as { time?: unknown }).time === "number"
    );
  });
  return points.length ? points : undefined;
}

function traceForMap(trace: RunRow["gps_trace"]): Array<{ lat: number; lng: number }> | null {
  const pts = parseGpsTraceForDetail(trace);
  if (!pts || pts.length < 2) return null;
  return pts.map((p) => ({ lat: p.lat, lng: p.lng }));
}

function formatRelativeDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  try {
    return formatRelativeTime(raw);
  } catch {
    return "—";
  }
}

export default function Index() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [athleteName, setAthleteName] = useState("Coureur");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRunForDetail, setSelectedRunForDetail] = useState<RunRow | null>(null);
  const [selectedDetailTrace, setSelectedDetailTrace] = useState<RunGpsPoint[] | undefined>(undefined);
  const [_userGoal, setUserGoal] = useState<ProfileGoalData | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("pace_user_id");
    if (!userId) return;
    const cached = cache.get<RunRow[]>(`runs_${userId}`);
    const cachedProfile = cache.get<ProfileRow>(`profile_${userId}`);
    if (cached?.length) {
      setRecentRuns(cached);
      setIsLoading(false);
    }
    if (cachedProfile) {
      setAthleteName(cachedProfile.first_name?.trim() || "Coureur");
      if (
        cachedProfile.goal_data &&
        typeof cachedProfile.goal_data === "object" &&
        !Array.isArray(cachedProfile.goal_data)
      ) {
        setUserGoal(normalizeGoalData(cachedProfile.goal_data as ProfileGoalData) as ProfileGoalData);
      }
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setRecentRuns([]);
      setIsLoading(false);
      return;
    }

    const userId = session.user.id;
    localStorage.setItem("pace_user_id", userId);

    const load = () => {
      void Promise.all([getRuns(userId), getProfile(userId)])
        .then(([runs, profile]) => {
          if (runs) {
            setRecentRuns(runs);
            cache.set(`runs_${userId}`, runs);
            cache.set(`runsStats_${userId}`, runs);
          }
          if (profile) {
            cache.set(`profile_${userId}`, profile);
            setAthleteName(profile.first_name?.trim() || "Coureur");
            if (profile.goal_data && typeof profile.goal_data === "object" && !Array.isArray(profile.goal_data)) {
              setUserGoal(normalizeGoalData(profile.goal_data as ProfileGoalData) as ProfileGoalData);
            } else {
              setUserGoal(null);
            }
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    };

    load();

    const onRefresh = () => load();
    window.addEventListener("pace-goal-updated", onRefresh);
    window.addEventListener("pace-runs-updated", onRefresh);
    return () => {
      window.removeEventListener("pace-goal-updated", onRefresh);
      window.removeEventListener("pace-runs-updated", onRefresh);
    };
  }, [session?.user?.id]);

  const thisWeekRuns = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return recentRuns.filter((r) => {
      const raw = r.started_at ?? r.created_at;
      if (!raw) return false;
      return new Date(raw) >= weekStart;
    });
  }, [recentRuns]);

  const thisWeekKm = thisWeekRuns.reduce((s, r) => s + (r.distance_km ?? 0), 0);
  const thisWeekElevation = thisWeekRuns.reduce((s, r) => s + (r.elevation_gain ?? 0), 0);
  const weeklyGoalKm = 40;
  const weekProgress = Math.min(100, (thisWeekKm / weeklyGoalKm) * 100);
  const lastRun = recentRuns[0] ?? null;

  const openRunDetail = (run: RunRow) => {
    setSelectedRunForDetail(run);
    setSelectedDetailTrace(parseGpsTraceForDetail(run.gps_trace));
    const uid = session?.user?.id;
    if (!uid) return;
    void getRunWithGps(uid, run.id)
      .then((fullRun) => {
        setSelectedRunForDetail((prev) => (prev?.id === run.id ? { ...prev, ...fullRun } : prev));
        setSelectedDetailTrace(parseGpsTraceForDetail(fullRun.gps_trace));
      })
      .catch(() => {});
  };

  const mapTrace = lastRun ? traceForMap(lastRun.gps_trace) : null;

  return (
    <>
      {selectedRunForDetail && session?.user?.id ? (
        <ActivityDetail
          activity={selectedRunForDetail}
          userId={session.user.id}
          onClose={() => {
            setSelectedRunForDetail(null);
            setSelectedDetailTrace(undefined);
          }}
          allActivities={recentRuns}
          fallbackTrace={selectedDetailTrace}
        />
      ) : null}

      <PageContainer>
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {format(new Date(), "EEEE dd MMMM", { locale: fr })}
            </p>
            <h1 className="mt-0.5 text-2xl font-black text-foreground">
              Bonjour {athleteName} 👋
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent"
            aria-label="Profil"
          >
            {athleteName.charAt(0).toUpperCase()}
          </button>
        </div>

        <div className="space-y-3 px-4 pb-24">
          <AppCard>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Cette semaine</p>
              <p className="text-xs text-muted-foreground">
                {thisWeekRuns.length} sortie{thisWeekRuns.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="mb-2 flex items-end justify-between">
              <div>
                <span className="text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                  {thisWeekKm.toFixed(1)}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">/ {weeklyGoalKm} km</span>
              </div>
              {thisWeekElevation > 0 ? (
                <p className="text-xs text-muted-foreground">+{Math.round(thisWeekElevation)}m D+</p>
              ) : null}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </AppCard>

          {lastRun ? (
            <button type="button" onClick={() => openRunDetail(lastRun)} className="w-full text-left">
              <AppCard className="overflow-hidden p-0">
                {mapTrace ? <GpsTraceSvg trace={mapTrace} height={140} className="w-full rounded-t-xl" /> : null}
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(lastRun.started_at ?? lastRun.created_at)} · {lastRun.title || "Course"}
                    </p>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xl font-black text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                        {(lastRun.distance_km ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">km</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                        {formatDuration(lastRun.duration_seconds ?? 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">durée</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-accent" style={{ fontFamily: "var(--font-mono-display)" }}>
                        {formatPaceFromSeconds(lastRun.duration_seconds ?? 0, (lastRun.distance_km ?? 0) * 1000).replace(
                          " /km",
                          "",
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">allure</p>
                    </div>
                  </div>
                </div>
              </AppCard>
            </button>
          ) : null}

          <AppCard>
            <p className="mb-3 text-sm font-semibold text-foreground">Passer à l&apos;action</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/run")}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              >
                Courir
              </button>
              <button
                type="button"
                onClick={() => navigate("/plan")}
                className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-all active:scale-[0.98]"
              >
                Plan
              </button>
            </div>
          </AppCard>

          {recentRuns.slice(1, 8).map((run) => (
            <button key={run.id} type="button" onClick={() => openRunDetail(run)} className="w-full text-left">
              <AppCard className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-lg">
                    🏃
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{run.title || "Course"}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(run.started_at ?? run.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                      {(run.distance_km ?? 0).toFixed(2)} km
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPaceFromSeconds(run.duration_seconds ?? 0, (run.distance_km ?? 0) * 1000)}
                    </p>
                  </div>
                  <ChevronRight className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </AppCard>
            </button>
          ))}

          {recentRuns.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center space-y-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-3xl">🏃</div>
              <div>
                <p className="font-bold text-foreground">Prêt à courir ?</p>
                <p className="mt-1 text-sm text-muted-foreground">Votre première course apparaîtra ici.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/run")}
                className="rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-all active:scale-95"
              >
                Lancer ma première course
              </button>
            </div>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}
