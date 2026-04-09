import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { estimateVO2maxFromRuns, type VO2maxEstimate } from "@/lib/racePredictions";
import type { RunRow } from "@/lib/database";
import { formatDuration } from "@/lib/runFormatters";
import { cn } from "@/lib/utils";

const LEVEL_COLORS: Record<VO2maxEstimate["level"], string> = {
  very_low: "text-red-500",
  low: "text-orange-500",
  moderate: "text-yellow-500",
  good: "text-lime-500",
  excellent: "text-green-500",
  superior: "text-emerald-500",
};

const LEVEL_BAR_COLORS: Record<VO2maxEstimate["level"], string> = {
  very_low: "bg-red-500",
  low: "bg-orange-500",
  moderate: "bg-yellow-500",
  good: "bg-lime-500",
  excellent: "bg-green-500",
  superior: "bg-emerald-500",
};

const LEVEL_BAR_WIDTHS: Record<VO2maxEstimate["level"], string> = {
  very_low: "w-[15%]",
  low: "w-[30%]",
  moderate: "w-[48%]",
  good: "w-[64%]",
  excellent: "w-[80%]",
  superior: "w-full",
};

const VO2_WINDOW_CAPTION =
  "Estimation à partir de la distance et du temps cumulés sur les 3 dernières semaines (allure moyenne sur toutes vos sorties).";

export function VO2maxCard({ runs }: { runs: RunRow[] }) {
  const estimate = useMemo(() => estimateVO2maxFromRuns(runs), [runs]);

  if (!estimate) {
    return (
      <div className="rounded-xl border border-accent/20 bg-card/95 p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">VO2max estimée</h2>
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Enregistrez au moins 3 km cumulés sur les 3 dernières semaines pour estimer votre VO2max.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-card/95 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">VO2max estimée</h2>
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {estimate.trend === "up" && (
          <div className="flex items-center gap-1 text-xs font-medium text-green-500">
            <TrendingUp className="h-3.5 w-3.5" />
            +{estimate.trendValue} vs 3 sem. précédentes
          </div>
        )}
        {estimate.trend === "down" && (
          <div className="flex items-center gap-1 text-xs font-medium text-red-500">
            <TrendingDown className="h-3.5 w-3.5" />
            -{estimate.trendValue} vs 3 sem. précédentes
          </div>
        )}
        {estimate.trend === "stable" && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Minus className="h-3.5 w-3.5" />
            Stable
          </div>
        )}
      </div>

      <div className="mb-4 flex items-end gap-3">
        <span className={cn("text-4xl font-black tabular-nums", LEVEL_COLORS[estimate.level])}>
          {estimate.value}
        </span>
        <div className="mb-1">
          <p className="text-xs text-muted-foreground">ml/kg/min</p>
          <p className={cn("text-sm font-semibold", LEVEL_COLORS[estimate.level])}>{estimate.levelLabel}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              LEVEL_BAR_WIDTHS[estimate.level],
              LEVEL_BAR_COLORS[estimate.level],
            )}
          />
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-[10px] text-muted-foreground">25</span>
          <span className="text-[10px] text-muted-foreground">85+</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-6 gap-1">
        {(["Très faible", "Faible", "Moyen", "Bon", "Excellent", "Supérieur"] as const).map((label, i) => (
          <div key={label} className="text-center">
            <div
              className={cn(
                "mb-1 h-1 rounded-full",
                i === 0
                  ? "bg-red-500"
                  : i === 1
                    ? "bg-orange-500"
                    : i === 2
                      ? "bg-yellow-500"
                      : i === 3
                        ? "bg-lime-500"
                        : i === 4
                          ? "bg-green-500"
                          : "bg-emerald-500",
              )}
            />
            <p
              className={cn(
                "text-[9px] leading-tight",
                estimate.levelLabel === label ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {estimate.basedOnWindow && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">{VO2_WINDOW_CAPTION}</p>
          <p className="text-xs text-muted-foreground">
            {estimate.basedOnWindow.runCount} sortie{estimate.basedOnWindow.runCount > 1 ? "s" : ""} ·{" "}
            {estimate.basedOnWindow.totalDistanceKm.toFixed(1)} km ·{" "}
            {formatDuration(estimate.basedOnWindow.totalDurationSeconds)} (fenêtre 3 semaines)
          </p>
        </div>
      )}

      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        Estimation indicative liée à la forme récente lorsque vous courez régulièrement. Pas une mesure clinique.
      </p>
    </div>
  );
}
