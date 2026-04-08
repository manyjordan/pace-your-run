import { ScrollReveal } from "@/components/ScrollReveal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DaySelector, defaultDaysForWeekCount } from "@/components/goal/DaySelector";
import { DistanceSelector } from "@/components/goal/DistanceSelector";
import { GoalTimePicker } from "@/components/goal/GoalTimePicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Scale, Route, Trophy, AlertCircle, AlertTriangle, Info, Calendar as CalendarIcon, Zap } from "lucide-react";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, upsertProfile, getRuns } from "@/lib/database";
import { selectPlan, detectLevel } from "@/lib/planSelector";
import { mapSessionsToDays } from "@/lib/plans";
import type { TrainingPlan } from "@/lib/trainingPlans";
import {
  calculateWeeksAvailable,
  mapDistanceToTargetDistance,
  mapRaceTypeToTargetDistance,
  normalizeGoalData,
  racePresetDistance,
  validateRaceTargetTime,
} from "@/lib/goalHelpers";

type GoalType = "weight" | "race" | "distance";
type RaceType = "marathon" | "semi" | "20k" | "10k" | "5k" | "other";

type ProfileGoalData = {
  weightKg: string;
  goalType: GoalType;
  availableDays: string[];
  targetWeightKg: string;
  weightTargetDate: string;
  raceType: RaceType;
  raceDistanceKm: string;
  raceTargetTime: string;
  raceTargetDate: string;
  distanceKm: string;
  distanceTargetDate: string;
  level?: "beginner" | "intermediate" | "advanced";
  selectedPlanId?: string;
  goalSavedAt?: string;
};

const defaultData: ProfileGoalData = {
  weightKg: "",
  goalType: "weight",
  availableDays: [],
  targetWeightKg: "",
  weightTargetDate: "",
  raceType: "marathon",
  raceDistanceKm: "42.195",
  raceTargetTime: "",
  raceTargetDate: "",
  distanceKm: "",
  distanceTargetDate: "",
  level: "beginner",
  selectedPlanId: undefined,
};

const goalOptions = [
  { type: "weight" as const, icon: Scale, title: "Poids", description: "Définissez un poids cible.", color: "text-accent-foreground", bgColor: "bg-accent/15", borderColor: "border-accent" },
  { type: "race" as const, icon: Trophy, title: "Course", description: "Choisissez votre format de course et un temps cible.", color: "text-accent-foreground", bgColor: "bg-accent/15", borderColor: "border-accent" },
  { type: "distance" as const, icon: Route, title: "Distance", description: "Fixez une distance et une date objectif.", color: "text-accent-foreground", bgColor: "bg-accent/15", borderColor: "border-accent" },
];

function GoalDatePicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="w-full justify-between rounded-xl border-accent/30 bg-card text-left font-normal hover:border-accent hover:bg-accent/10"
          >
            <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
              {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: fr }) : "Choisir une date"}
            </span>
            <CalendarIcon className="h-4 w-4 text-accent" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto rounded-2xl border-accent/30 bg-card p-0 shadow-[0_18px_40px_hsl(var(--accent)/0.14)]"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
            className="rounded-2xl bg-card p-3"
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

