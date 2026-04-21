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
  const hasActiveRoute = Boolean(activeRoute);
  if (!hasActiveRoute || status !== "running") return null;

  return (
    <ScrollReveal>
      <Card className="border-accent/30">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Carte en direct</p>
              <p className="text-xs text-muted-foreground">Votre tracé GPS se met à jour en temps réel</p>
            </div>
            <Badge variant="outline" className="border-accent/40 text-accent">
              En direct
            </Badge>
          </div>
          <Suspense fallback={<div className="h-[220px] rounded-lg bg-muted animate-pulse" />}>
            <RouteMap
              referenceTrace={activeRoute.gps_trace}
              liveTrace={gpsTrace}
              isLive
              height={220}
              progressKm={routeProgress}
              totalKm={activeRoute.distance_km}
            />
          </Suspense>
          {!hasLiveGpsTrace ? (
            <p className="text-xs text-muted-foreground">Acquisition du signal GPS en cours...</p>
          ) : null}
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}
