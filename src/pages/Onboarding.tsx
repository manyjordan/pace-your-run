import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Calendar, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DaySelector } from "@/components/goal/DaySelector";
import { DistanceSelector } from "@/components/goal/DistanceSelector";
import { GoalTimePicker } from "@/components/goal/GoalTimePicker";
import { useAuth } from "@/contexts/AuthContext";
import { upsertProfile } from "@/lib/database";
import {
  calculateWeeksAvailable,
  mapDistanceToTargetDistance,
  mapRaceTypeToTargetDistance,
  validateRaceTargetTime,
} from "@/lib/goalHelpers";
import { selectPlan } from "@/lib/planSelector";
import { mapSessionsToDays } from "@/lib/plans";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";

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
  availableDays: string[];
};

function buildOnboardingPlanData(data: OnboardingData) {
  const targetDistance =
    data.goalType === "race"
      ? mapRaceTypeToTargetDistance(data.raceType || "5k")
      : data.goalType === "distance"
        ? mapDistanceToTargetDistance(Number(data.raceDistance || 0))
        : undefined;
  const weeksAvailable =
    data.goalType === "race"
      ? calculateWeeksAvailable(data.raceTargetDate)
      : calculateWeeksAvailable(undefined);

  const daysCount = data.availableDays?.length ? Math.min(5, Math.max(2, data.availableDays.length)) : 3;
  let plan = selectPlan({
    goal: data.goalType || "distance",
    daysPerWeek: daysCount,
    availableDays: data.availableDays?.length >= 2 ? data.availableDays : undefined,
    weeksAvailable,
    level: data.fitnessLevel || "beginner",
    targetDistance,
  });
  if (data.availableDays?.length >= 2) {
    plan = mapSessionsToDays(plan, data.availableDays);
  }

  const goalData = {
    goalType: data.goalType,
    goal_type: data.goalType,
    level: data.fitnessLevel,
    fitnessLevel: data.fitnessLevel,
    availableDays: data.availableDays ?? [],
    availableDaysPerWeek: String(daysCount),
    daysPerWeek: daysCount,
    ...(data.goalType === "distance" && {
      raceType: data.raceType,
      raceDistanceKm: data.raceDistance,
      distanceKm: data.raceDistance,
    }),
    ...(data.goalType === "race" && {
      raceType: data.raceType,
      raceDistanceKm: data.raceDistance,
      raceTargetDate: data.raceTargetDate,
      raceTargetTime: data.raceTargetTime,
    }),
    selectedPlanId: plan.id,
    goalSavedAt: new Date().toISOString(),
  };

  return { goalData, plan };
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    gender: null,
    dateOfBirth: "",
    fitnessLevel: null,
    goalType: null,
    availableDays: [],
  });

  useEffect(() => {
    if (!session?.user?.id) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const persistOnboardingCompleted = async (payload?: Record<string, unknown>) => {
    if (!session?.user?.id) return;

    await upsertProfile(session.user.id, {
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
      ...payload,
    });

    localStorage.setItem(`pace-onboarding-skipped:${session.user.id}`, "true");
  };

  const handleSkipToSummary = () => {
    setStep(5);
  };

  const completeOnboarding = async (redirectToImport = false) => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const { goalData } = buildOnboardingPlanData(data);

      await persistOnboardingCompleted({
        first_name: data.firstName,
        gender: data.gender,
        date_of_birth: data.dateOfBirth || null,
        goal_type: data.goalType,
        goal_data: goalData,
        available_days: data.availableDays ?? [],
      });

      setIsLoading(false);
      navigate(redirectToImport ? "/import" : "/", { replace: true });
    } catch (error) {
      console.error("Onboarding error:", error);
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding(false);
  };

  const handleCompleteAndNavigateToImport = async () => {
    await completeOnboarding(true);
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
          className={`rounded-lg p-2 text-accent ${step === 1 ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">{step}/5</span>
        {step < 5 ? (
          <button
            onClick={handleSkipToSummary}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
          >
            Ignorer
          </button>
        ) : (
          <div className="w-[60px]" />
        )}
      </div>

      {/* Progress indicator dots */}
      <div className="flex justify-center gap-2 px-4 py-4">
        {[1, 2, 3, 4, 5].map((dotStep) => (
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
              <Step2Profile data={data} setData={setData} onNext={handleNext} />
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
              <Step3Level data={data} setData={setData} onNext={handleNext} />
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
              <Step4Goal data={data} setData={setData} onNext={handleNext} />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5-summary"
              custom={step > 5 ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6 py-8"
            >
              <Step5Summary 
                data={data} 
                isLoading={isLoading} 
                onComplete={handleComplete}
                onCompleteAndImport={handleCompleteAndNavigateToImport}
              />
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
            <span className="text-lg font-bold text-accent">•</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Plans d'entraînement adaptés à votre niveau</p>
            <p className="text-sm text-muted-foreground">Découvrez des programmes personnalisés</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-bold text-accent">•</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Suivez vos performances en temps réel</p>
            <p className="text-sm text-muted-foreground">Analysez chaque course en détail</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-bold text-accent">•</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Rejoignez une communauté de coureurs</p>
            <p className="text-sm text-muted-foreground">Partagez vos exploits et progressez ensemble</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-bold text-accent">•</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Importez votre historique existant</p>
            <p className="text-sm text-muted-foreground">Strava, Nike Run Club, Adidas Running...</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">Rejoignez des milliers de coureurs qui progressent chaque jour</p>

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
          className="z-[70] w-auto rounded-lg border-border bg-card p-0 shadow-md"
        >
          <CalendarComponent
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

/* Step 2 — Profile */
function Step2Profile({
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
              <p className="font-semibold capitalize">{gender}</p>
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

/* Step 3 — Level */
function Step3Level({
  data,
  setData,
  onNext,
}: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
}) {
  const levels: Array<{
    id: "beginner" | "intermediate" | "advanced";
    title: string;
    desc: string;
    example: string;
  }> = [
    {
      id: "beginner",
      title: "Débutant",
      desc: "Je cours moins de 20 km par semaine ou je débute",
      example: "Ex: 2-3 sorties de 30 min",
    },
    {
      id: "intermediate",
      title: "Intermédiaire",
      desc: "Je cours régulièrement 20-50 km par semaine",
      example: "Ex: 4 sorties, dont une longue sortie",
    },
    {
      id: "advanced",
      title: "Avancé",
      desc: "Je cours plus de 50km par semaine",
      example: "Ex: 5-6 sorties avec intervalles",
    },
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
            onClick={() => setData({ ...data, fitnessLevel: level.id })}
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
                <p className="mt-1 text-xs text-muted-foreground">{level.example}</p>
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

/* Step 4 — Goal */
function Step4Goal({
  data,
  setData,
  onNext,
}: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
}) {
  const [showCustomDistance, setShowCustomDistance] = useState(
    data.goalType === "distance" && data.raceType === "other",
  );
  const [showCustomRaceDistance, setShowCustomRaceDistance] = useState(
    data.goalType === "race" && data.raceType === "other",
  );
  const raceDistanceKm = Number(data.raceDistance || 0);
  const targetTimeError =
    data.goalType === "race" ? validateRaceTargetTime(raceDistanceKm, data.raceTargetTime || "") : null;
  const goals: Array<{ id: "weight" | "distance" | "race"; title: string; desc: string }> = [
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
            onClick={() => setData({ ...data, goalType: goal.id })}
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
          <DistanceSelector
            label="Distance cible"
            options={["5k", "10k", "20k", "semi", "marathon"]}
            selectedValue={data.raceType || ""}
            customValue={data.raceType === "other" ? data.raceDistance || "" : ""}
            showCustom={showCustomDistance}
            onSelectPreset={(value) => {
              setShowCustomDistance(false);
              setData({
                ...data,
                raceType: value as OnboardingData["raceType"],
                raceDistance:
                  value === "5k"
                    ? "5"
                    : value === "10k"
                      ? "10"
                      : value === "20k"
                        ? "20"
                        : value === "semi"
                          ? "21.097"
                          : "42.195",
              });
            }}
            onToggleCustom={() => {
              setShowCustomDistance((current) => !current);
              setData({ ...data, raceType: "other", raceDistance: data.raceDistance });
            }}
            onCustomChange={(value) => setData({ ...data, raceType: "other", raceDistance: value })}
          />
        </motion.div>
      )}

      {/* Race selector */}
      {data.goalType === "race" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <DistanceSelector
            label="Distance de la course"
            options={["5k", "10k", "20k", "semi", "marathon"]}
            selectedValue={data.raceType || ""}
            customValue={data.raceType === "other" ? data.raceDistance || "" : ""}
            showCustom={showCustomRaceDistance}
            onSelectPreset={(value) => {
              setShowCustomRaceDistance(false);
              setData({
                ...data,
                raceType: value as OnboardingData["raceType"],
                raceDistance:
                  value === "5k"
                    ? "5"
                    : value === "10k"
                      ? "10"
                      : value === "20k"
                        ? "20"
                        : value === "semi"
                          ? "21.097"
                          : "42.195",
              });
            }}
            onToggleCustom={() => {
              setShowCustomRaceDistance((current) => !current);
              setData({ ...data, raceType: "other", raceDistance: data.raceDistance });
            }}
            onCustomChange={(value) => setData({ ...data, raceType: "other", raceDistance: value })}
          />

          <OnboardingDatePicker
            id="raceDate"
            label="Date de la course"
            value={data.raceTargetDate || ""}
            onChange={(date) => setData({ ...data, raceTargetDate: date })}
          />

          <div className="space-y-3">
            <GoalTimePicker
              label="Objectif de temps"
              value={data.raceTargetTime || "00:45:00"}
              onChange={(time) => setData({ ...data, raceTargetTime: time })}
            />
            <p className="text-xs text-muted-foreground">Ce temps sera utilisé pour personnaliser votre plan d'entraînement</p>
            {targetTimeError ? <p className="text-xs text-destructive">{targetTimeError}</p> : null}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 rounded-xl border border-border bg-card/50 p-4"
      >
        <Label>Quels jours pouvez-vous vous entraîner ?</Label>
        <DaySelector
          selectedDays={data.availableDays}
          onChange={(days) => setData({ ...data, availableDays: days })}
        />
      </motion.div>

      <Button
        onClick={onNext}
        disabled={
          !data.goalType ||
          data.availableDays.length < 2 ||
          (data.goalType !== "weight" && !data.raceType) ||
          (data.goalType === "race" && (!data.raceTargetTime || Boolean(targetTimeError)))
        }
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        Suivant
      </Button>
    </div>
  );
}

/* Step 5 — Ready Summary */
function Step5Summary({
  data,
  isLoading,
  onComplete,
  onCompleteAndImport,
}: {
  data: OnboardingData;
  isLoading: boolean;
  onComplete: () => void;
  onCompleteAndImport: () => void;
}) {
  const { plan } = buildOnboardingPlanData(data);
  const resolvedDaysPerWeek = data.availableDays.length >= 2 ? data.availableDays.length : 3;
  const goalLabels: Record<string, string> = {
    weight: "Perte de poids",
    distance: `Courir ${data.raceDistance || data.raceType?.toUpperCase()}`,
    race: `Préparer ${data.raceDistance ? `une ${data.raceDistance}km` : `une ${data.raceType?.toUpperCase()}`}`,
  };

  const levelLabels: Record<string, string> = {
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Vous êtes prêt</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Voici un résumé de votre configuration
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-accent/20 bg-card/50 p-4">
        {/* Goal */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Objectif</p>
            <p className="font-semibold">{goalLabels[data.goalType || "distance"]}</p>
          </div>
        </div>

        {/* Level */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Niveau</p>
            <p className="font-semibold">{levelLabels[data.fitnessLevel || "beginner"]}</p>
          </div>
        </div>

        {/* Days per week */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entraînement</p>
            <p className="font-semibold">
              {data.availableDays.length >= 2
                ? `${resolvedDaysPerWeek} j : ${data.availableDays.join(", ")}`
                : `${resolvedDaysPerWeek} jours par semaine`}
            </p>
          </div>
        </div>

        {/* Training plan preview */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plan proposé</p>
            <p className="font-semibold">{plan.name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onComplete}
          disabled={isLoading}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création de votre plan personnalisé...
            </>
          ) : (
            "Commencer l'aventure"
          )}
        </Button>

        <button
          onClick={onCompleteAndImport}
          disabled={isLoading}
          className="w-full text-center text-sm text-accent transition-colors hover:text-accent/80"
        >
          Importer mon historique →
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
