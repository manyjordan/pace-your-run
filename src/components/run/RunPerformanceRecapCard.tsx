import { ScrollReveal } from "@/components/ScrollReveal";
import { ActivityPostCard } from "@/components/ActivityPostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RunRow } from "@/lib/database";
import { formatDuration as formatSocialDuration, formatPaceFromSeconds, type CommunityPost } from "@/lib/runFormatters";
import type { RunSummary } from "@/hooks/useRunSession";
import type { User } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";

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
            <>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Récapitulatif de performance</h3>
                <Button variant="outline" size="sm" onClick={() => setShowCompletedActivityDetail(true)}>
                  Ouvrir l'analyse
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {runSummary.averageHeartRate
                  ? `FC moyenne : ${runSummary.averageHeartRate} bpm`
                  : "Connectez une ceinture cardiaque pour mesurer votre FC"}
              </p>
              {isSaving && <p className="text-xs text-muted-foreground">Enregistrement en cours...</p>}
              <div className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-3">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold tabular-nums">{formatSocialDuration(runSummary.duration)}</div>
                    <div className="text-xs text-muted-foreground">Temps total</div>
                  </div>
                  {runSummary.movingTime && Math.abs(runSummary.duration - runSummary.movingTime) > 30 ? (
                    <div className="text-center border-l border-border pl-4">
                      <div className="text-2xl font-bold tabular-nums text-accent">
                        {formatSocialDuration(runSummary.movingTime)}
                      </div>
                      <div className="text-xs text-muted-foreground">Temps de course</div>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold tabular-nums">
                      {formatPaceFromSeconds(runSummary.duration, runSummary.distance)}
                    </div>
                    <div className="text-xs text-muted-foreground">Allure moyenne</div>
                  </div>
                  {runSummary.movingTime && Math.abs(runSummary.duration - runSummary.movingTime) > 30 ? (
                    <div className="text-center border-l border-border pl-4">
                      <div className="text-lg font-semibold tabular-nums text-accent">
                        {formatPaceFromSeconds(runSummary.movingTime, runSummary.distance)}
                      </div>
                      <div className="text-xs text-muted-foreground">Allure de course</div>
                    </div>
                  ) : null}
                </div>
              </div>
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
              {completedPost ? <ActivityPostCard post={completedPost} onOpen={() => setShowCompletedActivityDetail(true)} /> : null}
            </>
          )}
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}
