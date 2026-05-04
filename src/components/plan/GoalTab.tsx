import { ScrollReveal } from "@/components/ScrollReveal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { DaySelector, defaultDaysForWeekCount } from "@/components/goal/DaySelector";
import { GoalTimePicker } from "@/components/goal/GoalTimePicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Trophy, AlertCircle, AlertTriangle, Info, Calendar as CalendarIcon, Zap, Pencil } from "lucide-react";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, upsertProfile, getRuns, type RunRow } from "@/lib/database";
import { selectPlan, detectLevel } from "@/lib/planSelector";
import type { PlanDistance } from "@/lib/plans/types";
import { getPlanById, getPlansForDistance, mapSessionsToDays } from "@/lib/plans";
import type { TrainingPlan } from "@/lib/plans/types";
import { generateTrainingPlan } from "@/lib/trainingPlan";
import { cn } from "@/lib/utils";
import {
  calculateWeeksAvailable,
  mapDistanceToTargetDistance,
  mapRaceTypeToTargetDistance,
  normalizeGoalData,
  validateRaceTargetTime,
} from "@/lib/goalHelpers";
import { futureEventDayPickerProps } from "@/lib/dateCalendarSettings";

type GoalType = "weight" | "race" | "distance" | "none";
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
  embeddedPlan?: TrainingPlan;
  customSessionsPerWeek?: 3 | 4 | 5;
  pbDistance?: string;
  pbTime?: string;
};

const defaultData: ProfileGoalData = {
  weightKg: "",
  goalType: "race",
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
  embeddedPlan: undefined,
  customSessionsPerWeek: undefined,
  pbDistance: "5k",
  pbTime: "",
};

const GOAL_OPTIONS = [
  { id: "marathon" as const, emoji: "🏅", label: "Marathon", description: "42.195 km" },
  { id: "semi" as const, emoji: "🥈", label: "Semi-marathon", description: "21.1 km" },
  { id: "10k" as const, emoji: "🏃", label: "10 km", description: "Course populaire" },
  { id: "5k" as const, emoji: "👟", label: "5 km", description: "Parfait pour débuter" },
  { id: "regular" as const, emoji: "📅", label: "Courir régulièrement", description: "3 fois/semaine" },
  { id: "none" as const, emoji: "🎯", label: "Sans objectif précis", description: "Je cours librement" },
];

function raceTypeFromGoalOption(id: (typeof GOAL_OPTIONS)[number]["id"]): RaceType {
  if (id === "regular") return "10k";
  if (id === "none") return "5k";
  return id;
}

function raceKmFromGoalOption(id: (typeof GOAL_OPTIONS)[number]["id"]): string {
  if (id === "marathon") return "42.195";
  if (id === "semi") return "21.097";
  if (id === "10k") return "10";
  if (id === "5k") return "5";
  if (id === "regular") return "10";
  return "5";
}

