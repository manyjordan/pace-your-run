import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Watch, Loader2 } from "lucide-react";
import { CollapsibleDisclaimer } from "@/components/CollapsibleDisclaimer";
import { useToast } from "@/hooks/use-toast";
import { isHealthKitAvailable, requestHealthKitPermissions, fetchRecentRuns, isHealthKitAuthorized } from "@/lib/healthkit";
import { saveRun } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";

const HealthKitSync = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isAvailable] = useState(isHealthKitAvailable());
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSyncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [runsCount, setRunsCount] = useState(0);

  // Load last sync date and count
  useEffect(() => {
    const lastSync = localStorage.getItem("pace-healthkit-last-sync");
    if (lastSync) {
      setLastSyncDate(new Date(lastSync));
    }

    const count = localStorage.getItem("pace-healthkit-synced-count");
    if (count) {
      setRunsCount(parseInt(count, 10));
    }
  }, []);

  // Check authorization status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAvailable) {
        const authorized = await isHealthKitAuthorized();
        setIsAuthorized(authorized);
      }
    };

    checkAuth();
  }, [isAvailable]);

  const handleRequestPermissions = async () => {
    try {
      const authorized = await requestHealthKitPermissions();
      if (authorized) {
        setIsAuthorized(true);
        toast({
          title: "Autorisations accordées",
          description: "Vous pouvez importer vos courses depuis l'app Santé sur cet iPhone.",
        });
      } else {
        toast({
          title: "Autorisations refusées",
          description: "Veuillez autoriser l'accès à Apple Santé dans les paramètres",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
      toast({
        title: "Erreur",
        description: "Impossible de demander les autorisations",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    if (!session?.user?.id || !isAvailable) return;

    setSyncing(true);
    setSyncProgress(0);

    try {
      // Fetch recent runs from HealthKit
      const runs = await fetchRecentRuns(200);

      if (runs.length === 0) {
        toast({
          title: "Aucune nouvelle course",
          description: "Aucune course à importer depuis Santé pour le moment",
        });
        setSyncing(false);
        return;
      }

      let importedCount = 0;
      const totalRuns = runs.length;

      // Save each run to Supabase
      for (let i = 0; i < runs.length; i++) {
        try {
          await saveRun(session.user.id, runs[i]);
          importedCount++;
          setSyncProgress(Math.round((i + 1) / totalRuns * 100));
        } catch (error) {
          // Skip duplicates and errors
          console.error(`Error saving run ${i}:`, error);
        }
      }

      // Update last sync date and count
      const now = new Date();
      localStorage.setItem("pace-healthkit-last-sync", now.toISOString());
      localStorage.setItem("pace-healthkit-synced-count", (runsCount + importedCount).toString());

      setLastSyncDate(now);
      setRunsCount(prev => prev + importedCount);

      toast({
        title: "Import réussi",
        description: `${importedCount} nouvelle${importedCount > 1 ? "s" : ""} course${importedCount > 1 ? "s" : ""} importée${importedCount > 1 ? "s" : ""} depuis Apple Santé`,
      });
    } catch (error) {
      console.error("Error syncing HealthKit data:", error);
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer vos courses depuis Apple Santé sur cet appareil",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Importer depuis Apple Santé</h1>
      </ScrollReveal>

      {!isAvailable ? (
        <ScrollReveal>
          <Alert className="border-border bg-card">
            <Watch className="h-4 w-4 text-muted-foreground" />
            <AlertDescription>
              Disponible uniquement sur iPhone avec l'app Pace installée
            </AlertDescription>
          </Alert>
        </ScrollReveal>
      ) : !isAuthorized ? (
        <ScrollReveal>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Lecture de l'app Santé (import ponctuel)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Autorisez la lecture pour importer manuellement les séances présentes dans Santé sur cet iPhone. Pour un import par fichier (export.xml depuis l'export Apple), utilisez Paramètres → Importer l'historique.
              </p>
            </div>

                       <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Vos courses et sorties à pied enregistrées dans Santé</li>
              <li>• Fréquence cardiaque associée à ces séances (si disponible)</li>
              <li>• Calories brûlées pendant l'entraînement (si disponible)</li>
            </ul>

            <Button
              onClick={handleRequestPermissions}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Autoriser l'accès
            </Button>
          </div>
        </ScrollReveal>
      ) : (
        <>
          <ScrollReveal>
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Importer vos courses</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Lancez un import manuel depuis les données Santé sur cet iPhone. Pas de synchronisation automatique en arrière-plan.
                </p>
              </div>

              {isSyncing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Import en cours...</span>
                    <span className="text-accent font-semibold">{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Import...
                  </>
                ) : (
                  "Importer mes courses Apple Santé"
                )}
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Dernier import</p>
                  <p className="text-sm font-semibold mt-1">
                    {lastSyncDate
                      ? lastSyncDate.toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Jamais"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Courses importées (cumul)</p>
                  <p className="text-sm font-semibold mt-1">{runsCount}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </>
      )}

      <ScrollReveal>
        <CollapsibleDisclaimer
          variant="info"
          summary="Les courses importées depuis Apple Santé apparaissent dans votre historique Pace."
          fullText="L'import se fait sur votre action (fichier export.xml via l'écran Import, ou import ponctuel depuis l'app Santé sur iPhone après autorisation). Pace n'effectue pas de synchronisation automatique continue avec Apple Santé. Vos données restent privées et sécurisées."
        />
      </ScrollReveal>
    </div>
  );
};

export default HealthKitSync;
