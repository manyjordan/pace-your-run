import { useMemo, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, Footprints } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { getRunWithGps, type RunGpsPoint, type RunRow } from "@/lib/database";
import { ActivityDetail } from "@/components/ActivityDetail";
import { GpsTraceSvg } from "@/components/GpsTraceSvg";
import { AppCard, PageContainer } from "@/components/ui/page-layout";
import { formatDuration, formatPaceFromSeconds, formatRelativeTime } from "@/lib/runFormatters";

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
  const { runs: recentRuns, profile, isLoading } = useData();
  const [selectedRunForDetail, setSelectedRunForDetail] = useState<RunRow | null>(null);
  const [selectedDetailTrace, setSelectedDetailTrace] = useState<RunGpsPoint[] | undefined>(undefined);

  const athleteName = profile?.first_name?.trim() || "Coureur";

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
            <h1 className="mt-0.5 text-2xl font-black text-foreground">Bonjour {athleteName} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/shoes")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
              aria-label="Équipement"
            >
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent"
              aria-label="Profil"
            >
              {athleteName.charAt(0).toUpperCase()}
            </button>
          </div>
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
