import { useRef, useState, type ChangeEvent } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import { getRuns, saveRun } from "@/lib/database";
import { parseAppleHealthFile } from "@/lib/parsers/appleHealthParser";
import { parseFitFile } from "@/lib/parsers/fitParser";
import { parseGpxFile } from "@/lib/parsers/gpxParser";
import { parseStravaZipFile } from "@/lib/parsers/stravaZipParser";
import { parseStravaCSV } from "@/lib/parsers/stravaCSVParser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sourceConfig, type ImportSource } from "@/lib/importInstructions";

function normalizeStartedAt(value: string) {
  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) {
    throw new Error("Date d'activite invalide.");
  }
  return normalized.toISOString();
}

function safeNormalizeStartedAt(value: string | null | undefined) {
  if (!value) return null;
  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) return null;
  return normalized.toISOString();
}

async function parseImportedRuns(source: ImportSource, file: File) {
  const lowerName = file.name.toLowerCase();

  if (source === "apple") {
    if (!lowerName.endsWith(".xml")) {
      throw new Error("Apple Sante attend le fichier export.xml.");
    }
    return parseAppleHealthFile(file);
  }

  if (source === "strava") {
    if (!lowerName.endsWith(".zip")) {
      throw new Error("Strava attend une archive ZIP complete.");
    }
    return parseStravaZipFile(file);
  }

  if (lowerName.endsWith(".zip")) return parseStravaZipFile(file);
  if (lowerName.endsWith(".gpx")) return [await parseGpxFile(file)];

  if (lowerName.endsWith(".fit")) {
    const parsed = await parseFitFile(file);
    if (!parsed) {
      throw new Error("Le fichier FIT n'a pas pu etre lu. Verifiez qu'il s'agit bien d'un export Garmin valide.");
    }
    return [parsed];
  }

  throw new Error("Format non pris en charge pour cette source.");
}

