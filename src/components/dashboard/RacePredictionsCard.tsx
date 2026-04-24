import { useMemo, useState } from "react";
import { Timer } from "lucide-react";
import type { RunRow } from "@/lib/database";
import {
  RACE_DISTANCES,
  formatPredictionTime,
  getPredictionEligibleRuns,
  getRacePrediction,
  type PredictionResult,
} from "@/lib/racePredictions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function confidenceBadge(conf: PredictionResult["confidence"]) {
  switch (conf) {
    case "high":
      return (
        <Badge className="border-0 bg-emerald-500/15 text-emerald-800">Élevée</Badge>
      );
    case "medium":
      return (
        <Badge className="border-0 bg-amber-500/15 text-amber-900">Moyenne</Badge>
      );
    default:
      return <Badge variant="secondary">Faible</Badge>;
  }
}

export function RacePredictionsCard({ runs }: { runs: RunRow[] }) {
  const defaultDistance = RACE_DISTANCES.find((d) => d.km === 10) ?? RACE_DISTANCES[1];
  const [selectedLabel, setSelectedLabel] = useState(defaultDistance.label);
  const [modelsOpen, setModelsOpen] = useState(false);

  const qualifyingCount = useMemo(() => getPredictionEligibleRuns(runs).length, [runs]);

  const selectedKm = useMemo(
    () => RACE_DISTANCES.find((d) => d.label === selectedLabel)?.km ?? 10,
    [selectedLabel],
  );

  const prediction = useMemo(
    () => getRacePrediction(runs, selectedKm, selectedLabel),
    [runs, selectedKm, selectedLabel],
  );

  const rangePositionPercent = useMemo(() => {
    if (!prediction) return 50;
    const { rangeMinSeconds, rangeMaxSeconds, consensusSeconds } = prediction;
    const span = rangeMaxSeconds - rangeMinSeconds;
    if (span <= 0) return 50;
    const p = ((consensusSeconds - rangeMinSeconds) / span) * 100;
    return Math.min(100, Math.max(0, p));
  }, [prediction]);

  return (
    <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Prévisions de performance</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimations à partir de vos courses des 3 dernières semaines (référence médiane par allure).
          </p>
        </div>
        <Select value={selectedLabel} onValueChange={setSelectedLabel}>
          <SelectTrigger className="h-9 w-[160px] text-xs" aria-label="Distance cible">
            <SelectValue placeholder="Distance" />
          </SelectTrigger>
          <SelectContent>
            {RACE_DISTANCES.map((d) => (
              <SelectItem key={d.label} value={d.label}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {qualifyingCount < 2 ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Enregistrez au moins 2 courses de plus de 3 km sur les 3 dernières semaines pour voir vos prévisions.
        </p>
      ) : !prediction ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Données insuffisantes pour estimer cette distance.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Course de référence (Riegel, Jack Daniels)</p>
            <p className="mt-1 text-sm font-medium text-foreground leading-snug">{prediction.reference.label}</p>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{prediction.reference.explanation}</p>
          </div>

          <Card className="border-lime-500/40 bg-lime-500/5">
            <CardContent className="space-y-2 p-4">
              <p className="text-3xl font-bold tabular-nums text-lime-600">
                {formatPredictionTime(prediction.consensusSeconds)}
              </p>
              <p className="text-sm font-medium text-foreground">Estimation consensus</p>
              <p className="text-xs text-muted-foreground">
                Basé sur vos {qualifyingCount} courses éligibles sur les 3 dernières semaines (&gt; 3 km). Le Riegel
                étendu moyenne vos 3 meilleures allures sur cette fenêtre.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Fourchette entre modèles</p>
            <div className="relative pt-1">
              <div className="h-3 w-full rounded-full bg-muted">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-lime-500 shadow-md shadow-lime-500/30"
                  style={{ left: `${rangePositionPercent}%` }}
                  aria-hidden
                />
              </div>
            </div>
            <div className="flex items-start justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-lime-600">
                  {formatPredictionTime(prediction.rangeMinSeconds)}
                </p>
                <p className="text-muted-foreground">Optimiste</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lime-600">
                  {formatPredictionTime(prediction.rangeMaxSeconds)}
                </p>
                <p className="text-muted-foreground">Prudent</p>
              </div>
            </div>
          </div>

          <Collapsible open={modelsOpen} onOpenChange={setModelsOpen}>
            <CollapsibleTrigger
              className={cn(
                "w-full text-left text-xs text-lime-700 underline underline-offset-2",
                "cursor-pointer hover:opacity-90",
              )}
            >
              {modelsOpen ? "Réduire ↑" : "Voir le détail des modèles ↓"}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {prediction.predictions.map((p) => (
                <div
                  key={p.model}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.model}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {formatPredictionTime(p.predictedSeconds)}
                    </span>
                    {confidenceBadge(p.confidence)}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
