import { cn } from "@/lib/utils";

type Props = {
  formatTime: (s: number) => string;
  elapsed: number;
  displayDistance: number;
  distanceUnitShortLabel: string;
  displayPace: number;
  formatPace: (p: number) => string;
  className?: string;
};

/**
 * Premium run screen — centre uniquement : allure (primaire) + distance + chrono.
 * GPS et actions sont gérés dans la page Run.
 */
export function RunMainTimerCard({
  formatTime,
  elapsed,
  displayDistance,
  distanceUnitShortLabel,
  displayPace,
  formatPace,
  className,
}: Props) {
  const formattedPace =
    displayPace > 0 ? formatPace(displayPace).replace(` /${distanceUnitShortLabel}`, "") : "--:--";
  const formattedElapsed = formatTime(elapsed);

  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-10 px-6", className)}>
      <div className="text-center">
        <div
          className="font-bold leading-none text-foreground"
          style={{
            fontFamily: "var(--font-mono-display)",
            fontSize: "88px",
            letterSpacing: "-0.04em",
          }}
        >
          {formattedPace || "--:--"}
        </div>
        <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
          /{distanceUnitShortLabel}
        </p>
      </div>

      <div className="flex items-center gap-12">
        <div className="text-center">
          <div
            className="text-4xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-mono-display)", letterSpacing: "-0.03em" }}
          >
            {displayDistance.toFixed(2)}
          </div>
          <p className="mt-1.5 text-xs uppercase tracking-widest text-muted-foreground">{distanceUnitShortLabel}</p>
        </div>

        <div className="h-12 w-px bg-border" />

        <div className="text-center">
          <div
            className="text-4xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-mono-display)", letterSpacing: "-0.03em" }}
          >
            {formattedElapsed}
          </div>
          <p className="mt-1.5 text-xs uppercase tracking-widest text-muted-foreground">chrono</p>
        </div>
      </div>
    </div>
  );
}
