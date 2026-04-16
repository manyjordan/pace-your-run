import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, Pause, Square, MapPin, Zap, Heart, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { RunPreferences } from "@/lib/runPreferences";
import type { TreadmillRunControls } from "@/hooks/useTreadmill";

type RunStatus = "idle" | "running" | "paused";

type BluetoothState = {
  bluetoothDevice: string | null;
  heartRate: number | null;
};

type Props = {
  formatTime: (s: number) => string;
  elapsed: number;
  displayDistance: number;
  distanceUnitShortLabel: string;
  displayPace: number;
  formatPace: (p: number) => string;
  treadmill: TreadmillRunControls;
  bluetooth: BluetoothState;
  gpsAccuracy: number | null;
  getAccuracyColor: (accuracy: number | null) => string;
  isRunActive: boolean;
  runPreferences: RunPreferences;
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
  treadmill,
  bluetooth,
  gpsAccuracy,
  getAccuracyColor,
  isRunActive,
  runPreferences,
  status,
  start,
  pause,
  resume,
  stop,
  isProgrammedMode,
  isProgramActive,
}: Props) {
  return (
    <ScrollReveal>
      <Card className="border-accent/30">
        <CardContent className="p-6 flex flex-col items-center space-y-6">
          <div className="text-6xl font-black tracking-tighter tabular-nums text-foreground" style={{ lineHeight: 1.1 }}>
            {formatTime(elapsed)}
          </div>
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                Distance
                {isRunActive && !treadmill.isTreadmill && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center"
                          aria-label={
                            gpsAccuracy !== null
                              ? `Précision GPS : ${Math.round(gpsAccuracy)} m`
                              : "Précision GPS indisponible"
                          }
                        >
                          <span className={`h-2 w-2 rounded-full ${getAccuracyColor(gpsAccuracy)}`} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Précision GPS : {gpsAccuracy !== null ? `${Math.round(gpsAccuracy)}m` : "--"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isRunActive && treadmill.isTreadmill && (
                  <Badge variant="outline" className="border-muted-foreground/30 text-[10px] text-muted-foreground">
                    Mode tapis
                  </Badge>
                )}
              </div>
              {isRunActive && runPreferences.announceSplitSpeed && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Volume2 className="h-3 w-3 shrink-0" aria-hidden />
                  <span>Annonces vocales actives</span>
                </div>
              )}
              <div className="text-xl font-bold tabular-nums">{displayDistance.toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">{distanceUnitShortLabel}</div>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" /> Allure
              </div>
              <div className="text-xl font-bold tabular-nums">{formatPace(displayPace)}</div>
              <div className="text-[10px] text-muted-foreground">/{distanceUnitShortLabel}</div>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Heart className="h-3 w-3" /> Fréquence
              </div>
              {bluetooth.bluetoothDevice ? (
                <>
                  <div className="text-xl font-bold tabular-nums">{bluetooth.heartRate ?? "--"}</div>
                  <div className="text-[10px] text-muted-foreground">bpm</div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs font-medium text-muted-foreground text-center">
                    Pas d&apos;information disponible
                  </div>
                  <Link
                    to="/plan?tab=equipment&section=gear"
                    className="text-[10px] text-accent underline underline-offset-2"
                  >
                    Équipement requis pour mesurer la fréquence cardiquage
                  </Link>
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    Compatible ceintures cardiaques Bluetooth et montres Suunto, Garmin, Polar
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {status === "idle" && (
              <Button
                size="lg"
                onClick={start}
                disabled={isProgrammedMode && !isProgramActive}
                className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
              >
                <Play className="h-7 w-7 ml-0.5" />
              </Button>
            )}
            {status === "running" && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => void stop()}
                  className="h-14 w-14 rounded-full border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Square className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={pause}
                  className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
                >
                  <Pause className="h-7 w-7" />
                </Button>
              </>
            )}
            {status === "paused" && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => void stop()}
                  className="h-14 w-14 rounded-full border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Square className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={resume}
                  className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
                >
                  <Play className="h-7 w-7 ml-0.5" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}
