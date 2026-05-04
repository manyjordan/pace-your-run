import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getRuns, saveRun } from "@/lib/database";
import { parseAppleHealthFile } from "@/lib/parsers/appleHealthParser";
import type { ImportedRun } from "@/lib/parsers/gpxParser";
import type { StravaZipParseResult } from "@/lib/parsers/stravaZipParser";
import { parseStravaCSV } from "@/lib/parsers/stravaCSVParser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sourceConfig, type ImportSource } from "@/lib/importInstructions";
import { cache } from "@/lib/cache";

const GUIDED_IMPORT_SOURCES: Array<{
  icon: string;
  name: string;
  description: string;
  accepts: string;
  source: ImportSource;
}> = [
  {
    icon: "🟠",
    name: "Strava",
    description: "Exportez votre archive depuis Strava → Paramètres → Mon compte → Télécharger mes données",
    accepts: ".zip",
    source: "strava",
  },
  {
    icon: "🟣",
    name: "Garmin",
    description: "Exportez en GPX depuis Garmin Connect → Activité → Exporter",
    accepts: ".gpx,.fit",
    source: "garmin",
  },
  {
    icon: "📁",
    name: "Fichier GPX / FIT",
    description: "Importez directement un fichier GPX ou FIT",
    accepts: ".gpx,.fit",
    source: "gpx",
  },
];

const OTHER_IMPORT_SOURCES: ImportSource[] = ["nike", "apple", "suunto"];

function normalizeStartedAt(value: string) {
  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) {
    throw new Error("Date d'activité invalide.");
  }
  return normalized.toISOString();
}

function safeNormalizeStartedAt(value: string | null | undefined) {
  if (!value) return null;
  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) return null;
  return normalized.toISOString();
}

type ParsedImportBundle = {
  runs: ImportedRun[];
  /** Skips reported by parsers (e.g. non-run files in Strava ZIP). */
  parserSkipped?: number;
};

async function parseImportedRuns(source: ImportSource, file: File): Promise<ParsedImportBundle> {
  const lowerName = file.name.toLowerCase();

  if (source === "apple") {
    if (!lowerName.endsWith(".xml")) {
      throw new Error("Apple Sante attend le fichier export.xml.");
    }
    const runs = await parseAppleHealthFile(file);
    return { runs };
  }

  if (source === "strava") {
    if (!lowerName.endsWith(".zip")) {
      throw new Error("Strava attend une archive ZIP complete.");
    }
    const { parseStravaZipFile } = await import("@/lib/parsers/stravaZipParser");
    const zipResult: StravaZipParseResult = await parseStravaZipFile(file);
    return { runs: zipResult.runs, parserSkipped: zipResult.skipped };
  }

  if (lowerName.endsWith(".zip")) {
    const { parseStravaZipFile } = await import("@/lib/parsers/stravaZipParser");
    const zipResult: StravaZipParseResult = await parseStravaZipFile(file);
    return { runs: zipResult.runs, parserSkipped: zipResult.skipped };
  }
  if (lowerName.endsWith(".gpx")) {
    const { parseGpxFile } = await import("@/lib/parsers/gpxParser");
    return { runs: [await parseGpxFile(file)] };
  }

  if (lowerName.endsWith(".fit")) {
    const { parseFitFile } = await import("@/lib/parsers/fitParser");
    const parsed = await parseFitFile(file);
    if (!parsed) {
      throw new Error("Le fichier FIT n'a pas pu être lu. Vérifiez qu'il s'agit bien d'un export Garmin valide.");
    }
    return { runs: [parsed] };
  }

  throw new Error("Format non pris en charge pour cette source.");
}

