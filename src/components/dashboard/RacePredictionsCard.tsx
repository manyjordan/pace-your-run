import { useMemo } from "react";
import type { RunRow } from "@/lib/database";
import {
  formatPredictionTime,
  getPredictionEligibleRuns,
  getRacePrediction,
} from "@/lib/racePredictions";

const RACE_DISTANCES = [
  { label: "5km", km: 5 },
  { label: "10km", km: 10 },
  { label: "Semi", km: 21.097 },
  { label: "Marathon", km: 42.195 },
] as const;

export function RacePredictionsCard({ runs }: { runs: RunRow[] }) {
  const qualifyingCount = useMemo(() => getPredictionEligibleRuns(runs).length, [runs]);

  const predictions = useMemo(
    () =>
      RACE_DISTANCES.map((d) => ({
        ...d,
        prediction: getRacePrediction(runs, d.km, d.label),
      })),
    [runs],
  );

  if (qualifyingCount < 2) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Vos temps estimés</p>
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Enregistrez au moins 2 courses de plus de 3 km pour voir vos temps estimés.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Vos temps estimés</p>
      <div className="grid grid-cols-2 gap-3">
        {predictions.map(({ label, prediction }) => (
          <div key={label} className="rounded-xl bg-muted/40 px-3 py-3 text-center">
            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
            <p className="font-metric text-lg font-bold text-foreground">
              {prediction ? formatPredictionTime(prediction.consensusSeconds) : "—"}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Basé sur vos {qualifyingCount} dernières courses
      </p>
    </div>
  );
}
