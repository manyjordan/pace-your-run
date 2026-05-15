import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { DaySelector, defaultDaysForWeekCount } from "@/components/goal/DaySelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Calendar as CalendarIcon } from "lucide-react";
import { differenceInDays, format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useRef, useState } from "react";
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
  { id: "marathon" as const, label: "Marathon", description: "42.195 km" },
  { id: "semi" as const, label: "Semi-marathon", description: "21.1 km" },
  { id: "10k" as const, label: "10 km", description: "Course populaire" },
  { id: "5k" as const, label: "5 km", description: "Parfait pour débuter" },
  { id: "regular" as const, label: "Courir régulièrement", description: "3 fois/semaine" },
  { id: "none" as const, label: "Sans objectif précis", description: "Je cours librement" },
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
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
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
            onBlur={() => onBlur?.()}
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

type GoalTabProps = {
  userId?: string;
  /** Incrémenter depuis le parent (ex. onglet Plan) pour ouvrir le flux « modifier l’objectif ». */
  openChangeGoalNonce?: number;
  forceReset?: boolean;
  onResetHandled?: () => void;
};

export default function GoalTab({
  openChangeGoalNonce = 0,
  forceReset = false,
  onResetHandled,
}: GoalTabProps) {
  const { user } = useAuth();
  const lastOpenNonceRef = useRef(0);
  const [formData, setFormData] = useState<ProfileGoalData>(defaultData);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isDefining, setIsDefining] = useState<boolean>(true);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [isLoadingGoal, setIsLoadingGoal] = useState(() => {
    const userId = localStorage.getItem("pace_user_id");
    if (!userId) return false;
    const cached = localStorage.getItem(`cache_profile_${userId}`);
    return !cached;
  });
  const [raceTargetDateBlurred, setRaceTargetDateBlurred] = useState(false);
  const [detectedLevel, setDetectedLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [showCustomDistance, setShowCustomDistance] = useState(false);
  const [showCustomRaceDistance, setShowCustomRaceDistance] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([]);
  const [showCustomPlanBuilder, setShowCustomPlanBuilder] = useState(false);
  const [customWeeks, setCustomWeeks] = useState(12);
  const [customDistance, setCustomDistance] = useState("10k");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setFormData(defaultData);
        setSavedAt(null);
        setIsDefining(true);
        setIsChanging(false);
        setRecentRuns([]);
        setRaceTargetDateBlurred(false);
        setIsLoadingGoal(false);
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
          setIsDefining(true);
          setIsChanging(false);
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
        if (goalData && typeof goalData === "object" && !Array.isArray(goalData)) {
          setSavedAt("Enregistré");
          let isExpired = false;
          if (newFormData.goalType === "race" && newFormData.raceTargetDate) {
            isExpired = differenceInDays(new Date(newFormData.raceTargetDate), new Date()) < 0;
          } else if (newFormData.goalType === "distance" && newFormData.distanceTargetDate) {
            isExpired = differenceInDays(new Date(newFormData.distanceTargetDate), new Date()) < 0;
          } else if (newFormData.goalType === "weight" && newFormData.weightTargetDate) {
            isExpired = differenceInDays(new Date(newFormData.weightTargetDate), new Date()) < 0;
          }
          if (isExpired) {
            setIsDefining(true);
            setIsChanging(false);
          } else {
            setIsDefining(false);
            setIsChanging(false);
          }
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
        setIsLoadingGoal(false);
      }
    };

    void loadProfile();
  }, [user]);

  useEffect(() => {
    if (openChangeGoalNonce <= 0 || openChangeGoalNonce === lastOpenNonceRef.current) return;
    lastOpenNonceRef.current = openChangeGoalNonce;
    setRaceTargetDateBlurred(false);
    setIsChanging(true);
    setIsDefining(false);
  }, [openChangeGoalNonce]);

  useEffect(() => {
    if (!forceReset) return;
    setIsDefining(true);
    setIsChanging(false);
    setSavedAt(null);
    setRaceTargetDateBlurred(false);
    onResetHandled?.();
  }, [forceReset, onResetHandled]);

  const goalTargetExpired = useMemo(() => {
    let dateStr: string | undefined;
    if (formData.goalType === "race") dateStr = formData.raceTargetDate;
    else if (formData.goalType === "distance") dateStr = formData.distanceTargetDate;
    else if (formData.goalType === "weight") dateStr = formData.weightTargetDate;
    if (!dateStr) return false;
    return differenceInDays(new Date(dateStr), new Date()) < 0;
  }, [formData.goalType, formData.raceTargetDate, formData.distanceTargetDate, formData.weightTargetDate]);

  const updateField = <K extends keyof ProfileGoalData>(key: K, value: ProfileGoalData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
    setRaceTargetDateBlurred(false);
    setShowCustomPlanBuilder(false);

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
    setRaceTargetDateBlurred(false);
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
    if (data.goalType === "none") {
      setSelectedPlan(null);
      return;
    }

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
    if (!user) return;

    if (formData.goalType !== "none" && (formData.availableDays.length < 2 || formData.availableDays.length > 5)) {
      return;
    }

    try {
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
    } catch {
      // errors not shown in goal flow
    }
  };

  if (isLoadingGoal) {
    return (
      <div className="min-h-[4rem] space-y-3 animate-pulse px-4 pt-4">
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
      </div>
    );
  }

  const renderGoalIntroGrid = () => (
    <div className="flex flex-col items-center space-y-6 px-4 py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        <Target className="h-8 w-8 text-accent" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Quel est votre objectif ?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choisissez un objectif pour obtenir un plan personnalisé</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        {GOAL_OPTIONS.map((option) => {
          const selected =
            (option.id === "none" && formData.goalType === "none") ||
            (option.id === "regular" && formData.selectedPlanId === "regular_running") ||
            (option.id !== "none" &&
              option.id !== "regular" &&
              formData.goalType === "race" &&
              formData.raceType === option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => applyGoalOption(option.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 bg-card p-4 transition-all active:scale-95",
                selected ? "border-accent bg-accent/10 shadow-sm" : "border-border",
              )}
            >
<span className="text-sm font-semibold text-foreground">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const showDefinitionFlow = isChanging || (isDefining && (!savedAt || goalTargetExpired));
  const isFinisherPlan = selectedPlan?.level === "finisher" || formData.selectedPlanId === "regular_running";
  return (
    <div className="space-y-4">
      {/* État A / édition — sélection + assistant (intro grille ou flux modification) */}
      {showDefinitionFlow && (
        <>
          {isChanging ? (
            <div className="flex shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => {
                setRaceTargetDateBlurred(false);
                setIsChanging(false);
              }}>
                Annuler
              </Button>
            </div>
          ) : null}
          <ScrollReveal>{renderGoalIntroGrid()}</ScrollReveal>
        </>
      )}

      {showDefinitionFlow && formData.goalType === "none" && (
        <ScrollReveal>
          <p className="text-sm text-muted-foreground">
            Aucun plan imposé. Vous pourrez affiner votre objectif plus tard dans cet onglet.
          </p>
        </ScrollReveal>
      )}
      {showDefinitionFlow &&
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
<div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">{plan.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
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
                <Target className="h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold text-foreground">Créer mon plan</p>
                  <p className="text-xs text-muted-foreground">Personnalisez chaque paramètre</p>
                </div>
              </button>
            </div>
          </ScrollReveal>
        )}

      {showDefinitionFlow && showCustomPlanBuilder && (
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
            <Button type="button" onClick={handleGenerateCustomPlan} className="w-full bg-accent font-semibold text-white">
              Générer mon plan
            </Button>
          </div>
        </ScrollReveal>
      )}

      {showDefinitionFlow &&
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
                  </div>
                ) : null}
                <GoalDatePicker
                  id="raceTargetDate"
                  label="Date de la course (optionnel)"
                  value={formData.raceTargetDate}
                  onChange={(value) => updateField("raceTargetDate", value)}
                  onBlur={() => setRaceTargetDateBlurred(true)}
                />
                <div className="space-y-2">
                  <Label>Jours disponibles pour aller courir</Label>
                  <DaySelector
                    selectedDays={formData.availableDays}
                    onChange={(days) => updateField("availableDays", days)}
                  />
                </div>
                {!isFinisherPlan ? (
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
                ) : null}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

      {showDefinitionFlow && (
        <>
          {selectedPlan && formData.goalType !== "none" && (
            <ScrollReveal>
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-accent">Plan sélectionné</p>
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
          <Button className="w-full bg-accent text-accent-foreground" onClick={saveProfileGoal}>
            <Target className="h-4 w-4 mr-2" />
            Sauvegarder profil et plan
          </Button>
        </>
      )}
    </div>
  );
}
