import { lazy, Suspense } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RouteRow, RunGpsPoint } from "@/lib/database";

const GPSMap = lazy(() => import("@/components/GPSMap"));
const RouteMap = lazy(() => import("@/components/RouteMap"));

type RunStatus = "idle" | "running" | "paused";

type Props = {
  activeRoute: RouteRow | null;
  gpsTrace: RunGpsPoint[];
  routeProgress: number;
  status: RunStatus;
  hasLiveGpsTrace: boolean;
};

export function RunLiveMapBlock({ activeRoute, gpsTrace, routeProgress, status, hasLiveGpsTrace }: Props) {
  return (
    <ScrollReveal>
      {hasLiveGpsTrace ? (
        <Card className="border-accent/30">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Carte en direct</p>
                <p className="text-xs text-muted-foreground">Votre tracé GPS se met à jour en temps réel</p>
              </div>
              <Badge variant="outline" className="border-accent/40 text-accent">
                {status === "running" ? "En direct" : "En pause"}
              </Badge>
            </div>
            <Suspense fallback={<div className="h-[220px] rounded-lg bg-muted animate-pulse" />}>
              {activeRoute ? (
                <RouteMap
                  referenceTrace={activeRoute.gps_trace}
                  liveTrace={gpsTrace}
                  isLive
                  height={220}
                  progressKm={routeProgress}
                  totalKm={activeRoute.distance_km}
                />
              ) : (
                <GPSMap trace={gpsTrace} isLive height={220} />
              )}
            </Suspense>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/30">
          <CardContent className="flex h-[220px] flex-col items-center justify-center gap-4 p-4">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <span className="absolute h-14 w-14 animate-ping rounded-full bg-accent/20" />
              <span className="relative h-5 w-5 rounded-full bg-accent" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold">Acquisition du signal GPS...</p>
              <p className="text-xs text-muted-foreground">
                Attendez les premiers points GPS pour afficher la carte en direct.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </ScrollReveal>
  );
}
