import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Apple,
  Archive,
  CheckCircle2,
  ChevronRight,
  FileArchive,
  FileText,
  Footprints,
  HeartPulse,
  Loader2,
  MapPinned,
  ShieldCheck,
  Smartphone,
  Upload,
  Watch,
} from "lucide-react";

import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import { getRuns, saveRun } from "@/lib/database";
import { parseAppleHealthFile } from "@/lib/parsers/appleHealthParser";
import { parseFitFile } from "@/lib/parsers/fitParser";
import { parseGpxFile, type ImportedRun } from "@/lib/parsers/gpxParser";
import { parseStravaZipFile } from "@/lib/parsers/stravaZipParser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ImportSource = "strava" | "garmin" | "nike" | "apple" | "gpx";

type PreviewRun = ImportedRun & {
  previewId: string;
};

type ImportResult = {
  imported: number;
  duplicates: number;
  failed: number;
};

import { sourceConfig, type SourceInstruction } from "@/lib/importInstructions";

function formatFileSize(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes} min`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
  if (Number.isNaN(normalized.getTime())) {
    return null;
  }
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

  if (lowerName.endsWith(".zip")) {
    return parseStravaZipFile(file);
  }

  if (lowerName.endsWith(".gpx")) {
    return [await parseGpxFile(file)];
  }

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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [source, setSource] = useState<ImportSource>("strava");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRuns, setPreviewRuns] = useState<PreviewRun[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragActive, setIsDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const currentSource = sourceConfig[source];

  const selectedCount = selectedIds.size;

  const selectionSummary = useMemo(() => {
    if (!previewRuns.length) return "Aucune activite detectee";
    return `${selectedCount} activites selectionnees sur ${previewRuns.length} trouvees`;
  }, [previewRuns.length, selectedCount]);

  async function handleFile(file: File) {
    setSelectedFile(file);
    setPreviewRuns([]);
    setSelectedIds(new Set());
    setParseError(null);
    setImportResult(null);
    setProgress(0);
    setIsParsing(true);

    try {
      const parsed = await parseImportedRuns(source, file);
      if (!parsed.length) {
        throw new Error(`Aucune activite exploitable trouvee. Format attendu : ${currentSource.expectedText}.`);
      }

      const preview = parsed.map((run, index) => ({
        ...run,
        previewId: `${normalizeStartedAt(run.started_at)}-${index}`,
      }));

      setPreviewRuns(preview);
      setSelectedIds(new Set(preview.map((run) => run.previewId)));
    } catch (error) {
      setParseError(
        error instanceof Error
          ? error.message
          : `Impossible de lire le fichier. Format attendu : ${currentSource.expectedText}.`,
      );
    } finally {
      setIsParsing(false);
    }
  }

  async function onBrowseChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  }

  function toggleRunSelection(previewId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(previewId)) {
        next.delete(previewId);
      } else {
        next.add(previewId);
      }
      return next;
    });
  }

  async function handleImport() {
    if (!user || !previewRuns.length || !selectedCount) return;

    setIsImporting(true);
    setImportResult(null);
    setProgress(0);

    const existingRuns = await getRuns(user.id);
    const existingStartedAt = new Set(
      existingRuns
        .map((run) => safeNormalizeStartedAt(run.started_at))
        .filter((value): value is string => Boolean(value)),
    );
    const selectedRuns = previewRuns.filter((run) => selectedIds.has(run.previewId));

    let imported = 0;
    let duplicates = 0;
    let failed = 0;

    for (let index = 0; index < selectedRuns.length; index += 1) {
      const run = selectedRuns[index];

      try {
        const normalizedStart = normalizeStartedAt(run.started_at);
        if (existingStartedAt.has(normalizedStart)) {
          duplicates += 1;
        } else {
          await saveRun(user.id, {
            title: run.title,
            distance_km: run.distance_km,
            duration_seconds: run.duration_seconds,
            elevation_gain: run.elevation_gain,
            average_heartrate: run.average_heartrate ?? null,
            gps_trace: run.gps_trace,
            started_at: normalizedStart,
            run_type: `import:${run.source}`,
          });
          existingStartedAt.add(normalizedStart);
          imported += 1;
        }
      } catch {
        failed += 1;
      } finally {
        setProgress(Math.round(((index + 1) / selectedRuns.length) * 100));
      }
    }

    setImportResult({ imported, duplicates, failed });
    if (imported > 0) {
      window.dispatchEvent(new Event("pace-runs-updated"));
    }
    setIsImporting(false);
  }

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="rounded-2xl border border-accent/60 bg-accent px-5 py-5 text-accent-foreground shadow-[0_18px_44px_hsl(var(--accent)/0.2)]">
          <h1 className="text-2xl font-bold tracking-tight">Importer mon historique de course</h1>
          <p className="mt-2 text-sm text-accent-foreground/85">
            Tout est analyse localement dans votre navigateur. Aucun fichier n'est envoye a un serveur externe.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.03}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Etape 1 — Choisissez votre source</CardTitle>
            <CardDescription>Sélectionnez la provenance de vos données avant d'importer votre fichier.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Object.entries(sourceConfig).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = source === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSource(key as ImportSource);
                    setSelectedFile(null);
                    setPreviewRuns([]);
                    setSelectedIds(new Set());
                    setParseError(null);
                    setImportResult(null);
                  }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-[0_12px_24px_hsl(var(--accent)/0.08)]"
                      : "border-border bg-card hover:border-accent/40 hover:bg-accent/5"
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold">{config.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{config.description}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.06}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Etape 2 — Instructions</CardTitle>
            <CardDescription>{currentSource.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSource.instructions.map((instruction, index) => {
              const Icon = instruction.icon;
              return (
                <div key={instruction.title} className="flex gap-4 rounded-xl border border-border p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold">{instruction.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{instruction.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.09}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Etape 3 — Déposez votre fichier</CardTitle>
            <CardDescription>Formats acceptés : {currentSource.acceptedExtensions}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                isDragActive ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                {isParsing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              </div>
              <p className="text-sm font-semibold">
                {isParsing ? "Analyse du fichier en cours..." : "Glissez votre fichier ici ou cliquez pour parcourir"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Analyse locale uniquement. Format attendu : {currentSource.expectedText}</p>
              <input
                ref={inputRef}
                type="file"
                accept={currentSource.acceptedExtensions}
                className="hidden"
                onChange={onBrowseChange}
              />
            </div>

            {selectedFile && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedFile.name}</Badge>
                  <Badge variant="outline">{formatFileSize(selectedFile.size)}</Badge>
                  {previewRuns.length > 0 && (
                    <Badge variant="outline">
                      {previewRuns.length} activite{previewRuns.length > 1 ? "s" : ""} trouvee{previewRuns.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {parseError && (
              <Alert variant="destructive">
                <AlertTitle>Impossible de lire le fichier</AlertTitle>
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.12}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Etape 4 — Prévisualisation et confirmation</CardTitle>
            <CardDescription>{selectionSummary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!previewRuns.length ? (
              <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                Importez un fichier pour afficher les activités détectées.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">OK</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRuns.map((run) => (
                      <TableRow key={run.previewId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(run.previewId)}
                            onCheckedChange={() => toggleRunSelection(run.previewId)}
                            aria-label={`Selectionner ${run.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatDate(run.started_at)}</p>
                            <p className="text-xs text-muted-foreground">{run.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{run.distance_km.toFixed(2)} km</TableCell>
                        <TableCell>{formatDuration(run.duration_seconds)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {run.source}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{selectionSummary}</p>
                  <Button
                    onClick={handleImport}
                    disabled={!user || !selectedCount || isImporting || isParsing}
                    className="bg-accent text-accent-foreground"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        Importer {selectedCount} activite{selectedCount > 1 ? "s" : ""}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Etape 5 — Progression de l'import</CardTitle>
            <CardDescription>Les activites sont inserees une par une dans Supabase, sans doublons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              {isImporting
                ? `Import en cours : ${progress}%`
                : importResult
                  ? `${importResult.imported} activites importees, ${importResult.duplicates} doublons ignores${importResult.failed ? `, ${importResult.failed} echec(s)` : ""}.`
                  : "Aucun import lance pour le moment."}
            </p>

            {importResult && (
              <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-sm font-semibold">Import termine</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {importResult.imported} activites importees, {importResult.duplicates} doublons ignores
                  {importResult.failed ? ` et ${importResult.failed} activites non importees.` : "."}
                </p>
                <div className="mt-3">
                  <Link to="/" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                    Retour a l'accueil
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
