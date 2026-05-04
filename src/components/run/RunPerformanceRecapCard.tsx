import { ScrollReveal } from "@/components/ScrollReveal";
import { ActivityPostCard } from "@/components/ActivityPostCard";
import { RunShareCard } from "@/components/run/RunShareCard";
import { GpsTraceSvg } from "@/components/GpsTraceSvg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppCard } from "@/components/ui/page-layout";
import type { RunRow } from "@/lib/database";
import { getRuns, getRunStatsLifetime, type RunStatsLifetimeRow } from "@/lib/database";
import { formatDuration, formatPaceFromSeconds, type CommunityPost } from "@/lib/runFormatters";
import { computeWeeklyStreakFromRuns, getEarnedAchievements, type AchievementStats } from "@/lib/achievements";
import type { RunSummary } from "@/hooks/useRunSession";
import type { User } from "@supabase/supabase-js";
import html2canvas from "html2canvas";
import { BarChart2, Share2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";

export type RunPerformanceRecapCardProps = {
  runSummary: RunSummary;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  distance: number;
  elapsed: number;
  setDistance: Dispatch<SetStateAction<number>>;
  stop: () => void | Promise<void>;
  isTreadmill: boolean;
  showTreadmillCorrection: boolean;
  treadmillSpeedKmh: number;
  correctedDistanceKm: string;
  setCorrectedDistanceKm: Dispatch<SetStateAction<string>>;
  setShowTreadmillCorrection: Dispatch<SetStateAction<boolean>>;
  postAudience: "private" | "friends" | "public";
  handleAudienceChange: (value: "private" | "friends" | "public") => Promise<void>;
  isUpdatingAudience: boolean;
  user: User | null;
  completedPostId: string | null;
  isSaving: boolean;
  handlePersistCompletedRun: () => void;
  completedPost: CommunityPost | null;
  setCompletedActivity: Dispatch<SetStateAction<RunRow | null>>;
  setCompletedPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setShowCompletedActivityDetail: Dispatch<SetStateAction<boolean>>;
};

function mapRowToBaseAchievementStats(row: RunStatsLifetimeRow | null, runs: RunRow[]): AchievementStats {
  const streak = computeWeeklyStreakFromRuns(runs);
  return {
    totalKm: Number(row?.total_distance_km ?? 0),
    totalRuns: Number(row?.total_runs ?? 0),
    longestRun: Number(row?.longest_run_km ?? 0),
    weeklyStreak: streak,
    bestPaceSecPerKm: Number(row?.best_pace_sec_per_km ?? 0),
    totalHours: Number(row?.total_duration_seconds ?? 0) / 3600,
  };
}

export function RunPerformanceRecapCard({
  runSummary,
  title,
  setTitle,
  distance,
  elapsed,
  setDistance,
  stop,
  isTreadmill,
  showTreadmillCorrection,
  treadmillSpeedKmh,
  correctedDistanceKm,
  setCorrectedDistanceKm,
  setShowTreadmillCorrection,
  postAudience,
  handleAudienceChange,
  isUpdatingAudience,
  user,
  completedPostId,
  isSaving,
  handlePersistCompletedRun,
  completedPost,
  setCompletedActivity,
  setCompletedPost,
  setShowCompletedActivityDetail,
}: RunPerformanceRecapCardProps) {
  const navigate = useNavigate();
  const [lifetimeRow, setLifetimeRow] = useState<RunStatsLifetimeRow | null>(null);
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLifetimeRow(null);
      setRecentRuns([]);
      setStatsLoaded(true);
      return;
    }
    let cancelled = false;
    void Promise.all([getRunStatsLifetime(user.id), getRuns(user.id)])
      .then(([row, runs]) => {
        if (cancelled) return;
        setLifetimeRow(row);
        setRecentRuns(runs ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setLifetimeRow(null);
          setRecentRuns([]);
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const sharePaceSecPerKm = useMemo(() => {
    if (!runSummary.distance || runSummary.distance <= 0) return 0;
    return Math.round(runSummary.duration / runSummary.distance);
  }, [runSummary.distance, runSummary.duration]);

  const userName =
    (user?.user_metadata?.first_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Coureur";

  const previousAchievementStats = useMemo(() => {
    if (!statsLoaded) return null;
    return mapRowToBaseAchievementStats(lifetimeRow, recentRuns);
  }, [lifetimeRow, recentRuns, statsLoaded]);

  const currentAchievementStats = useMemo((): AchievementStats | null => {
    if (!previousAchievementStats) return null;
    const runsWithCurrent = [...recentRuns, { started_at: runSummary.startedAt } as RunRow];
    const thisPace = runSummary.distance > 0 ? runSummary.duration / runSummary.distance : 0;
    return {
      totalKm: previousAchievementStats.totalKm + runSummary.distance,
      totalRuns: previousAchievementStats.totalRuns + 1,
      longestRun: Math.max(previousAchievementStats.longestRun, runSummary.distance),
      weeklyStreak: computeWeeklyStreakFromRuns(runsWithCurrent),
      bestPaceSecPerKm:
        previousAchievementStats.bestPaceSecPerKm > 0 && thisPace > 0
          ? Math.min(previousAchievementStats.bestPaceSecPerKm, thisPace)
          : thisPace > 0
            ? thisPace
            : previousAchievementStats.bestPaceSecPerKm,
      totalHours: previousAchievementStats.totalHours + runSummary.duration / 3600,
    };
  }, [previousAchievementStats, recentRuns, runSummary]);

  const newBadgeEarned = useMemo(() => {
    if (!previousAchievementStats || !currentAchievementStats) return null;
    const previousBadges = getEarnedAchievements(previousAchievementStats);
    const currentBadges = getEarnedAchievements(currentAchievementStats);
    return currentBadges.find((b) => !previousBadges.some((pb) => pb.id === b.id)) ?? null;
  }, [previousAchievementStats, currentAchievementStats]);

  const runDateLabel = useMemo(() => {
    try {
      return format(parseISO(runSummary.startedAt), "EEEE dd MMMM yyyy", { locale: fr });
    } catch {
      return format(new Date(), "EEEE dd MMMM yyyy", { locale: fr });
    }
  }, [runSummary.startedAt]);

  const gpsPointsForMap = useMemo(
    () => runSummary.gpsTrace.map((p) => ({ lat: p.lat, lng: p.lng })),
    [runSummary.gpsTrace],
  );

  const handleShare = async () => {
    const card = document.getElementById("run-share-card");
    if (!card) return;

    try {
      const canvas = await html2canvas(card, { scale: 2, backgroundColor: null });
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], "ma-course-pace.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `J'ai couru ${runSummary.distance.toFixed(2)} km !`,
            text: `${runSummary.distance.toFixed(2)} km en ${formatDuration(runSummary.duration)} à ${Math.floor(sharePaceSecPerKm / 60)}:${String(sharePaceSecPerKm % 60).padStart(2, "0")}/km avec Pace 🏃`,
          });
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ma-course-pace.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("[Run] Share failed", err);
    }
  };

  const handleViewDetail = () => setShowCompletedActivityDetail(true);
  const handleDone = () => navigate("/");

  const heroEmoji =
    runSummary.distance >= 42 ? "🏅" : runSummary.distance >= 21 ? "🥈" : runSummary.distance >= 10 ? "🏃" : "✅";

  return (
    <ScrollReveal>
      <Card className="border-accent/50 bg-accent/10">
        <CardContent className="p-5 space-y-3">
          {isTreadmill && showTreadmillCorrection && (
            <div className="space-y-4 rounded-lg border border-border/60 bg-background/60 p-3">
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">Distance calculée</p>
                <p className="text-3xl font-black tabular-nums">{distance.toFixed(2)} km</p>
                <p className="text-xs text-muted-foreground">
                  Basée sur {treadmillSpeedKmh} km/h pendant {Math.floor(elapsed / 60)}min
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Corriger la distance si nécessaire</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="100"
                    value={correctedDistanceKm}
                    onChange={(e) => setCorrectedDistanceKm(e.target.value)}
                    placeholder={distance.toFixed(2)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-lg font-bold tabular-nums focus:border-accent focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">km</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Le tapis affiche parfois une distance différente - corrigez si besoin
                </p>
              </div>

              <Button
                className="w-full bg-accent text-accent-foreground"
                onClick={() => {
                  if (correctedDistanceKm && parseFloat(correctedDistanceKm) > 0) {
                    setDistance(parseFloat(correctedDistanceKm));
                  }
                  setShowTreadmillCorrection(false);
                  void stop();
                }}
              >
                Confirmer et continuer
              </Button>
            </div>
          )}

          {(!isTreadmill || !showTreadmillCorrection) && (
            <div className="flex flex-col min-h-screen bg-background sm:min-h-0">
              {/* Header */}
              <div className="pt-safe pt-2 px-1 text-center">
                <div className="mb-2 text-4xl">{heroEmoji}</div>
                <h1 className="text-2xl font-black text-foreground">Course terminée !</h1>
                <p className="mt-1 text-sm text-muted-foreground">{runDateLabel}</p>
              </div>

              {/* Main stats */}
              <div className="mt-6 space-y-3 px-1">
                <div className="rounded-2xl bg-accent p-6 text-center text-white">
                  <p className="text-6xl font-black" style={{ fontFamily: "var(--font-mono-display)" }}>
                    {runSummary.distance.toFixed(2)}
                  </p>
                  <p className="mt-1 text-lg font-semibold opacity-80">kilomètres</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <AppCard className="py-4 text-center">
                    <p className="text-xl font-black text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                      {formatDuration(runSummary.duration)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">durée</p>
                  </AppCard>
                  <AppCard className="py-4 text-center">
                    <p className="text-xl font-black text-accent" style={{ fontFamily: "var(--font-mono-display)" }}>
                      {formatPaceFromSeconds(runSummary.duration, runSummary.distance)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">allure</p>
                  </AppCard>
                  <AppCard className="py-4 text-center">
                    <p className="text-xl font-black text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
                      +{Math.round(runSummary.elevation)}m
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">D+</p>
                  </AppCard>
                </div>

                {runSummary.averageHeartRate ? (
                  <p className="text-center text-xs text-muted-foreground">
                    FC moyenne : {runSummary.averageHeartRate} bpm
                  </p>
                ) : null}

                {isSaving ? <p className="text-center text-xs text-muted-foreground">Enregistrement en cours...</p> : null}

                {gpsPointsForMap.length > 2 ? (
                  <GpsTraceSvg trace={gpsPointsForMap} height={160} className="w-full" />
                ) : null}

                {newBadgeEarned ? (
                  <AppCard className="border-accent/30 bg-accent/5 py-4 text-center">
                    <p className="mb-1 text-2xl">{newBadgeEarned.emoji}</p>
                    <p className="font-bold text-foreground">Nouveau badge !</p>
                    <p className="text-sm text-muted-foreground">{newBadgeEarned.title}</p>
                  </AppCard>
                ) : null}
              </div>

              {/* Title & audience & save */}
              <div className="mt-6 space-y-3 px-1">
                <div className="space-y-2">
                  <Label htmlFor="run-title">Nom de la course</Label>
                  <Input
                    id="run-title"
                    value={title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTitle(v);
                      setCompletedActivity((a) => (a ? { ...a, title: v } : null));
                      setCompletedPost((p) => (p ? { ...p, title: v } : null));
                    }}
                    placeholder="Nom de votre course"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Audience de cette course</Label>
                  <Select
                    value={postAudience}
                    onValueChange={(value) => void handleAudienceChange(value as "private" | "friends" | "public")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir l'audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Moi uniquement</SelectItem>
                      <SelectItem value="friends">Mes amis</SelectItem>
                      <SelectItem value="public">Tout le monde</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {postAudience === "public"
                      ? "Cette course apparaît dans le fil public."
                      : postAudience === "friends"
                        ? "Cette course est masquée du fil public et réservée à l'audience amis."
                        : "Cette course reste visible uniquement par vous."}
                  </p>
                  {isUpdatingAudience ? <p className="text-xs text-muted-foreground">Mise à jour de l'audience...</p> : null}
                </div>
                {user && !completedPostId ? (
                  <Button
                    type="button"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isSaving}
                    onClick={() => handlePersistCompletedRun()}
                  >
                    {isSaving ? "Enregistrement…" : "Enregistrer la course"}
                  </Button>
                ) : null}
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-3 px-1 pb-safe pb-6">
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white active:scale-[0.99] transition-transform"
                >
                  <Share2 className="h-4 w-4" />
                  Partager ma course
                </button>
                <button
                  type="button"
                  onClick={handleViewDetail}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3.5 font-semibold text-foreground active:scale-[0.99] transition-transform"
                >
                  <BarChart2 className="h-4 w-4" />
                  Voir le détail
                </button>
                <button type="button" onClick={handleDone} className="w-full py-2 text-sm text-muted-foreground">
                  Retour à l&apos;accueil
                </button>
              </div>

              {completedPost ? <ActivityPostCard post={completedPost} onOpen={() => setShowCompletedActivityDetail(true)} /> : null}

              <div aria-hidden="true" style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }}>
                <RunShareCard
                  distance={runSummary.distance}
                  duration={runSummary.duration}
                  pace={sharePaceSecPerKm}
                  date={runSummary.startedAt}
                  userName={userName}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}
