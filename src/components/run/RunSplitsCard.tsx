import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp } from "lucide-react";
import { haversineDistanceKm } from "@/lib/parsers/gpxParser";
import { convertPaceFromMinutesPerKm, type RunPreferences } from "@/lib/runPreferences";
import type { RunGpsPoint } from "@/lib/database";

type RunStatus = "idle" | "running" | "paused";

type Props = {
  elapsed: number;
  status: RunStatus;
  distance: number;
  gpsTrace: RunGpsPoint[];
  splitDistanceKm: number;
  distanceUnitShortLabel: string;
  runPreferences: RunPreferences;
  formatPace: (p: number) => string;
};

export function RunSplitsCard({
  elapsed,
  status,
  distance,
  gpsTrace,
  splitDistanceKm,
  distanceUnitShortLabel,
  runPreferences,
  formatPace,
}: Props) {
  if (!(elapsed > 0 && status !== "idle")) return null;

  return (
    <ScrollReveal>
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Splits ({distanceUnitShortLabel.toUpperCase()})</h3>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </div>
          {gpsTrace.length > 0 ? (
            Array.from({ length: Math.floor(distance / splitDistanceKm) }, (_, i) => {
              const splitStart = gpsTrace.findIndex((p) => {
                const d = gpsTrace.slice(0, gpsTrace.indexOf(p) + 1).reduce((acc, curr, idx) => {
                  if (idx === 0) return 0;
                  return acc + haversineDistanceKm(gpsTrace[idx - 1], curr);
                }, 0);
                return d >= i * splitDistanceKm;
              });
              const splitEnd = gpsTrace.findIndex((p) => {
                const d = gpsTrace.slice(0, gpsTrace.indexOf(p) + 1).reduce((acc, curr, idx) => {
                  if (idx === 0) return 0;
                  return acc + haversineDistanceKm(gpsTrace[idx - 1], curr);
                }, 0);
                return d >= (i + 1) * splitDistanceKm;
              });

              if (splitStart >= 0 && splitEnd > splitStart) {
                const splitTime = (gpsTrace[splitEnd].time - gpsTrace[splitStart].time) / 1000;
                const splitPace = (splitTime / 60) / splitDistanceKm;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-muted-foreground">
                      {runPreferences.distanceUnit === "mi" ? "Mile" : "Km"} {i + 1}
                    </span>
                    <span className="font-bold tabular-nums">
                      {formatPace(convertPaceFromMinutesPerKm(splitPace, runPreferences.distanceUnit))}
                    </span>
                  </div>
                );
              }
              return null;
            }).filter(Boolean)
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Attendez les données GPS...</p>
          )}
          {Math.floor(distance / splitDistanceKm) === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Le premier split apparaîtra à 1 {runPreferences.distanceUnit === "mi" ? "mile" : "km"}
            </p>
          )}
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}