export default function GoalTab() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileGoalData>(defaultData);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [changeWarning, setChangeWarning] = useState<boolean>(false);
  const [isDefining, setIsDefining] = useState<boolean>(true);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [detectedLevel, setDetectedLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [showCustomDistance, setShowCustomDistance] = useState(false);
  const [showCustomRaceDistance, setShowCustomRaceDistance] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setFormData(defaultData);
        setSavedAt(null);
        setIsDefining(true);
        setIsChanging(false);
        setIsLoading(false);
        return;
      }

      try {
        // Load profile and runs to detect level
        const [profile, runs] = await Promise.all([
          getProfile(user.id),
          getRuns(user.id),
        ]);

        const goalData = profile?.goal_data;
        const normalizedGoalData = normalizeGoalData(goalData as Partial<ProfileGoalData>);
        const rawGoal =
          goalData && typeof goalData === "object" && !Array.isArray(goalData)
            ? (goalData as Record<string, unknown>)
            : {};
        let availableDays: string[] = [];
        if (profile?.available_days && Array.isArray(profile.available_days) && profile.available_days.length >= 2) {
          availableDays = profile.available_days.filter((x): x is string => typeof x === "string");
        } else {
          const rawAvailable = rawGoal.availableDays;
          if (Array.isArray(rawAvailable)) {
            availableDays = rawAvailable.filter((x): x is string => typeof x === "string");
          }
          if (availableDays.length < 2) {
            const legacy = String(normalizedGoalData.availableDaysPerWeek ?? normalizedGoalData.daysPerWeek ?? "");
            const n = Number(legacy);
            if (n >= 2 && n <= 5) {
              availableDays = defaultDaysForWeekCount(n);
            }
          }
        }

        const newFormData = {
          ...defaultData,
          ...(normalizedGoalData as Partial<ProfileGoalData>),
          availableDays,
        } as ProfileGoalData;
        delete (newFormData as { availableDaysPerWeek?: string }).availableDaysPerWeek;

        // Auto-detect level from running history
        const autoDetectedLevel = detectLevel(runs);
        newFormData.level = newFormData.level || autoDetectedLevel;
        setDetectedLevel(autoDetectedLevel);

        // Auto-select a plan based on goal data
        if (newFormData.availableDays.length >= 2) {
          const goalType = newFormData.goalType === "race" ? "race" : newFormData.goalType === "distance" ? "distance" : "weight";
          const targetDistance =
            goalType === "race"
              ? mapRaceTypeToTargetDistance(newFormData.raceType)
              : goalType === "distance"
                ? mapDistanceToTargetDistance(Number(newFormData.distanceKm))
                : undefined;
          const weeksAvailable =
            goalType === "race"
              ? calculateWeeksAvailable(newFormData.raceTargetDate)
              : goalType === "distance"
                ? calculateWeeksAvailable(newFormData.distanceTargetDate)
                : calculateWeeksAvailable(newFormData.weightTargetDate);

          const plan = selectPlan({
            goal: goalType,
            targetDistance,
            level: newFormData.level || "beginner",
            daysPerWeek: newFormData.availableDays.length,
            availableDays: newFormData.availableDays,
            weeksAvailable,
          });

          newFormData.selectedPlanId = plan.id;
          setSelectedPlan(mapSessionsToDays(plan, newFormData.availableDays));
        }

        setShowCustomDistance(Number(newFormData.distanceKm) > 0 && !["5", "10", "20", "21.097", "42.195"].includes(newFormData.distanceKm));
        setShowCustomRaceDistance(newFormData.raceType === "other");
        setFormData(newFormData);

        if (goalData && typeof goalData === "object" && !Array.isArray(goalData)) {
          setSavedAt("Enregistré");
          setIsDefining(false);
          setIsChanging(false);
        } else {
          setSavedAt(null);
          setIsDefining(true);
          setIsChanging(false);
        }
      } catch {
        setFormData(defaultData);
        setSavedAt(null);
        setIsDefining(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [user]);

  const activeGoalSummary = useMemo(() => {
    if (formData.goalType === "weight" && formData.targetWeightKg) {
      return `Objectif choisi : poids ${formData.targetWeightKg} kg`;
    }
    if (formData.goalType === "race" && formData.raceDistanceKm) {
      const raceLabel =
        formData.raceType === "marathon"
          ? "marathon"
          : formData.raceType === "semi"
            ? "semi-marathon"
            : formData.raceType === "20k"
              ? "20 km"
              : formData.raceType === "10k"
                ? "10 km"
                : formData.raceType === "5k"
                  ? "5 km"
                  : `${formData.raceDistanceKm} km`;
      return `Objectif choisi : ${raceLabel}`;
    }
    if (formData.goalType === "distance" && formData.distanceKm) {
      return `Objectif choisi : distance ${formData.distanceKm} km`;
    }
    return "Complétez votre objectif pour afficher un résumé.";
  }, [formData]);

  const activeGoalDetails = useMemo(() => {
    const details: Array<{ label: string; value: string }> = [];

    if (formData.goalType === "weight") {
      if (formData.weightKg) details.push({ label: "Poids actuel", value: `${formData.weightKg} kg` });
      if (formData.targetWeightKg) details.push({ label: "Poids cible", value: `${formData.targetWeightKg} kg` });
      if (formData.weightTargetDate) {
        details.push({
          label: "Date cible",
          value: format(parse(formData.weightTargetDate, "yyyy-MM-dd", new Date()), "d MMMM yyyy", { locale: fr }),
        });
      }
    }

    if (formData.goalType === "race") {
      if (formData.raceDistanceKm) details.push({ label: "Distance", value: `${formData.raceDistanceKm} km` });
      if (formData.raceTargetTime) details.push({ label: "Temps cible", value: formData.raceTargetTime });
      if (formData.raceTargetDate) {
        details.push({
          label: "Date de course",
          value: format(parse(formData.raceTargetDate, "yyyy-MM-dd", new Date()), "d MMMM yyyy", { locale: fr }),
        });
      }
    }

    if (formData.goalType === "distance") {
      if (formData.distanceKm) details.push({ label: "Distance cible", value: `${formData.distanceKm} km` });
      if (formData.distanceTargetDate) {
        details.push({
          label: "Date cible",
          value: format(parse(formData.distanceTargetDate, "yyyy-MM-dd", new Date()), "d MMMM yyyy", { locale: fr }),
        });
      }
    }

    if (formData.availableDays.length > 0) {
      details.push({
        label: "Jours d'entraînement",
        value: formData.availableDays.join(", "),
      });
    }

    if (formData.level) {
      details.push({
        label: "Niveau",
        value:
          formData.level === "beginner"
            ? "Débutant"
            : formData.level === "intermediate"
              ? "Intermédiaire"
              : "Avancé",
      });
    }

    return details;
  }, [formData]);

  const updateField = <K extends keyof ProfileGoalData>(key: K, value: ProfileGoalData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setWarnings([]);
    setSaveError(null);
    validateGoal({ ...formData, [key]: value });
  };

  const handleGoalChange = (newGoalType: GoalType) => {
    if (formData.goalType && formData.goalType !== newGoalType && savedAt) {
      setChangeWarning(true);
      setTimeout(() => setChangeWarning(false), 5000);
    }
    if (newGoalType !== "distance") {
      setShowCustomDistance(false);
    }
    if (newGoalType !== "race") {
      setShowCustomRaceDistance(false);
    }
    updateField("goalType", newGoalType);
  };

  const updateRaceType = (value: RaceType) => {
    setFormData((prev) => {
      const presetKm = racePresetDistance[value];
      return {
        ...prev,
        raceType: value,
        raceDistanceKm: presetKm || prev.raceDistanceKm,
      };
    });
    setShowCustomRaceDistance(value === "other");
    setWarnings([]);
  };

  const validateGoal = (data: ProfileGoalData) => {
    const warns: string[] = [];

    if (data.goalType === "weight") {
      const currentKg = Number(data.weightKg);
      const targetKg = Number(data.targetWeightKg);
      const daysToTarget = data.weightTargetDate ? Math.ceil((new Date(data.weightTargetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      const weekToTarget = Math.max(1, Math.ceil(daysToTarget / 7));

      if (currentKg && targetKg && currentKg > targetKg) {
        const diffKg = currentKg - targetKg;
        const weeklyLoss = weekToTarget > 0 ? diffKg / weekToTarget : 0;

        if (weeklyLoss > 1) {
          warns.push(`Perte de ${weeklyLoss.toFixed(1)} kg/semaine est trop rapide. Maximum recommandé : 0.5-1 kg/semaine`);
        }
        if (weekToTarget < 2) {
          warns.push("Délai trop court pour une perte de poids saine. Minimum recommandé : 2 semaines");
        }
      }
    }

    if (data.goalType === "race") {
      const daysToRace = data.raceTargetDate ? Math.ceil((new Date(data.raceTargetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      const weeksToRace = Math.max(1, Math.ceil(daysToRace / 7));
      const raceKm = Number(data.raceDistanceKm) || 0;
      const targetTimeError = validateRaceTargetTime(raceKm, data.raceTargetTime);

      if (raceKm >= 42 && weeksToRace < 8) {
        warns.push("Un marathon en moins de 8 semaines n'est pas recommandé. Minimum 10-12 semaines de préparation.");
      }
      if (raceKm >= 21 && weeksToRace < 6) {
        warns.push("Un semi-marathon en moins de 6 semaines n'est pas recommandé. Minimum 8-10 semaines.");
      }
      if (raceKm >= 10 && weeksToRace < 4) {
        warns.push("Un 10 km en moins de 4 semaines laisse peu de temps. Minimum 5-6 semaines recommandées.");
      }
      if (targetTimeError) {
        warns.push("Le temps cible renseigné semble aberrant.");
      }
    }

    setWarnings(warns);

    // Auto-generate and select plan if form is complete
    if (data.availableDays.length >= 2 && data.level) {
      const goalType = data.goalType === "race" ? "race" : data.goalType === "distance" ? "distance" : "weight";
      const targetDistance =
        goalType === "race"
          ? mapRaceTypeToTargetDistance(data.raceType)
          : goalType === "distance"
            ? mapDistanceToTargetDistance(Number(data.distanceKm))
            : undefined;
      const weeksAvailable =
        goalType === "race"
          ? calculateWeeksAvailable(data.raceTargetDate)
          : goalType === "distance"
            ? calculateWeeksAvailable(data.distanceTargetDate)
            : calculateWeeksAvailable(data.weightTargetDate);

      const plan = selectPlan({
        goal: goalType,
        targetDistance,
        level: data.level,
        daysPerWeek: data.availableDays.length,
        availableDays: data.availableDays,
        weeksAvailable,
      });
      const mapped = mapSessionsToDays(plan, data.availableDays);

      setSelectedPlan(mapped);
      setFormData((prev) => ({ ...prev, selectedPlanId: plan.id }));
    }
  };

  const saveProfileGoal = async () => {
    if (!user) {
      setSaveError("Impossible d'enregistrer le profil pour le moment.");
      return;
    }

    if (formData.goalType === "race") {
      const targetTimeError = validateRaceTargetTime(Number(formData.raceDistanceKm), formData.raceTargetTime);
      if (targetTimeError) {
        setSaveError(null);
        validateGoal(formData);
        return;
      }
    }

    if (formData.availableDays.length < 2 || formData.availableDays.length > 5) {
      setSaveError("Choisissez entre 2 et 5 jours d'entraînement.");
      return;
    }

    try {
      setSaveError(null);
      // Add goalSavedAt timestamp when saving
      const dataToSave = {
        ...formData,
        level: formData.level,
        fitnessLevel: formData.level,
        daysPerWeek: formData.availableDays.length,
        availableDaysPerWeek: String(formData.availableDays.length),
        goalSavedAt: new Date().toISOString(),
        available_days: formData.availableDays,
      };
      await upsertProfile(user.id, dataToSave);
      window.dispatchEvent(new Event("pace-goal-updated"));
      setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      setIsDefining(false);
      setIsChanging(false);
    } catch {
      setSaveError("Impossible d'enregistrer le profil pour le moment.");
    }
  };

  if (isLoading) {
    return <div className="space-y-4" />;
  }

  return (
    <div className="space-y-4">
      {changeWarning && (
        <ScrollReveal>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">Votre objectif a changé ? Le plan généré pour cet objectif écrasera celui en cours.</p>
          </div>
        </ScrollReveal>
      )}

      {/* État initial : Aucun objectif défini */}
      {!savedAt && !isDefining && (
        <ScrollReveal>
          <button
            onClick={() => setIsDefining(true)}
            className="w-full rounded-xl border-2 border-dashed border-accent bg-accent/5 p-6 transition-all hover:bg-accent/10 text-center"
          >
            <Target className="h-8 w-8 mx-auto mb-2 text-accent" />
            <p className="text-sm font-bold text-accent">Définir un objectif</p>
            <p className="text-xs text-muted-foreground mt-1">Commençons par créer votre premier objectif</p>
          </button>
        </ScrollReveal>
      )}

      {/* État : Objectif en cours */}
      {savedAt && !isDefining && !isChanging && (
        <ScrollReveal>
          <Card className={`border-2 ${goalOptions.find(g => g.type === formData.goalType)?.borderColor || "border-border"}`}>
            <CardContent className={`p-4 space-y-3 ${goalOptions.find(g => g.type === formData.goalType)?.bgColor || ""}`}>
              <div className="space-y-1">
                <p className="text-sm font-bold">{activeGoalSummary}</p>
                {activeGoalDetails.length > 0 && (
                  <div className="space-y-1 pt-2">
                    {activeGoalDetails.map((detail) => (
                      <p key={`${detail.label}-${detail.value}`} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{detail.label} :</span> {detail.value}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Cliquez sur changer d'objectif pour revenir aux options poids, course et distance.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsChanging(true)}
              >
                Changer d'objectif
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {/* Bloc de sélection d'objectif */}
      {(isDefining || isChanging) && (
        <>
          <ScrollReveal>
            <p className="text-sm font-semibold">{isChanging ? "Choisir un nouvel objectif" : "Choisir votre objectif"}</p>
          </ScrollReveal>
          <div className="space-y-3">
            {goalOptions.map((goal, i) => {
              const Icon = goal.icon;
              const isSelected = formData.goalType === goal.type;
              return (
                <ScrollReveal key={goal.type} delay={i === 0 ? 0 : i < 3 ? 0.05 : 0}>
                  <button
                    onClick={() => handleGoalChange(goal.type)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? `${goal.borderColor} ${goal.bgColor} shadow-md`
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 ${isSelected ? goal.bgColor : "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${isSelected ? goal.color : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isSelected ? goal.color : ""}`}>{goal.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        </>
      )}

      {/* Goal-specific info messages - seulement si en train de définir/changer */}
      {(isDefining || isChanging) && formData.goalType === "weight" && (
        <ScrollReveal>
          <Alert className="py-3 border-accent/40 bg-accent/5">
            <Info className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm text-foreground">
              <p className="font-semibold mb-1">Conseils pour une perte de poids saine</p>
              <ul className="mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                <li>
                  Objectif : <strong>0.5-1 kg par semaine</strong> maximum
                </li>
                <li>
                  Durée minimale : <strong>2 semaines</strong> pour voir des résultats durables
                </li>
                <li>
                  Exemple réaliste : passer de 75 kg à 70 kg en <strong>5-10 semaines</strong>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "race" && (
        <ScrollReveal>
          <Alert className="py-3 border-accent/40 bg-accent/5">
            <Info className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm text-foreground">
              <p className="font-semibold mb-1">Durée minimale de préparation recommandée</p>
              <ul className="mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                <li>
                  <strong>Marathon</strong> (42.195 km) : 10-12 semaines minimum
                </li>
                <li>
                  <strong>Semi-marathon</strong> (21 km) : 8-10 semaines minimum
                </li>
                <li>
                  <strong>10 km</strong> : 5-6 semaines minimum
                </li>
                <li>
                  <strong>5 km</strong> : 4 semaines minimum
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "distance" && (
        <ScrollReveal>
          <Alert className="py-3 border-accent/40 bg-accent/5">
            <Info className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm text-foreground">
              <p className="font-semibold mb-1">Progression de distance</p>
              <ul className="mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                <li>
                  Augmentez votre distance de <strong>10% par semaine</strong> maximum
                </li>
                <li>Minimum 4 semaines pour atteindre un nouvel objectif</li>
                <li>Prenez du repos tous les 3 semaines de progression</li>
              </ul>
            </AlertDescription>
          </Alert>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "weight" && (
        <ScrollReveal>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="weightKg">Poids actuel (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  min="25"
                  max="250"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={(e) => updateField("weightKg", e.target.value)}
                  placeholder="Ex: 72.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetWeightKg">Poids cible (kg)</Label>
                <Input
                  id="targetWeightKg"
                  type="number"
                  min="25"
                  max="250"
                  step="0.1"
                  value={formData.targetWeightKg}
                  onChange={(e) => updateField("targetWeightKg", e.target.value)}
                  placeholder="Ex: 68"
                />
              </div>
              <GoalDatePicker
                id="weightTargetDate"
                label="Date cible pour atteindre votre poids"
                value={formData.weightTargetDate}
                onChange={(value) => updateField("weightTargetDate", value)}
              />
              <div className="space-y-2">
                <Label>Jours disponibles pour aller courir</Label>
                <DaySelector
                  selectedDays={formData.availableDays}
                  onChange={(days) => {
                    updateField("availableDays", days);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="levelWeight">Votre niveau</Label>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Niveau détecté : <strong>{detectedLevel === "beginner" ? "Débutant" : detectedLevel === "intermediate" ? "Intermédiaire" : "Avancé"}</strong></p>
                  <Select value={formData.level || "beginner"} onValueChange={(value) => updateField("level", value as "beginner" | "intermediate" | "advanced")}>
                    <SelectTrigger id="levelWeight">
                      <SelectValue placeholder="Choisir votre niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Débutant - Moins de 20km/semaine</SelectItem>
                      <SelectItem value="intermediate">Intermédiaire - 20-50km/semaine</SelectItem>
                      <SelectItem value="advanced">Avancé - Plus de 50km/semaine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "race" && (
        <ScrollReveal>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <Label>Type de course</Label>
                <Select value={formData.raceType} onValueChange={(value) => updateRaceType(value as RaceType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un type de course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marathon">Marathon</SelectItem>
                    <SelectItem value="semi">Semi-marathon</SelectItem>
                    <SelectItem value="20k">20 km</SelectItem>
                    <SelectItem value="10k">10 km</SelectItem>
                    <SelectItem value="5k">5 km</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DistanceSelector
                label="Distance (km)"
                options={["5k", "10k", "20k", "semi", "marathon"]}
                selectedValue={formData.raceType}
                customValue={formData.raceType === "other" ? formData.raceDistanceKm : ""}
                showCustom={showCustomRaceDistance}
                onSelectPreset={(value) => updateRaceType(value as RaceType)}
                onToggleCustom={() => {
                  setShowCustomRaceDistance((current) => !current);
                  updateRaceType("other");
                }}
                onCustomChange={(value) => {
                  setFormData((prev) => ({ ...prev, raceType: "other", raceDistanceKm: value }));
                  validateGoal({ ...formData, raceType: "other", raceDistanceKm: value });
                }}
              />
              <GoalTimePicker
                label="Temps cible"
                value={formData.raceTargetTime || "00:45:00"}
                onChange={(value) => updateField("raceTargetTime", value)}
              />
              <GoalDatePicker
                id="raceTargetDate"
                label="Date de la course"
                value={formData.raceTargetDate}
                onChange={(value) => updateField("raceTargetDate", value)}
              />
              <div className="space-y-2">
                <Label>Jours disponibles pour aller courir</Label>
                <DaySelector
                  selectedDays={formData.availableDays}
                  onChange={(days) => {
                    updateField("availableDays", days);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="levelRace">Votre niveau</Label>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Niveau détecté : <strong>{detectedLevel === "beginner" ? "Débutant" : detectedLevel === "intermediate" ? "Intermédiaire" : "Avancé"}</strong></p>
                  <Select value={formData.level || "beginner"} onValueChange={(value) => updateField("level", value as "beginner" | "intermediate" | "advanced")}>
                    <SelectTrigger id="levelRace">
                      <SelectValue placeholder="Choisir votre niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Débutant - Moins de 20km/semaine</SelectItem>
                      <SelectItem value="intermediate">Intermédiaire - 20-50km/semaine</SelectItem>
                      <SelectItem value="advanced">Avancé - Plus de 50km/semaine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "distance" && (
        <ScrollReveal>
          <Card>
            <CardContent className="p-4 space-y-3">
              <DistanceSelector
                label="Distance cible"
                options={["5k", "10k", "20k", "semi", "marathon"]}
                selectedValue={
                  showCustomDistance
                    ? "other"
                    : formData.distanceKm === "5"
                      ? "5k"
                      : formData.distanceKm === "10"
                        ? "10k"
                        : formData.distanceKm === "20"
                          ? "20k"
                          : formData.distanceKm === "21.097"
                            ? "semi"
                            : formData.distanceKm === "42.195"
                              ? "marathon"
                              : ""
                }
                customValue={showCustomDistance ? formData.distanceKm : ""}
                showCustom={showCustomDistance}
                onSelectPreset={(value) => {
                  setShowCustomDistance(false);
                  updateField(
                    "distanceKm",
                    value === "5k"
                      ? "5"
                      : value === "10k"
                        ? "10"
                        : value === "20k"
                          ? "20"
                          : value === "semi"
                            ? "21.097"
                            : "42.195",
                  );
                }}
                onToggleCustom={() => setShowCustomDistance((current) => !current)}
                onCustomChange={(value) => updateField("distanceKm", value)}
              />
              <GoalDatePicker
                id="distanceTargetDate"
                label="Date cible"
                value={formData.distanceTargetDate}
                onChange={(value) => updateField("distanceTargetDate", value)}
              />
              <div className="space-y-2">
                <Label>Jours disponibles pour aller courir</Label>
                <DaySelector
                  selectedDays={formData.availableDays}
                  onChange={(days) => {
                    updateField("availableDays", days);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="levelDistance">Votre niveau</Label>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Niveau détecté : <strong>{detectedLevel === "beginner" ? "Débutant" : detectedLevel === "intermediate" ? "Intermédiaire" : "Avancé"}</strong></p>
                  <Select value={formData.level || "beginner"} onValueChange={(value) => updateField("level", value as "beginner" | "intermediate" | "advanced")}>
                    <SelectTrigger id="levelDistance">
                      <SelectValue placeholder="Choisir votre niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Débutant - Moins de 20km/semaine</SelectItem>
                      <SelectItem value="intermediate">Intermédiaire - 20-50km/semaine</SelectItem>
                      <SelectItem value="advanced">Avancé - Plus de 50km/semaine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && (
        <>
          {selectedPlan && (
            <ScrollReveal>
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-accent flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Plan sélectionné
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedPlan.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-card p-2">
                      <p className="text-xs text-muted-foreground">Durée</p>
                      <p className="text-sm font-bold text-accent">{selectedPlan.durationWeeks}w</p>
                    </div>
                    <div className="rounded-lg bg-card p-2">
                      <p className="text-xs text-muted-foreground">Séances</p>
                      <p className="text-sm font-bold text-accent">{selectedPlan.daysPerWeek}j/sem</p>
                    </div>
                    <div className="rounded-lg bg-card p-2">
                      <p className="text-xs text-muted-foreground">Niveau</p>
                      <p className="text-sm font-bold text-accent capitalize">{selectedPlan.level === "beginner" ? "Début" : selectedPlan.level === "intermediate" ? "Inter" : "Avancé"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          )}
          {saveError && (
            <ScrollReveal>
              <Alert variant="destructive" className="py-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">{saveError}</AlertDescription>
              </Alert>
            </ScrollReveal>
          )}
          {warnings.length > 0 && (
            <ScrollReveal>
              <div className="space-y-2">
                {warnings.map((warning, i) => (
                  <Alert key={i} variant="destructive" className="py-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollReveal>
          )}
          <Button className="w-full bg-accent text-accent-foreground" onClick={saveProfileGoal}>
            <Target className="h-4 w-4 mr-2" />
            Sauvegarder profil et plan
          </Button>
        </>
      )}
      {!(isDefining || isChanging) && (
        <>
          {saveError && (
            <ScrollReveal>
              <Alert variant="destructive" className="py-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">{saveError}</AlertDescription>
              </Alert>
            </ScrollReveal>
          )}
          {warnings.length > 0 && (
            <ScrollReveal>
              <div className="space-y-2">
                {warnings.map((warning, i) => (
                  <Alert key={i} variant="destructive" className="py-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollReveal>
          )}
          <Button className="w-full bg-accent text-accent-foreground" onClick={saveProfileGoal}>
            <Target className="h-4 w-4 mr-2" />
            Sauvegarder profil et objectif
          </Button>
        </>
      )}
    </div>
  );
}
