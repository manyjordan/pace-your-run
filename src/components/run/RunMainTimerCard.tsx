import { ScrollReveal } from "@/components/ScrollReveal";
import { Pause, Play, Square, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { getHRZones, getZoneForBpm } from "@/lib/heartRateZones";
import { useCadence } from "@/hooks/useCadence";
import { InfoTooltip } from "@/components/InfoTooltip";

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
  isLandscape?: boolean;
  showControls?: boolean;
  showStatusBadge?: boolean;
  showGpsStatus?: boolean;
  showEstimatedFinish?: boolean;
  currentKmSplit?: {
    kmNumber: number;
    elapsedAtKmStart: number;
    distanceAtKmStart: number;
  } | null;
  currentKmPaceSec?: number;
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
  isLandscape = false,
  showControls = true,
  showStatusBadge = true,
  showGpsStatus = true,
  showEstimatedFinish = true,
  currentKmSplit = null,
  currentKmPaceSec = 0,
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
  const formatPaceFromSeconds = (paceSec: number): string => {
    if (!paceSec || paceSec <= 0) return "--:--";
    const wholeMin = Math.floor(paceSec / 60);
    const secs = Math.round(paceSec % 60);
    const safeSecs = secs === 60 ? 59 : secs;
    return `${wholeMin}:${String(safeSecs).padStart(2, "0")}`;
  };
  const isGpsGood = gpsAccuracy !== null && gpsAccuracy < 10;
  const isGpsMedium = gpsAccuracy !== null && gpsAccuracy < 30;

  if (isLandscape && status === "running") {
    return (
      <div className="flex h-screen w-full items-center justify-between px-8 py-4">
        <div className="flex flex-col items-center">
          <div className="font-metric text-7xl font-black leading-none text-foreground">{formattedElapsed}</div>
          <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">durée</div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="font-metric text-5xl font-bold text-foreground">{displayDistance.toFixed(2)}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{distanceUnitShortLabel}</div>
          </div>
          <div className="text-center">
            <div className="font-metric text-4xl font-bold text-accent">{formattedPace}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">/{distanceUnitShortLabel}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {cadence > 0 && (
            <div className="text-center">
              <div className="font-metric text-3xl font-bold text-foreground">{cadence}</div>
              <div className="text-xs uppercase text-muted-foreground">spm</div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={pause}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted active:scale-95"
            >
              <Pause className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 active:scale-95"
            >
              <Square className="h-5 w-5 fill-destructive text-destructive" />
            </button>
          </div>
          {elevationGain > 0 ? (
            <div className="text-center">
              <div className="font-metric text-xl font-bold text-foreground">+{Math.round(elevationGain)}m</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">D+</div>
            </div>
          ) : null}
          {formattedGap ? (
            <div className="text-center">
              <div className="font-metric text-xl font-bold text-foreground">{formattedGap}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">GAP</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <ScrollReveal>
      <div className="flex w-full flex-col items-center px-4 pb-2 pt-1">
        {showStatusBadge && status === "running" && (
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
                  <InfoTooltip
                    content={`Zone ${currentZone.zone} : ${currentZone.description}. Plage : ${currentZone.minBpm}-${currentZone.maxBpm} bpm.`}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {showGpsStatus && status === "running" && (
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

        {showEstimatedFinish && status === "running" && estimatedFinishTimes && estimatedFinishTimes.length > 0 && (
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

        {status === "running" && currentKmSplit && currentKmPaceSec > 0 && (
          <div className="mt-4 flex w-full items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              <span className="text-xs font-medium text-muted-foreground">Km {currentKmSplit.kmNumber} en cours</span>
            </div>
            <span className="font-metric text-sm font-bold text-foreground">
              {formatPaceFromSeconds(currentKmPaceSec)} /km
            </span>
          </div>
        )}

        {showControls && status === "idle" && (
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

        {showControls && status === "running" && (
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

        {showControls && status === "paused" && (
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
