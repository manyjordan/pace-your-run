import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Map, Trash2, Upload } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { deleteRoute, getRoutes, saveRoute, type RouteRow } from "@/lib/database";
import { parseGpxFile } from "@/lib/parsers/gpxParser";

const GPSMap = lazy(() => import("@/components/GPSMap"));

const SELECTED_ROUTE_KEY = "pace-selected-route";

export default function RoutesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const loadRoutes = useCallback(async () => {
    if (!user?.id) {
      setRoutes([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const rows = await getRoutes(user.id);
      setRoutes(rows);
    } catch {
      setRoutes([]);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos parcours.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user?.id]);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      const parsed = await parseGpxFile(file);
      await saveRoute(user.id, {
        name: parsed.title ?? file.name.replace(".gpx", ""),
        distance_km: parsed.distance_km,
        elevation_gain: parsed.elevation_gain ?? 0,
        gps_trace: parsed.gps_trace,
      });
      await loadRoutes();
      toast({
        title: "Parcours importé",
        description: "Le parcours GPX a été ajouté à votre bibliothèque.",
      });
    } catch {
      toast({
        title: "Import impossible",
        description: "Le fichier GPX est invalide ou non supporté.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!user?.id) return;
    try {
      await deleteRoute(routeId, user.id);
      await loadRoutes();
    } catch {
      toast({
        title: "Suppression impossible",
        description: "Le parcours n'a pas pu être supprimé.",
        variant: "destructive",
      });
    }
  };

  const handleUseRoute = (route: RouteRow) => {
    localStorage.setItem(SELECTED_ROUTE_KEY, JSON.stringify(route));
    toast({
      title: "Parcours sélectionné",
      description: "Il sera utilisé pour votre prochaine course.",
    });
  };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mes parcours</h1>
            <p className="text-sm text-muted-foreground">Importez et gérez vos traces GPX</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-accent/20 bg-card px-3 py-2 text-sm hover:border-accent/50">
            <Upload className="h-4 w-4 text-accent" />
            <span>{isImporting ? "Import..." : "Importer GPX"}</span>
            <input type="file" accept=".gpx" className="hidden" onChange={(e) => void handleImport(e)} />
          </label>
        </div>
      </ScrollReveal>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des parcours...</p>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Aucun parcours enregistré pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <Card key={route.id} className="border-accent/20">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{route.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {route.distance_km.toFixed(1)} km · {Math.round(route.elevation_gain)}m D+
                      {route.created_at
                        ? ` · ${new Date(route.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => void handleDeleteRoute(route.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                <Suspense fallback={<div className="h-[180px] animate-pulse rounded-lg bg-muted" />}>
                  <GPSMap trace={route.gps_trace} showFullTrace height={180} />
                </Suspense>

                <Button className="w-full" onClick={() => handleUseRoute(route)}>
                  <Map className="mr-2 h-4 w-4" />
                  Utiliser pour ma prochaine course
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
