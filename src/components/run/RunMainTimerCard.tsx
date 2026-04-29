import { ScrollReveal } from "@/components/ScrollReveal";
import { Pause, Play, Square, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { getHRZones, getZoneForBpm } from "@/lib/heartRateZones";
import { useCadence } from "@/hooks/useCadence";

type RunStatus = "idle" | "running" | "paused";

type BluetoothState = {
  isBluetoothConnected: boolean;
  heartRate: number | null;
};

type Props = {
  formatTime: (s: number) => string;
  elapsed: number;
  displayDistance: number;
  distanceUnitShortLabel: string;
  displayPace: number;
  formatPace: (p: number) => string;
  gradeAdjustedPace?: number;
  elevationGain?: number;
  bluetooth: BluetoothState;
  gpsAccuracy: number | null;
  status: RunStatus;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void | Promise<void>;
  isProgrammedMode: boolean;
  isProgramActive: boolean;
  estimatedFinishTimes: Array<{
    label: string;
    totalSeconds: number;
    remainingSeconds: number;
  }> | null;
};

export function RunMainTimerCard({
  formatTime,
  elapsed,
  displayDistance,
  distanceUnitShortLabel,
  displayPace,
  formatPace,
  gradeAdjustedPace = 0,
  elevationGain = 0,
  bluetooth,
  gpsAccuracy,
  status,
  start,
  pause,
  resume,
  stop,
  isProgrammedMode,
  isProgramActive,
  estimatedFinishTimes,
}: Props) {
  const { cadence } = useCadence(status === "running");
  const isBluetoothConnected = bluetooth.isBluetoothConnected;
  const heartRate = bluetooth.heartRate ?? 0;
  const maxHR = useMemo(() => {
    if (typeof window === "undefined") return 190;
    const parsed = Number.parseInt(localStorage.getItem("pace_max_hr") ?? "190", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 190;
  }, []);
  const hrZones = useMemo(() => getHRZones(maxHR), [maxHR]);
  const currentZone = useMemo(() => {
    if (!heartRate || heartRate <= 0) return null;
    return getZoneForBpm(heartRate, hrZones);
  }, [heartRate, hrZones]);
  const formattedElapsed = formatTime(elapsed);
  const formattedPace = displayPace > 0 ? formatPace(displayPace).replace(` /${distanceUnitShortLabel}`, "") : "--:--";
  const formattedGap =
    gradeAdjustedPace > 0 ? formatPace(gradeAdjustedPace / 60).replace(` /${distanceUnitShortLabel}`, "") : null;
  const isGpsGood = gpsAccuracy !== null && gpsAccuracy < 10;
  const isGpsMedium = gpsAccuracy !== null && gpsAccuracy < 30;

  return (
    <ScrollReveal>
      <div className="flex w-full flex-col items-center px-4 pb-2 pt-1">
        {status === "running" && (
          <div className="mb-6 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">Course en cours</span>
          </div>
        )}

        <div
          className="font-metric mb-1 text-8xl font-black leading-none text-foreground"
          style={{ letterSpacing: "-0.04em" }}
        >
          {formattedElapsed}
        </div>

        <div className="mb-8 mt-6 flex w-full items-center justify-center gap-8">
          <div className="text-center">
            <div className="font-metric text-3xl font-bold text-foreground">{displayDistance.toFixed(2)}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{distanceUnitShortLabel}</div>
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="text-center">
            <div className="font-metric text-3xl font-bold text-accent">{formattedPace}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">/{distanceUnitShortLabel}</div>
          </div>

          {cadence > 0 && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="font-metric text-3xl font-bold text-foreground">{cadence}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">spm</div>
              </div>
            </>
          )}

          {elevationGain > 0 && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="font-metric text-2xl font-bold text-foreground">+{Math.round(elevationGain)}m</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">D+</div>
              </div>
            </>
          )}

          {formattedGap && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="font-metric text-3xl font-bold text-foreground">{formattedGap}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">GAP</div>
              </div>
            </>
          )}

          {isBluetoothConnected && heartRate > 0 && currentZone && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 animate-pulse" style={{ color: currentZone.color }} />
                  <span className="font-metric text-3xl font-bold" style={{ color: currentZone.color }}>
                    {heartRate}
                  </span>
                  <span className="text-xs text-muted-foreground">bpm</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: currentZone.color }} />
                  <span className="text-xs font-semibold" style={{ color: currentZone.color }}>
                    Zone {currentZone.zone} - {currentZone.name}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {status === "running" && (
          <div className="mb-6 flex items-center gap-1.5">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isGpsGood ? "bg-accent" : isGpsMedium ? "bg-yellow-400" : "bg-red-400",
              )}
            />
            <span className="text-xs text-muted-foreground">
              {gpsAccuracy ? `GPS +/-${Math.round(gpsAccuracy)}m` : "GPS en attente..."}
            </span>
          </div>
        )}

        {status === "running" && estimatedFinishTimes && estimatedFinishTimes.length > 0 && (
          <div className="mt-4 w-full px-2">
            <p className="mb-2 text-center text-xs uppercase tracking-wider text-muted-foreground">A ce rythme</p>
            <div className="flex justify-center gap-3">
              {estimatedFinishTimes.map((est) => (
                <div key={est.label} className="flex-1 rounded-xl bg-muted p-3 text-center">
                  <p className="mb-1 text-xs text-muted-foreground">{est.label}</p>
                  <p className="font-metric text-lg font-bold text-foreground">{formatTime(Math.round(est.totalSeconds))}</p>
                  <p className="mt-0.5 text-xs text-accent">
                    encore {formatTime(Math.round(est.remainingSeconds))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === "idle" && (
          <button
            type="button"
            onClick={start}
            disabled={isProgrammedMode && !isProgramActive}
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full bg-accent shadow-lg transition-transform active:scale-95",
              isProgrammedMode && !isProgramActive && "cursor-not-allowed opacity-50 active:scale-100",
            )}
          >
            <Play className="ml-1 h-8 w-8 fill-white text-white" />
          </button>
        )}

        {status === "running" && (
          <div className="flex gap-6">
            <button
              type="button"
              onClick={pause}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted transition-transform active:scale-95"
            >
              <Pause className="h-6 w-6 text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 transition-transform active:scale-95"
            >
              <Square className="h-5 w-5 fill-destructive text-destructive" />
            </button>
          </div>
        )}

        {status === "paused" && (
          <div className="flex gap-6">
            <button
              type="button"
              onClick={resume}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-accent shadow-lg transition-transform active:scale-95"
            >
              <Play className="ml-1 h-7 w-7 fill-white text-white" />
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              className="self-center flex h-16 w-16 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 transition-transform active:scale-95"
            >
              <Square className="h-5 w-5 fill-destructive text-destructive" />
            </button>
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