export default function ImportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [stravaImportMode, setStravaImportMode] = useState<"zip" | "csv">("zip");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectedSourceConfig = selectedSource ? sourceConfig[selectedSource] : null;

  const acceptedExtensions = selectedSource === "strava"
    ? stravaImportMode === "zip"
      ? ".zip"
      : ".csv"
    : selectedSourceConfig?.acceptedExtensions ?? "";

  async function saveRunsBulk(runsToSave: Array<Record<string, unknown>>) {
    if (!user?.id) return;
    const existingRuns = await getRuns(user.id);
    const existingStartedAt = new Set(
      existingRuns
        .map((run) => safeNormalizeStartedAt(run.started_at))
        .filter((value): value is string => Boolean(value)),
    );

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < runsToSave.length; i++) {
      const run = runsToSave[i] as {
        started_at?: string | null;
        title?: string | null;
        distance_km: number;
        duration_seconds: number;
        moving_time_seconds?: number | null;
        elevation_gain?: number | null;
        average_heartrate?: number | null;
        average_pace?: number | null;
        gps_trace?: Array<{ lat: number; lng: number; time: number }>;
        run_type?: string | null;
      };
      try {
        if (!run.started_at) {
          skipped++;
          continue;
        }
        const normalizedStart = normalizeStartedAt(run.started_at);
        if (existingStartedAt.has(normalizedStart)) {
          skipped++;
          continue;
        }

        await saveRun(user.id, {
          title: run.title ?? null,
          distance_km: run.distance_km,
          duration_seconds: run.duration_seconds,
          moving_time_seconds: run.moving_time_seconds ?? null,
          elevation_gain: run.elevation_gain ?? null,
          average_heartrate: run.average_heartrate ?? null,
          average_pace: run.average_pace ?? null,
          gps_trace: run.gps_trace ?? [],
          started_at: normalizedStart,
          run_type: run.run_type ?? "run",
        });
        existingStartedAt.add(normalizedStart);
        imported++;
      } catch {
        errors++;
      } finally {
        setProgress(Math.round(((i + 1) / runsToSave.length) * 100));
      }
    }

    setImportResult({ imported, skipped, errors });
    if (imported > 0) window.dispatchEvent(new Event("pace-runs-updated"));
  }

  async function handleFileImport(file: File) {
    if (!selectedSource || !user?.id) return;
    setError(null);
    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      if (selectedSource === "strava" && stravaImportMode === "csv") {
        const text = await file.text();
        const result = parseStravaCSV(text);
        await saveRunsBulk(result.runs);
        setImportResult((current) => ({
          imported: current?.imported ?? 0,
          skipped: (current?.skipped ?? 0) + result.skipped,
          errors: current?.errors ?? 0,
        }));
      } else {
        const parsed = await parseImportedRuns(selectedSource, file);
        await saveRunsBulk(
          parsed.map((run) => ({
            ...run,
            run_type: `import:${run.source}`,
          })),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible.");
    } finally {
      setIsImporting(false);
    }
  }

  async function onBrowseChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileImport(file);
    event.target.value = "";
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleFileImport(file);
  }

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="rounded-2xl border border-accent/60 bg-accent px-5 py-5 text-accent-foreground shadow-[0_18px_44px_hsl(var(--accent)/0.2)]">
          <h1 className="text-2xl font-bold tracking-tight">Importer mon historique de course</h1>
          <p className="mt-2 text-sm text-accent-foreground/85">
            Import guidé en 3 étapes. Analyse locale, aucun partage externe.
          </p>
        </div>
      </ScrollReveal>

      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
              currentStep >= s
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {currentStep > s ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                "h-0.5 w-8 transition-colors",
                currentStep > s ? "bg-accent" : "bg-muted"
              )} />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {currentStep === 1 ? "Source" : currentStep === 2 ? "Instructions" : "Import"}
        </span>
      </div>

      {importResult ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
                <p className="text-3xl font-black text-accent">{importResult.imported}</p>
                <p className="text-sm text-muted-foreground mt-1">courses importées</p>
                {importResult.skipped > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {importResult.skipped} activités ignorées (vélo, marche, natation...)
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedSource(null);
                    setImportResult(null);
                    setError(null);
                    setProgress(0);
                  }}
                >
                  Importer d'autres fichiers
                </Button>
                <Button
                  className="flex-1 bg-accent text-accent-foreground"
                  onClick={() => navigate("/")}
                >
                  Voir mes courses
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Sélection de la source</CardTitle>
                <CardDescription>Choisissez la plateforme de provenance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.entries(sourceConfig).map(([key, source]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedSource(key as ImportSource);
                        setError(null);
                        setTimeout(() => setCurrentStep(2), 300);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                        selectedSource === key
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      <source.icon className="h-6 w-6 text-accent" />
                      <span className="text-sm font-semibold">{source.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && selectedSourceConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
                <CardDescription>{selectedSourceConfig.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedSourceConfig.instructions.map((instruction, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                        {i + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-semibold">{instruction.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{instruction.description}</p>
                      </div>
                    </div>
                  ))}

                  <Button
                    className="w-full mt-4 bg-accent text-accent-foreground"
                    onClick={() => setCurrentStep(3)}
                  >
                    J'ai mon fichier, continuer
                  </Button>

                  <button
                    onClick={() => { setCurrentStep(1); setSelectedSource(null); }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                  >
                    Choisir une autre source
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && selectedSourceConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Import</CardTitle>
                <CardDescription>Formats acceptés : {acceptedExtensions}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSource === "strava" && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm font-medium">Choisissez votre type de fichier :</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setStravaImportMode("zip")}
                        className={cn(
                          "rounded-lg border-2 p-3 text-left transition-all",
                          stravaImportMode === "zip" ? "border-accent bg-accent/10" : "border-border"
                        )}
                      >
                        <p className="text-sm font-semibold">Archive ZIP</p>
                        <p className="text-xs text-muted-foreground">Complet — avec traces GPS</p>
                      </button>
                      <button
                        onClick={() => setStravaImportMode("csv")}
                        className={cn(
                          "rounded-lg border-2 p-3 text-left transition-all",
                          stravaImportMode === "csv" ? "border-accent bg-accent/10" : "border-border"
                        )}
                      >
                        <p className="text-sm font-semibold">activities.csv</p>
                        <p className="text-xs text-muted-foreground">Rapide — sans traces GPS</p>
                      </button>
                    </div>
                  </div>
                )}

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(e) => void onDrop(e)}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
                    isDragActive ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-accent/5"
                  )}
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    {isImporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  </div>
                  <p className="text-sm font-semibold">
                    {isImporting ? "Import en cours..." : "Glissez votre fichier ici ou cliquez pour parcourir"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Format attendu : {selectedSourceConfig.expectedText}</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={acceptedExtensions}
                    className="hidden"
                    onChange={(e) => void onBrowseChange(e)}
                  />
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{progress}%</p>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Import impossible</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Retour aux instructions
                </button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