export default function ImportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [currentStep, setCurrentStep] = useState<1 | 3>(1);
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [acceptFilter, setAcceptFilter] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [stravaImportMode, setStravaImportMode] = useState<"zip" | "csv">("zip");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectedSourceConfig = selectedSource ? sourceConfig[selectedSource] : null;

  const acceptedExtensions =
    acceptFilter ??
    (selectedSource === "strava"
      ? stravaImportMode === "zip"
        ? ".zip"
        : ".csv"
      : selectedSourceConfig?.acceptedExtensions ?? "");

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
    if (imported > 0) {
      cache.invalidate(`runs_${user.id}`);
      cache.invalidate(`runsStats_${user.id}`);
      sessionStorage.setItem("pace-runs-last-import-at", String(Date.now()));
      window.dispatchEvent(new Event("pace-runs-updated"));
      window.dispatchEvent(new Event("pace-community-updated"));
    }
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
        const { runs, parserSkipped = 0 } = await parseImportedRuns(selectedSource, file);
        await saveRunsBulk(
          runs.map((run) => ({
            ...run,
            run_type: `import:${run.source}`,
          })),
        );
        if (parserSkipped > 0) {
          setImportResult((current) => ({
            imported: current?.imported ?? 0,
            skipped: (current?.skipped ?? 0) + parserSkipped,
            errors: current?.errors ?? 0,
          }));
        }
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

  function handleImportSource(accepts: string, source: ImportSource) {
    const normalized = accepts.replace(/\s/g, "");
    setSelectedSource(source);
    setAcceptFilter(normalized);
    setError(null);
    if (source === "strava") setStravaImportMode("zip");
    setCurrentStep(3);
    window.setTimeout(() => inputRef.current?.click(), 0);
  }

  return (
    <div className="min-h-screen pb-safe">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="pt-safe" />
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Retour</span>
          </button>
          <h1 className="font-semibold text-foreground">Importer des courses</h1>
        </div>
      </div>

      <div className="space-y-6 px-0 pt-2">
      {importResult ? (
        <div className="px-4">
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
                    setAcceptFilter(null);
                    setImportResult(null);
                    setError(null);
                    setProgress(0);
                  }}
                >
                  Importer d'autres fichiers
                </Button>
                <Button
                  className="flex-1 bg-accent text-accent-foreground"
                  onClick={() => {
                    window.dispatchEvent(new Event("pace-runs-updated"));
                    navigate("/");
                  }}
                >
                  Voir mes courses
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      ) : (
        <>
          {currentStep === 1 && (
            <div className="space-y-3 px-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Importez vos courses depuis vos applications favorites.
              </p>

              {GUIDED_IMPORT_SOURCES.map((sourceRow) => (
                <button
                  key={sourceRow.name}
                  type="button"
                  onClick={() => handleImportSource(sourceRow.accepts, sourceRow.source)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all active:scale-95"
                >
                  <span className="text-2xl">{sourceRow.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{sourceRow.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{sourceRow.description}</p>
                  </div>
                  <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}

              <details className="rounded-xl border border-border bg-card">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
                  Autres sources (Nike, Apple Santé, Suunto…)
                </summary>
                <div className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-3">
                  {OTHER_IMPORT_SOURCES.map((key) => {
                    const source = sourceConfig[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleImportSource(source.acceptedExtensions, key)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all",
                          selectedSource === key ? "border-accent bg-accent/10" : "border-border hover:border-accent/50",
                        )}
                      >
                        <source.icon className="h-6 w-6 text-accent" />
                        <span className="text-xs font-semibold leading-tight">{source.label}</span>
                      </button>
                    );
                  })}
                </div>
              </details>
            </div>
          )}

          {currentStep === 3 && selectedSourceConfig && (
            <div className="px-4 pb-8">
            <Card>
              <CardHeader>
                <CardTitle>Import</CardTitle>
                <CardDescription>Formats acceptés : {acceptedExtensions}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSource === "strava" && (
                  <div className="mb-4 space-y-3">
                    <p className="text-sm font-medium">Choisissez votre type de fichier :</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStravaImportMode("zip");
                          setAcceptFilter(null);
                        }}
                        className={cn(
                          "rounded-lg border-2 p-3 text-left transition-all",
                          stravaImportMode === "zip" ? "border-accent bg-accent/10" : "border-border"
                        )}
                      >
                        <p className="text-sm font-semibold">Archive ZIP</p>
                        <p className="text-xs text-muted-foreground">Complet — avec traces GPS</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStravaImportMode("csv");
                          setAcceptFilter(null);
                        }}
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
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedSource(null);
                    setAcceptFilter(null);
                    setError(null);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Choisir une autre source
                </button>
              </CardContent>
            </Card>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