function planDistanceFromGoalOption(id: (typeof GOAL_OPTIONS)[number]["id"]): PlanDistance | null {
  if (id === "marathon") return "marathon";
  if (id === "semi") return "semi";
  if (id === "10k") return "10k";
  if (id === "5k") return "5k";
  if (id === "regular") return "regular";
  return null;
}

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
            {...futureEventDayPickerProps(selectedDate)}
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
  const [hasNoGoalDefined, setHasNoGoalDefined] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [showCustomPlanBuilder, setShowCustomPlanBuilder] = useState(false);
  const [customWeeks, setCustomWeeks] = useState(12);
  const [customDistance, setCustomDistance] = useState("10k");
  const [customTargetTime, setCustomTargetTime] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setFormData(defaultData);
        setSavedAt(null);
        setIsDefining(true);
        setIsChanging(false);
        setRecentRuns([]);
        setIsLoading(false);
        return;
      }

      try {
        // Load profile and runs to detect level
        const [profile, runs] = await Promise.all([
          getProfile(user.id),
          getRuns(user.id),
        ]);
        setRecentRuns(runs ?? []);

        const profileGoalType = typeof profile?.goal_type === "string" ? profile.goal_type : null;
        const profileGoalData =
          profile?.goal_data && typeof profile.goal_data === "object" && !Array.isArray(profile.goal_data)
            ? (profile.goal_data as Record<string, unknown>)
            : null;
        const hasNoGoal =
          (!profileGoalType || profileGoalType === "none") &&
          (!profileGoalData || Object.keys(profileGoalData).length === 0);
        if (hasNoGoal) {
          const autoDetectedLevel = detectLevel(runs);
          setDetectedLevel(autoDetectedLevel);
          setFormData({ ...defaultData, level: autoDetectedLevel });
          setSelectedPlan(null);
          setSavedAt(null);
          setIsDefining(false);
          setIsChanging(false);
          setHasNoGoalDefined(true);
          setShowCustomDistance(false);
          setShowCustomRaceDistance(false);
          return;
        }

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

        const embedded = rawGoal.embeddedPlan;
        const embeddedPlan =
          embedded &&
          typeof embedded === "object" &&
          embedded !== null &&
          Array.isArray((embedded as TrainingPlan).weeklySchedule)
            ? (embedded as TrainingPlan)
            : undefined;

        if (embeddedPlan) {
          newFormData.embeddedPlan = embeddedPlan;
          newFormData.selectedPlanId = "custom";
          if (newFormData.availableDays.length >= 2) {
            setSelectedPlan(mapSessionsToDays(embeddedPlan, newFormData.availableDays));
          } else {
            setSelectedPlan(embeddedPlan);
          }
        } else if (newFormData.selectedPlanId) {
          const preset = getPlanById(newFormData.selectedPlanId);
          if (preset && newFormData.availableDays.length >= 2) {
            setSelectedPlan(mapSessionsToDays(preset, newFormData.availableDays));
          } else if (preset) {
            setSelectedPlan(preset);
          } else {
            setSelectedPlan(null);
          }
        } else if (newFormData.availableDays.length >= 2) {
          const goalType =
            newFormData.goalType === "race" ? "race" : newFormData.goalType === "distance" ? "distance" : "weight";
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
        } else {
          setSelectedPlan(null);
        }

        setShowCustomDistance(Number(newFormData.distanceKm) > 0 && !["5", "10", "20", "21.097", "42.195"].includes(newFormData.distanceKm));
        setShowCustomRaceDistance(newFormData.raceType === "other");
        setFormData(newFormData);
        setHasNoGoalDefined(false);

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
        setHasNoGoalDefined(false);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [user]);

  const activeGoalSummary = useMemo(() => {
    if (formData.goalType === "none") {
      return "Sans objectif précis — vous courez librement";
    }
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

  const selectedDistanceForPlans = useMemo((): PlanDistance | null => {
    if (formData.goalType !== "race") return null;
    if (formData.selectedPlanId === "regular_running") return null;
    const rt = formData.raceType;
    if (rt === "marathon") return "marathon";
    if (rt === "semi") return "semi";
    if (rt === "10k") return "10k";
    if (rt === "5k") return "5k";
    return null;
  }, [formData.goalType, formData.raceType, formData.selectedPlanId]);

  const applyGoalOption = (id: (typeof GOAL_OPTIONS)[number]["id"]) => {
    if (formData.goalType && savedAt) {
      setChangeWarning(true);
      setTimeout(() => setChangeWarning(false), 5000);
    }
    setShowCustomPlanBuilder(false);
    setSaveError(null);
    setWarnings([]);

    if (id === "none") {
      const next: ProfileGoalData = {
        ...formData,
        goalType: "none",
        selectedPlanId: undefined,
        embeddedPlan: undefined,
        availableDays: [],
      };
      setFormData(next);
      setSelectedPlan(null);
      validateGoal(next);
      return;
    }
    if (id === "regular") {
      const next: ProfileGoalData = {
        ...formData,
        goalType: "race",
        raceType: "10k",
        raceDistanceKm: "10",
        selectedPlanId: "regular_running",
        embeddedPlan: undefined,
        customSessionsPerWeek: 3,
      };
      setFormData(next);
      validateGoal(next);
      return;
    }
    const pd = planDistanceFromGoalOption(id);
    const first = pd ? getPlansForDistance(pd)[0] : undefined;
    const next: ProfileGoalData = {
      ...formData,
      goalType: "race",
      raceType: raceTypeFromGoalOption(id),
      raceDistanceKm: raceKmFromGoalOption(id),
      selectedPlanId: first?.id,
      embeddedPlan: undefined,
      customSessionsPerWeek: first?.sessionsPerWeek,
    };
    setFormData(next);
    validateGoal(next);
  };

  const selectPresetPlanId = (planId: string) => {
    const preset = getPlanById(planId);
    const next: ProfileGoalData = {
      ...formData,
      selectedPlanId: planId,
      embeddedPlan: undefined,
      customSessionsPerWeek: preset?.sessionsPerWeek ?? formData.customSessionsPerWeek,
    };
    setFormData(next);
    validateGoal(next);
  };

  const handleGenerateCustomPlan = () => {
    const vol4 =
      recentRuns.length > 0 ? recentRuns.reduce((s, r) => s + (r.distance_km ?? 0), 0) / 4 : 18;
    const goalKm =
      customDistance === "marathon"
        ? 42.2
        : customDistance === "semi"
          ? 21.1
          : customDistance === "10k"
            ? 10
            : customDistance === "5k"
              ? 5
              : 10;
    const spw = (formData.customSessionsPerWeek ?? 4) as 3 | 4 | 5;
    const plan = generateTrainingPlan({
      weeksUntilRace: customWeeks,
      currentWeeklyKm: vol4,
      goalDistanceKm: goalKm,
      runsPerWeek: spw,
    });
    const next: ProfileGoalData = {
      ...formData,
      goalType: "race",
      embeddedPlan: plan,
      selectedPlanId: "custom",
      raceTargetTime: customTargetTime || formData.raceTargetTime,
      customSessionsPerWeek: spw,
    };
    setFormData(next);
    setSelectedPlan(
      formData.availableDays.length >= 2 ? mapSessionsToDays(plan, formData.availableDays) : plan,
    );
    setShowCustomPlanBuilder(false);
    validateGoal(next);
  };

  const validateGoal = (data: ProfileGoalData) => {
    const warns: string[] = [];

    if (data.goalType === "none") {
      setWarnings([]);
      setSelectedPlan(null);
      return;
    }

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
      const targetTimeError = data.raceTargetTime?.trim()
        ? validateRaceTargetTime(raceKm, data.raceTargetTime)
        : null;

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

    if (data.availableDays.length >= 2) {
      const emb = data.embeddedPlan;
      if (data.selectedPlanId === "custom" && emb && Array.isArray(emb.weeklySchedule)) {
        setSelectedPlan(mapSessionsToDays(emb, data.availableDays));
        return;
      }
      if (data.selectedPlanId) {
        const preset = getPlanById(data.selectedPlanId);
        if (preset) {
          setSelectedPlan(mapSessionsToDays(preset, data.availableDays));
          return;
        }
      }
    }

    // Legacy auto-generate when aucun plan explicite
    if (data.availableDays.length >= 2 && data.level && !data.selectedPlanId) {
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

    if (formData.goalType === "race" && formData.raceTargetTime?.trim()) {
      const targetTimeError = validateRaceTargetTime(Number(formData.raceDistanceKm), formData.raceTargetTime);
      if (targetTimeError) {
        setSaveError(null);
        validateGoal(formData);
        return;
      }
    }

    if (formData.goalType !== "none" && (formData.availableDays.length < 2 || formData.availableDays.length > 5)) {
      setSaveError("Choisissez entre 2 et 5 jours d'entraînement.");
      return;
    }

    try {
      setSaveError(null);
      // Add goalSavedAt timestamp when saving
      const dataToSave: Record<string, unknown> = {
        ...formData,
        goal_type: formData.goalType,
        level: formData.level,
        fitnessLevel: formData.level,
        daysPerWeek: formData.goalType === "none" ? 0 : formData.availableDays.length,
        availableDaysPerWeek: formData.goalType === "none" ? "0" : String(formData.availableDays.length),
        goalSavedAt: new Date().toISOString(),
        available_days: formData.goalType === "none" ? [] : formData.availableDays,
      };
      await upsertProfile(user.id, dataToSave);
      window.dispatchEvent(new Event("pace-goal-updated"));
      setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      setIsDefining(false);
      setIsChanging(false);
      setHasNoGoalDefined(false);
    } catch {
      setSaveError("Impossible d'enregistrer le profil pour le moment.");
    }
  };

  if (isLoading) {
    return <div className="space-y-4" />;
  }

  const handleChangeGoal = () => {
    setIsChanging(true);
    setIsDefining(false);
  };

  return (
    <div className="space-y-4">
      {changeWarning && (
        <ScrollReveal>
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">Votre objectif a changé ? Le plan généré pour cet objectif écrasera celui en cours.</p>
          </div>
        </ScrollReveal>
      )}

      {/* État initial : Aucun objectif défini */}
      {hasNoGoalDefined && !isDefining && !isChanging && (
        <ScrollReveal>
          <Card className="border-accent/30 bg-card/95">
            <CardContent className="space-y-4 p-5">
              <div className="rounded-xl bg-accent/10 p-3 text-accent">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Vous courez sans objectif défini.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vous pouvez en ajouter un à tout moment pour personnaliser votre plan.
                </p>
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground"
                onClick={() => {
                  setIsDefining(true);
                  setHasNoGoalDefined(false);
                }}
              >
                Définir un objectif
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {!savedAt && !isDefining && !hasNoGoalDefined && (
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

      {/* État : objectif enregistré — résumé toujours visible pendant une modification */}
      {savedAt && !hasNoGoalDefined && formData.goalType && (
        <ScrollReveal>
          <div className="mb-2 flex justify-end">
            {isChanging ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsChanging(false)}>
                Annuler la modification
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleChangeGoal}
                className="flex items-center gap-1.5 rounded-xl border border-accent/30 px-3 py-1.5 text-sm font-medium text-accent transition-all hover:bg-accent/10 active:scale-95"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier mon objectif
              </button>
            )}
          </div>
          <Card className="border-2 border-accent/40 bg-accent/5">
            <CardContent className="space-y-3 p-4">
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
                {!isChanging ? (
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur « Modifier mon objectif » pour choisir un autre format ou niveau.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Votre objectif actuel reste affiché pendant que vous choisissez les modifications ci-dessous.
                  </p>
                )}
              </div>
              {!isChanging ? (
                <Button variant="outline" className="w-full" onClick={handleChangeGoal}>
                  Changer d&apos;objectif
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {/* Bloc de sélection d'objectif */}
      {(isDefining || isChanging) && (
        <>
          <ScrollReveal>
            <p className="text-sm font-semibold">
              {isChanging ? "Choisir un nouvel objectif" : "Choisir votre objectif"}
            </p>
          </ScrollReveal>
          <div className="space-y-3">
            {GOAL_OPTIONS.map((goal, i) => {
              const selected =
                (goal.id === "none" && formData.goalType === "none") ||
                (goal.id === "regular" && formData.selectedPlanId === "regular_running") ||
                (goal.id !== "none" &&
                  goal.id !== "regular" &&
                  formData.goalType === "race" &&
                  formData.raceType === goal.id);
              return (
                <ScrollReveal key={goal.id} delay={i === 0 ? 0 : i < 3 ? 0.05 : 0}>
                  <button
                    type="button"
                    onClick={() => applyGoalOption(goal.id)}
                    className={cn(
                      "w-full rounded-xl border-2 p-4 text-left transition-all",
                      selected ? "border-accent bg-accent/10 shadow-md" : "border-border bg-card hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden>
                        {goal.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-bold", selected && "text-accent-foreground")}>{goal.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        </>
      )}

      {(isDefining || isChanging) && formData.goalType === "none" && (
        <ScrollReveal>
          <p className="text-sm text-muted-foreground">
            Aucun plan imposé. Vous pourrez affiner votre objectif plus tard dans cet onglet.
          </p>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && selectedDistanceForPlans && (
        <ScrollReveal>
          <Alert className="border-accent/40 bg-accent/5 py-3">
            <Info className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm text-foreground">
              <p className="mb-1 font-semibold">Durée minimale de préparation recommandée</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
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

      {(isDefining || isChanging) &&
        formData.goalType === "race" &&
        selectedDistanceForPlans &&
        !showCustomPlanBuilder && (
          <ScrollReveal>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Choisissez votre niveau
              </h3>
              {getPlansForDistance(selectedDistanceForPlans).map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => selectPresetPlanId(plan.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    formData.selectedPlanId === plan.id ? "border-accent bg-accent/10" : "border-border bg-card",
                  )}
                >
                  <span className="text-3xl">{plan.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">{plan.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                    {plan.targetTime ? (
                      <p className="mt-1 text-xs font-semibold text-accent">🎯 {plan.targetTime}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">{plan.durationWeeks} sem.</p>
                    <p className="text-xs text-muted-foreground">{plan.sessionsPerWeek}j/sem</p>
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowCustomPlanBuilder(true)}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-accent/30 p-4 text-left"
              >
                <span className="text-2xl">✏️</span>
                <div>
                  <p className="font-semibold text-foreground">Créer mon plan</p>
                  <p className="text-xs text-muted-foreground">Personnalisez chaque paramètre</p>
                </div>
              </button>
            </div>
          </ScrollReveal>
        )}

      {(isDefining || isChanging) && showCustomPlanBuilder && (
        <ScrollReveal>
          <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="font-semibold text-foreground">Mon plan personnalisé</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Distance cible</label>
              <select
                value={customDistance}
                onChange={(e) => setCustomDistance(e.target.value)}
                className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm"
              >
                <option value="5k">5 km</option>
                <option value="10k">10 km</option>
                <option value="semi">Semi-marathon (21.1km)</option>
                <option value="marathon">Marathon (42.2km)</option>
                <option value="custom">Autre distance</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Durée du plan</label>
              <div className="flex gap-2">
                {[8, 12, 16, 20].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setCustomWeeks(w)}
                    className={cn(
                      "flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all",
                      customWeeks === w ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground",
                    )}
                  >
                    {w}sem
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sorties par semaine</label>
              <div className="flex gap-2">
                {([3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateField("customSessionsPerWeek", n)}
                    className={cn(
                      "flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all",
                      (formData.customSessionsPerWeek ?? 4) === n
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {n}j
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temps cible (optionnel)</label>
              <input
                type="text"
                placeholder="ex: 3:45:00"
                value={customTargetTime}
                onChange={(e) => setCustomTargetTime(e.target.value)}
                className="w-full rounded-xl bg-muted px-3 py-2.5 font-mono text-sm"
              />
            </div>

            <Button type="button" onClick={handleGenerateCustomPlan} className="w-full bg-accent font-semibold text-white">
              Générer mon plan
            </Button>
          </div>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) &&
        formData.goalType === "race" &&
        formData.selectedPlanId &&
        !showCustomPlanBuilder && (
          <ScrollReveal>
            <Card>
              <CardContent className="space-y-4 p-4">
                {formData.selectedPlanId !== "regular_running" && formData.selectedPlanId !== "custom" ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Personnaliser
                    </h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sorties par semaine</label>
                      <div className="flex gap-2">
                        {([3, 4, 5] as const).map((n) => {
                          const presetSpw = getPlanById(formData.selectedPlanId ?? "")?.sessionsPerWeek ?? 4;
                          const active = (formData.customSessionsPerWeek ?? presetSpw) === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => updateField("customSessionsPerWeek", n)}
                              className={cn(
                                "flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all",
                                active ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground",
                              )}
                            >
                              {n}j
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Votre meilleur temps récent (optionnel)</label>
                      <p className="text-xs text-muted-foreground">Permet de calculer des allures personnalisées</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={formData.pbDistance ?? "5k"}
                          onChange={(e) => updateField("pbDistance", e.target.value)}
                          className="rounded-xl bg-muted px-3 py-2.5 text-sm"
                        >
                          <option value="5k">5km</option>
                          <option value="10k">10km</option>
                          <option value="semi">Semi</option>
                          <option value="marathon">Marathon</option>
                        </select>
                        <input
                          type="text"
                          placeholder="ex: 45:30"
                          value={formData.pbTime ?? ""}
                          onChange={(e) => updateField("pbTime", e.target.value)}
                          className="flex-1 rounded-xl bg-muted px-3 py-2.5 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <GoalTimePicker
                  label="Temps cible (optionnel)"
                  value={formData.raceTargetTime || "00:45:00"}
                  onChange={(value) => updateField("raceTargetTime", value)}
                />
                <GoalDatePicker
                  id="raceTargetDate"
                  label="Date de la course (optionnel)"
                  value={formData.raceTargetDate}
                  onChange={(value) => updateField("raceTargetDate", value)}
                />
                <div className="space-y-2">
                  <Label>Jours disponibles pour aller courir</Label>
                  <DaySelector
                    selectedDays={formData.availableDays}
                    onChange={(days) => updateField("availableDays", days)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="levelRace">Votre niveau</Label>
                  <p className="text-xs text-muted-foreground">
                    Niveau détecté :{" "}
                    <strong>
                      {detectedLevel === "beginner"
                        ? "Débutant"
                        : detectedLevel === "intermediate"
                          ? "Intermédiaire"
                          : "Avancé"}
                    </strong>
                  </p>
                  <Select
                    value={formData.level || "beginner"}
                    onValueChange={(value) => updateField("level", value as "beginner" | "intermediate" | "advanced")}
                  >
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
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

      {(isDefining || isChanging) && formData.goalType === "weight" && (
        <ScrollReveal>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Profil avec objectif poids existant. Choisissez un objectif course ci-dessus pour migrer vers le nouveau
              parcours, ou enregistrez sans modifier.
            </AlertDescription>
          </Alert>
        </ScrollReveal>
      )}
      {(isDefining || isChanging) && formData.goalType === "distance" && (
        <ScrollReveal>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Profil avec objectif distance existant. Sélectionnez un format dans la liste ci-dessus pour le nouveau
              parcours.
            </AlertDescription>
          </Alert>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && (
        <>
          {selectedPlan && formData.goalType !== "none" && (
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
                      <p className="text-sm font-bold text-accent capitalize">
                        {selectedPlan.legacyLevel === "beginner"
                          ? "Début"
                          : selectedPlan.legacyLevel === "intermediate"
                            ? "Inter"
                            : "Avancé"}
                      </p>
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
