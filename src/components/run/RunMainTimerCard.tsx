import { ScrollReveal } from "@/components/ScrollReveal";
import { Play, Heart } from "lucide-react";
import { FEATURES } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";
import { useCadence } from "@/hooks/useCadence";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useEffect, useMemo, useState } from "react";
import { getHRZones, getZoneForBpm } from "@/lib/heartRateZones";

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
  showControls?: boolean;
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
  pause: _pause,
  resume: _resume,
  stop: _stop,
  isProgrammedMode,
  isProgramActive,
  showControls = true,
}: Props) {
  const [tick, setTick] = useState(false);
  useEffect(() => {
    if (status !== "running") return;
    setTick((t) => !t);
  }, [elapsed, status]);

  const { cadence } = useCadence(FEATURES.CADENCE && status === "running");
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
  const colonPulseClass = cn("transition-opacity duration-200", tick ? "opacity-100" : "opacity-40");
  const hPart = Math.floor(elapsed / 3600);
  const mPart = Math.floor((elapsed % 3600) / 60);
  const sPart = elapsed % 60;
  const formattedPace = displayPace > 0 ? formatPace(displayPace).replace(` /${distanceUnitShortLabel}`, "") : "--:--";
  const formattedGap =
    gradeAdjustedPace > 0 ? formatPace(gradeAdjustedPace / 60).replace(` /${distanceUnitShortLabel}`, "") : null;

  if (status === "running" || status === "paused") {
    const formattedElapsed = formatTime(elapsed);
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 px-6 pt-safe">
        <div className="flex items-center gap-2">
          {status === "running" ? (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">En cours</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">En pause</span>
            </>
          )}
        </div>

        <div className="text-center">
          <div
            className="text-8xl font-black leading-none text-foreground"
            style={{ fontFamily: "var(--font-mono-display)", letterSpacing: "-0.04em" }}
          >
            {formattedPace || "--:--"}
          </div>
          <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
            /{distanceUnitShortLabel}
          </p>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
              {displayDistance.toFixed(2)}
            </div>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{distanceUnitShortLabel}</p>
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="text-center">
            <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
              {formattedElapsed}
            </div>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">chrono</p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 text-xs",
            gpsAccuracy && gpsAccuracy < 10
              ? "text-accent"
              : gpsAccuracy && gpsAccuracy < 30
                ? "text-yellow-500"
                : "text-muted-foreground",
          )}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-current" />
          {gpsAccuracy ? `GPS ±${Math.round(gpsAccuracy)}m` : "GPS en attente..."}
        </div>
      </div>
    );
  }

  return (
    <ScrollReveal>
      <div className="flex w-full flex-col items-center px-4 pb-2 pt-1">
        <div
          className="font-metric mb-1 flex items-baseline justify-center gap-0 text-8xl font-black leading-none text-foreground"
          style={{ letterSpacing: "-0.04em" }}
        >
          {hPart > 0 ? (
            <>
              <span>{hPart}</span>
              <span className="opacity-100">:</span>
              <span>{String(mPart).padStart(2, "0")}</span>
              <span className={colonPulseClass}>:</span>
              <span>{String(sPart).padStart(2, "0")}</span>
            </>
          ) : (
            <>
              <span>{String(mPart).padStart(2, "0")}</span>
              <span className={colonPulseClass}>:</span>
              <span>{String(sPart).padStart(2, "0")}</span>
            </>
          )}
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

          {FEATURES.CADENCE && cadence > 0 && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="font-metric text-3xl font-bold text-foreground">{cadence}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">spm</div>
              </div>
            </>
          )}

          {FEATURES.ELEVATION_REALTIME && elevationGain > 0 && (
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
      </div>
    </ScrollReveal>
  );
}
