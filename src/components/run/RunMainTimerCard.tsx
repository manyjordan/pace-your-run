import { ScrollReveal } from "@/components/ScrollReveal";
import { Pause, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

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
  bluetooth: BluetoothState;
  gpsAccuracy: number | null;
  status: RunStatus;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void | Promise<void>;
  isProgrammedMode: boolean;
  isProgramActive: boolean;
};

export function RunMainTimerCard({
  formatTime,
  elapsed,
  displayDistance,
  distanceUnitShortLabel,
  displayPace,
  formatPace,
  bluetooth,
  gpsAccuracy,
  status,
  start,
  pause,
  resume,
  stop,
  isProgrammedMode,
  isProgramActive,
}: Props) {
  const isBluetoothConnected = bluetooth.isBluetoothConnected;
  const heartRate = bluetooth.heartRate ?? 0;
  const formattedElapsed = formatTime(elapsed);
  const formattedPace = displayPace > 0 ? formatPace(displayPace).replace(` /${distanceUnitShortLabel}`, "") : "--:--";
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

          {isBluetoothConnected && heartRate > 0 && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="font-metric text-3xl font-bold text-red-400">{heartRate}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">bpm</div>
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
