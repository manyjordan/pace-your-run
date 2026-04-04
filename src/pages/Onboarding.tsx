import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Loader2, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { upsertProfile, saveRun } from "@/lib/database";
import { selectPlan, detectLevel } from "@/lib/planSelector";
import { getPlanById } from "@/lib/trainingPlans";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { parseGpxText } from "@/lib/parsers/gpxParser";
import { parseFitArrayBuffer } from "@/lib/parsers/fitParser";
import { parseAppleHealthXml } from "@/lib/parsers/appleHealthParser";
import { sourceConfig, type ImportSource } from "@/lib/importInstructions";
import JSZip from "jszip";

type OnboardingData = {
  firstName: string;
  gender: "homme" | "femme" | null;
  dateOfBirth: string;
  fitnessLevel: "beginner" | "intermediate" | "advanced" | null;
  goalType: "weight" | "distance" | "race" | null;
  raceType?: "5k" | "10k" | "20k" | "semi" | "marathon" | "other";
  raceDistance?: string;
  raceTargetDate?: string;
  raceTargetTime?: string;
  daysPerWeek: number | null;
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [importedRunsCount, setImportedRunsCount] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    gender: null,
    dateOfBirth: "",
    fitnessLevel: null,
    goalType: null,
    daysPerWeek: null,
  });

  useEffect(() => {
    if (!session?.user?.id) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      // Select plan based on collected data
      const plan = selectPlan({
        goalType: data.goalType || "distance",
        daysPerWeek: data.daysPerWeek || 3,
        weeksAvailable: 12,
        level: data.fitnessLevel || "beginner",
        targetDistance: data.raceType || "5k",
      });

      const goalData = {
        goalType: data.goalType,
        fitnessLevel: data.fitnessLevel,
        daysPerWeek: data.daysPerWeek,
        ...(data.goalType === "distance" && { raceType: data.raceType, raceDistanceKm: data.raceDistance }),
        ...(data.goalType === "race" && {
          raceType: data.raceType,
          raceDistanceKm: data.raceDistance,
          raceTargetDate: data.raceTargetDate,
          raceTargetTime: data.raceTargetTime,
        }),
        selectedPlanId: plan.id,
        goalSavedAt: new Date().toISOString(),
      };

      await upsertProfile(session.user.id, {
        first_name: data.firstName,
        gender: data.gender,
        date_of_birth: data.dateOfBirth || null,
        goal_type: data.goalType,
        goal_data: goalData,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      // Add small delay to ensure DB update is replicated
      await new Promise(resolve => setTimeout(resolve, 500));

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Onboarding error:", error);
      setIsLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={handleBack}
          disabled={step === 1 || isLoading}
          className="rounded-lg p-2 text-accent disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">{step}/6</span>
        <div className="w-10" />
      </div>

      {/* Progress indicator dots */}
      <div className="flex justify-center gap-2 px-4 py-4">
        {[1, 2, 3, 4, 5, 6].map((dotStep) => (
          <motion.div
            key={dotStep}
            className="h-1.5 rounded-full transition-all"
            animate={{
              width: dotStep === step ? 24 : 6,
              backgroundColor: dotStep <= step ? "hsl(var(--accent))" : "hsl(var(--border))",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden px-4 pb-20">
        <AnimatePresence mode="wait" custom={step > 1 ? 1 : -1}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={step > 1 ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-8 py-8"
            >
              <Step1Welcome onNext={handleNext} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={step > 2 ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6 py-8"
            >
              <Step2Import
                onNext={() => {
                  handleNext();
                }}
                importedCount={importedRunsCount}
                setImportedCount={setImportedRunsCount}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={step > 3 ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6 py-8"
            >
              <Step3Profile data={data} setData={setData} onNext={handleNext} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={step > 4 ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6 py-8"
            >
              <Step4Level data={data} setData={setData} onNext={handleNext} />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              custom={step > 5 ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6 py-8"
            >
              <Step5Goal data={data} setData={setData} onNext={handleNext} />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              custom={step > 6 ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6 py-8"
            >
              <Step6DaysPerWeek data={data} setData={setData} isLoading={isLoading} onComplete={handleComplete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* Step 1 — Welcome */
function Step1Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center">
      <div>
        <h1 className="text-4xl font-bold md:text-5xl">Pace</h1>
        <p className="mt-2 text-lg text-muted-foreground">Votre coach de course personnalisé</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-bold text-accent">✓</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Plans d'entraînement adaptés à votre niveau</p>
            <p className="text-sm text-muted-foreground">Découvrez des programmes personnalisés</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-bold text-accent">📊</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Suivez vos performances en temps réel</p>
            <p className="text-sm text-muted-foreground">Analysez chaque course en détail</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-bold text-accent">👥</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Rejoignez une communauté de coureurs</p>
            <p className="text-sm text-muted-foreground">Partagez vos exploits et progressez ensemble</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-bold text-accent">📥</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Importez votre historique existant</p>
            <p className="text-sm text-muted-foreground">Strava, Nike Run Club, Adidas Running...</p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 md:w-auto">
        Commencer
      </Button>
    </div>
  );
}

/* Date Picker Component */
function OnboardingDatePicker({
  id,
  label,
  value,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <div className="space-y-3">
      <Label htmlFor={id}>{required ? `${label}` : label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="w-full justify-between rounded-lg border-border bg-card text-left font-normal hover:border-accent hover:bg-accent/10"
          >
            <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
              {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: fr }) : "Choisir une date"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto rounded-lg border-border bg-card p-0 shadow-md"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
            className="rounded-lg bg-card p-3"
            classNames={{
              caption_label: "text-sm font-semibold text-foreground",
              head_cell: "w-9 rounded-md text-[0.75rem] font-medium text-muted-foreground",
              nav_button: "h-8 w-8 rounded-lg border border-accent/20 bg-card p-0 text-foreground opacity-100 hover:bg-accent hover:text-accent-foreground",
              day_today: "bg-accent/15 text-foreground",
              day_selected:
                "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* Step 2 — Import Data (OPTIONAL) */
function Step2Import({
  onNext,
  importedCount,
  setImportedCount,
}: {
  onNext: () => void;
  importedCount: number;
  setImportedCount: (count: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [expandedSource, setExpandedSource] = useState<ImportSource | null>(null);
  const { session } = useAuth();

  const sourceKeys = (["strava", "nike", "garmin", "apple"] as const);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    if (!session?.user?.id || files.length === 0) return;

    setIsImporting(true);
    try {
      let importedCount = 0;

      for (const file of files) {
        try {
          const fileName = file.name.toLowerCase();

          // Handle different file types
          if (fileName.endsWith(".zip")) {
            // Strava zip import
            const zip = new JSZip();
            const loaded = await zip.loadAsync(file);

            for (const filePath in loaded.files) {
              if (filePath.endsWith(".gpx")) {
                const gpxText = await loaded.files[filePath].async("text");
                const runs = parseGpxText(gpxText);
                for (const run of runs) {
                  await saveRun(session.user.id, {
                    title: run.name,
                    distance_km: run.distance,
                    duration_seconds: run.duration,
                    elevation_gain: run.elevation,
                    gps_trace: run.gpsTrace,
                    average_heartrate: run.heartRate,
                    started_at: run.startedAt,
                  });
                  importedCount++;
                }
              }
            }
          } else if (fileName.endsWith(".gpx")) {
            // GPX import
            const gpxText = await file.text();
            const runs = parseGpxText(gpxText);
            for (const run of runs) {
              await saveRun(session.user.id, {
                title: run.name,
                distance_km: run.distance,
                duration_seconds: run.duration,
                elevation_gain: run.elevation,
                gps_trace: run.gpsTrace,
                average_heartrate: run.heartRate,
                started_at: run.startedAt,
              });
              importedCount++;
            }
          } else if (fileName.endsWith(".fit")) {
            // FIT import
            const arrayBuffer = await file.arrayBuffer();
            const runs = parseFitArrayBuffer(arrayBuffer);
            for (const run of runs) {
              await saveRun(session.user.id, {
                title: run.name,
                distance_km: run.distance,
                duration_seconds: run.duration,
                elevation_gain: run.elevation,
                gps_trace: run.gpsTrace,
                average_heartrate: run.heartRate,
                started_at: run.startedAt,
              });
              importedCount++;
            }
          } else if (fileName.endsWith(".xml")) {
            // Apple Health import
            const xmlText = await file.text();
            const runs = parseAppleHealthXml(xmlText);
            for (const run of runs) {
              await saveRun(session.user.id, {
                title: run.name,
                distance_km: run.distance,
                duration_seconds: run.duration,
                elevation_gain: run.elevation,
                gps_trace: run.gpsTrace,
                average_heartrate: run.heartRate,
                started_at: run.startedAt,
              });
              importedCount++;
            }
          }
        } catch (error) {
          console.error(`Error importing ${file.name}:`, error);
        }
      }

      setImportedCount(importedCount);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Importer votre historique (optionnel)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vos données existantes vous aideront à affiner votre plan d'entraînement
        </p>
      </div>

      {/* Sources with expandable instructions */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Comment retrouver vos données ?</p>
        {sourceKeys.map((source) => {
          const config = sourceConfig[source];
          const isExpanded = expandedSource === source;

          return (
            <div key={source} className="rounded-lg border border-border bg-card/50">
              <button
                onClick={() => setExpandedSource(isExpanded ? null : source)}
                className="w-full flex items-center justify-between p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 text-left flex-1">
                  <config.icon className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-semibold text-sm">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="space-y-3 p-3 bg-muted/10">
                    {config.instructions.map((instruction, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{instruction.title}</p>
                            <p className="text-xs text-muted-foreground">{instruction.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload zone */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Importer vos fichiers</p>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging ? "border-accent bg-accent/10" : "border-border"
          }`}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">Déposez vos fichiers ici</p>
          <p className="text-sm text-muted-foreground">ou</p>
          <Label htmlFor="fileInput" className="mt-3 inline-block cursor-pointer text-accent hover:underline">
            parcourez votre appareil
          </Label>
          <input
            id="fileInput"
            type="file"
            multiple
            accept=".gpx,.fit,.xml,.zip"
            onChange={handleFileInput}
            disabled={isImporting}
            className="hidden"
          />
        </div>
      </div>

      {importedCount > 0 && (
        <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-700">
          ✓ {importedCount} activité{importedCount > 1 ? "s" : ""} importée{importedCount > 1 ? "s" : ""} avec succès
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={onNext}
          disabled={isImporting}
          variant="outline"
          className="flex-1"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Import en cours...
            </>
          ) : (
            "Passer cette étape"
          )}
        </Button>
        <Button
          onClick={onNext}
          disabled={isImporting}
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

/* Step 3 — Profile */
function Step3Profile({
  data,
  setData,
  onNext,
}: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
}) {
  const canContinue = 
    data.firstName.trim().length > 0 && 
    data.gender !== null && 
    data.dateOfBirth.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Parlez-nous de vous</h2>
      </div>

      <div className="space-y-3">
        <Label htmlFor="firstName">Prénom</Label>
        <Input
          id="firstName"
          type="text"
          placeholder="Votre prénom"
          value={data.firstName}
          onChange={(e) => setData({ ...data, firstName: e.target.value })}
          className="border-border"
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Vous êtes</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["homme", "femme"] as const).map((gender) => (
            <motion.button
              key={gender}
              whileTap={{ scale: 0.97 }}
              onClick={() => setData({ ...data, gender })}
              className={`relative rounded-lg border-2 px-4 py-6 text-center transition-all ${
                data.gender === gender
                  ? "border-accent bg-accent/10 shadow-[0_0_0_2px_hsl(var(--accent))]"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <div className="text-3xl">{gender === "homme" ? "👨" : "👩"}</div>
              <p className="mt-2 font-semibold capitalize">{gender}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <OnboardingDatePicker
        id="dob"
        label="Date de naissance"
        value={data.dateOfBirth}
        onChange={(date) => setData({ ...data, dateOfBirth: date })}
        required
      />

      <Button onClick={onNext} disabled={!canContinue} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        Suivant
      </Button>
    </div>
  );
}

/* Step 4 — Level */
function Step4Level({
  data,
  setData,
  onNext,
}: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
}) {
  const levels = [
    { id: "beginner", title: "Débutant", desc: "Je cours occasionnellement ou je débute", range: "0-20 km/sem" },
    {
      id: "intermediate",
      title: "Intermédiaire",
      desc: "Je cours régulièrement, 2-4 fois par semaine",
      range: "20-50 km/sem",
    },
    { id: "advanced", title: "Avancé", desc: "Je cours plus de 50km par semaine", range: "50+ km/sem" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quel est votre niveau ?</h2>
      </div>

      <div className="space-y-3">
        {levels.map((level) => (
          <motion.button
            key={level.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setData({ ...data, fitnessLevel: level.id as any })}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              data.fitnessLevel === level.id
                ? "border-accent bg-accent/10 shadow-[0_0_0_2px_hsl(var(--accent))]"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
                {level.id === "beginner" ? "1" : level.id === "intermediate" ? "2" : "3"}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{level.title}</p>
                <p className="text-sm text-muted-foreground">{level.desc}</p>
                <p className="mt-1 text-xs text-muted-foreground">{level.range}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <Button
        onClick={onNext}
        disabled={!data.fitnessLevel}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        Suivant
      </Button>
    </div>
  );
}

/* Step 5 — Goal */
function Step5Goal({
  data,
  setData,
  onNext,
}: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
}) {
  const goals = [
    {
      id: "weight",
      title: "Perdre du poids",
      desc: "Brûler des calories et améliorer ma condition physique",
    },
    { id: "distance", title: "Courir une distance", desc: "M'entraîner pour atteindre une distance cible" },
    {
      id: "race",
      title: "Préparer une course",
      desc: "M'entraîner pour une compétition avec un objectif de temps",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quel est votre objectif ?</h2>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <motion.button
            key={goal.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setData({ ...data, goalType: goal.id as any })}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              data.goalType === goal.id
                ? "border-accent bg-accent/10 shadow-[0_0_0_2px_hsl(var(--accent))]"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
                {goal.id === "weight" ? "W" : goal.id === "distance" ? "D" : "R"}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{goal.title}</p>
                <p className="text-sm text-muted-foreground">{goal.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Distance selector */}
      {data.goalType === "distance" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Label>Distance cible</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["5k", "10k", "20k", "semi", "marathon"] as const).map((dist) => (
              <motion.button
                key={dist}
                whileTap={{ scale: 0.97 }}
                onClick={() => setData({ ...data, raceType: dist, raceDistance: undefined })}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all ${
                  data.raceType === dist && data.raceDistance === undefined
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/50"
                }`}
              >
                {dist.toUpperCase()}
              </motion.button>
            ))}
          </div>
          
          {/* Custom distance option */}
          <div className="space-y-2">
            <Label htmlFor="customDistance">Ou choisir une distance personnalisée</Label>
            <Input
              id="customDistance"
              type="number"
              placeholder="ex: 30 km"
              value={data.raceDistance && data.raceType === "other" ? data.raceDistance : ""}
              onChange={(e) => setData({ ...data, raceType: "other" as any, raceDistance: e.target.value })}
              className="border-border"
            />
            {data.raceDistance && data.raceType === "other" && (
              <p className="text-xs text-accent">Distance personnalisée: {data.raceDistance} km</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Race selector */}
      {data.goalType === "race" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Label>Distance de la course</Label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(["5k", "10k", "20k", "semi", "marathon"] as const).map((dist) => (
              <motion.button
                key={dist}
                whileTap={{ scale: 0.97 }}
                onClick={() => setData({ ...data, raceType: dist, raceDistance: undefined })}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all ${
                  data.raceType === dist && data.raceDistance === undefined
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/50"
                }`}
              >
                {dist.toUpperCase()}
              </motion.button>
            ))}
          </div>

          {/* Custom race distance option */}
          <div className="space-y-2">
            <Label htmlFor="customRaceDistance">Ou choisir une distance personnalisée</Label>
            <Input
              id="customRaceDistance"
              type="number"
              placeholder="ex: 30 km"
              value={data.raceDistance && data.raceType === "other" ? data.raceDistance : ""}
              onChange={(e) => setData({ ...data, raceType: "other" as any, raceDistance: e.target.value })}
              className="border-border"
            />
            {data.raceDistance && data.raceType === "other" && (
              <p className="text-xs text-accent">Distance personnalisée: {data.raceDistance} km</p>
            )}
          </div>

          <OnboardingDatePicker
            id="raceDate"
            label="Date de la course"
            value={data.raceTargetDate || ""}
            onChange={(date) => setData({ ...data, raceTargetDate: date })}
          />

          <div className="space-y-3">
            <Label htmlFor="raceTime">Objectif de temps (mm:ss)</Label>
            <Input
              id="raceTime"
              type="text"
              placeholder="ex: 45:30"
              value={data.raceTargetTime || ""}
              onChange={(e) => setData({ ...data, raceTargetTime: e.target.value })}
              className="border-border"
              required
            />
            <p className="text-xs text-muted-foreground">Ce temps sera utilisé pour personnaliser votre plan d'entraînement</p>
          </div>
        </motion.div>
      )}

      <Button
        onClick={onNext}
        disabled={!data.goalType || (data.goalType !== "weight" && !data.raceType) || (data.goalType === "race" && !data.raceTargetTime)}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        Suivant
      </Button>
    </div>
  );
}

/* Step 6 — Days Per Week */
function Step6DaysPerWeek({
  data,
  setData,
  isLoading,
  onComplete,
}: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  isLoading: boolean;
  onComplete: () => void;
}) {
  const days = [
    { id: 2, title: "2 jours", desc: "Idéal pour débuter en douceur" },
    { id: 3, title: "3 jours", desc: "Le meilleur équilibre progression/récupération" },
    { id: 4, title: "4 jours", desc: "Pour progresser rapidement" },
    { id: 5, title: "5 jours", desc: "Pour les coureurs expérimentés" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Combien de jours par semaine pouvez-vous courir ?</h2>
      </div>

      <div className="space-y-3">
        {days.map((day) => (
          <motion.button
            key={day.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setData({ ...data, daysPerWeek: day.id })}
            disabled={isLoading}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all disabled:opacity-50 ${
              data.daysPerWeek === day.id
                ? "border-accent bg-accent/10 shadow-[0_0_0_2px_hsl(var(--accent))]"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
                {day.id}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{day.title}</p>
                <p className="text-sm text-muted-foreground">{day.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <Button
        onClick={onComplete}
        disabled={!data.daysPerWeek || isLoading}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Création de votre plan personnalisé...
          </>
        ) : (
          "Créer mon plan"
        )}
      </Button>
    </div>
  );
}

export default Onboarding;
