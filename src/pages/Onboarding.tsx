import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Calendar, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DaySelector } from "@/components/goal/DaySelector";
import { GoalTimePicker } from "@/components/goal/GoalTimePicker";
import { useAuth } from "@/contexts/AuthContext";
import { upsertProfile } from "@/lib/database";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { getPlanById, getPlansForDistance, mapSessionsToDays } from "@/lib/plans";
import type { PlanDistance } from "@/lib/plans/types";

export type OnboardingGoalPick = "marathon" | "semi" | "10k" | "5k" | "regular" | "none";

export const GOAL_OPTIONS: Array<{
  id: OnboardingGoalPick;
  emoji: string;
  label: string;
  description: string;
}> = [
  { id: "marathon", emoji: "🏅", label: "Marathon", description: "42.195 km" },
  { id: "semi", emoji: "🥈", label: "Semi-marathon", description: "21.1 km" },
  { id: "10k", emoji: "🏃", label: "10 km", description: "Course populaire" },
  { id: "5k", emoji: "👟", label: "5 km", description: "Parfait pour débuter" },
  { id: "regular", emoji: "📅", label: "Courir régulièrement", description: "3 fois/semaine" },
  { id: "none", emoji: "🎯", label: "Sans objectif précis", description: "Je cours librement" },
];

type OnboardingData = {
  firstName: string;
  gender: "homme" | "femme" | null;
  dateOfBirth: string;
  fitnessLevel: "beginner" | "intermediate" | "advanced" | null;
  goalPick: OnboardingGoalPick | null;
  selectedPlanId: string | null;
  raceTargetDate?: string;
  raceTargetTime?: string;
  availableDays: string[];
};

function goalPickToPlanDistance(pick: OnboardingGoalPick): PlanDistance | null {
  if (pick === "marathon") return "marathon";
  if (pick === "semi") return "semi";
  if (pick === "10k") return "10k";
  if (pick === "5k") return "5k";
  if (pick === "regular") return "regular";
  return null;
}

function buildOnboardingPlanData(data: OnboardingData) {
  if (!data.goalPick || data.goalPick === "none") {
    return {
      goalData: {
        goalType: "none",
        goal_type: "none",
        level: data.fitnessLevel,
        fitnessLevel: data.fitnessLevel,
        availableDays: [],
        availableDaysPerWeek: "0",
        daysPerWeek: 0,
        selectedPlanId: null,
        goalSavedAt: new Date().toISOString(),
      },
      plan: null,
    };
  }

  const preset = data.selectedPlanId ? getPlanById(data.selectedPlanId) : undefined;
  if (!preset) {
    return { goalData: null, plan: null };
  }

  const plan =
    data.availableDays.length >= 2 ? mapSessionsToDays(preset, data.availableDays) : preset;

  const daysCount = data.availableDays.length >= 2 ? Math.min(5, Math.max(2, data.availableDays.length)) : 3;

  const raceMeta =
    data.goalPick === "marathon"
      ? { raceType: "marathon" as const, raceDistanceKm: "42.195" }
      : data.goalPick === "semi"
        ? { raceType: "semi" as const, raceDistanceKm: "21.097" }
        : data.goalPick === "10k"
          ? { raceType: "10k" as const, raceDistanceKm: "10" }
          : data.goalPick === "5k"
            ? { raceType: "5k" as const, raceDistanceKm: "5" }
            : { raceType: "10k" as const, raceDistanceKm: "10" };

  const goalData = {
    goalType: "race",
    goal_type: "race",
    level: data.fitnessLevel,
    fitnessLevel: data.fitnessLevel,
    availableDays: data.availableDays ?? [],
    availableDaysPerWeek: String(daysCount),
    daysPerWeek: daysCount,
    raceType: raceMeta.raceType,
    raceDistanceKm: raceMeta.raceDistanceKm,
    raceTargetDate: data.raceTargetDate,
    raceTargetTime: data.raceTargetTime,
    selectedPlanId: preset.id,
    goalSavedAt: new Date().toISOString(),
  };

  return { goalData, plan };
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    gender: null,
    dateOfBirth: "",
    fitnessLevel: null,
    goalPick: null,
    selectedPlanId: null,
    availableDays: [],
  });

  useEffect(() => {
    if (!session?.user?.id) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const scrollStepIntoView = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    contentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
      scrollStepIntoView();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      scrollStepIntoView();
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
    setStep(6);
    scrollStepIntoView();
  };

  const completeOnboarding = async (redirectToImport = false) => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const { goalData } = buildOnboardingPlanData(data);
      if (data.goalPick && data.goalPick !== "none" && goalData == null) {
        logger.error("Onboarding: plan introuvable pour la sélection");
        setIsLoading(false);
        return;
      }

      await persistOnboardingCompleted({
        first_name: data.firstName,
        gender: data.gender,
        date_of_birth: data.dateOfBirth || null,
        goal_type: !data.goalPick || data.goalPick === "none" ? "none" : "race",
        goal_data: !data.goalPick || data.goalPick === "none" ? null : goalData,
        available_days: !data.goalPick || data.goalPick === "none" ? [] : (data.availableDays ?? []),
      });

      setIsLoading(false);
      navigate(redirectToImport ? "/import" : "/", { replace: true });
    } catch (error) {
      logger.error("Onboarding error", error);
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding(false);
  };

  const handleCompleteAndNavigateToImport = async () => {
    await completeOnboarding(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={handleBack}
          className={`rounded-lg p-2 text-accent ${step === 1 ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">{step}/6</span>
        {step < 6 ? (
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
      <div className="flex shrink-0 justify-center gap-2 px-4 py-4">
        {[1, 2, 3, 4, 5, 6].map((dotStep) => (
          <div
            key={dotStep}
            className="h-1.5 rounded-full transition-all duration-200"
            style={{
              width: dotStep === step ? 24 : 6,
              backgroundColor: dotStep <= step ? "hsl(var(--accent))" : "hsl(var(--border))",
            }}
          />
        ))}
      </div>

      {/* Content — bounded scroll area so Capacitor/iOS can scrollTo ref; window fallbacks for document scroll */}
      <div
        ref={contentScrollRef}
        className="relative max-h-[calc(100dvh-8.5rem)] min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-20"
      >
        {step === 1 ? (
          <div className="space-y-8 py-8 animate-in fade-in slide-in-from-right-2 duration-200">
            <Step1Features onNext={handleNext} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6 py-8 animate-in fade-in slide-in-from-right-2 duration-200">
            <Step1Welcome onNext={handleNext} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6 py-8 animate-in fade-in slide-in-from-right-2 duration-200">
            <Step2Profile data={data} setData={setData} onNext={handleNext} />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6 py-8 animate-in fade-in slide-in-from-right-2 duration-200">
            <Step3Level data={data} setData={setData} onNext={handleNext} />
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-6 py-8 animate-in fade-in slide-in-from-right-2 duration-200">
            <Step4Goal data={data} setData={setData} onNext={handleNext} />
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-6 py-8 animate-in fade-in slide-in-from-right-2 duration-200">
            <Step5Summary
              data={data}
              isLoading={isLoading}
              onComplete={handleComplete}
              onCompleteAndImport={handleCompleteAndNavigateToImport}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

function Step1Features({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center space-y-8">
      <div>
        <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <img src="/PaceL2.png" alt="Pace" className="w-14 h-14 object-contain" />
        </div>
        <h1 className="text-3xl font-black text-foreground">Bienvenue sur Pace</h1>
        <p className="text-muted-foreground mt-2">L&apos;app qui s&apos;adapte à votre forme du moment</p>
      </div>

      <div className="w-full space-y-3">
        {[
          {
            emoji: "📊",
            title: "Charge d'entraînement",
            description: "Sachez chaque jour si vous êtes en forme pour une séance intense ou si vous devez récupérer",
            color: "#1DB954",
          },
          {
            emoji: "📅",
            title: "Plan personnalisé",
            description: "Un plan semaine par semaine adapté à votre objectif et votre niveau actuel",
            color: "#60a5fa",
          },
          {
            emoji: "❤️",
            title: "Zones FC en temps réel",
            description: "Entraînez-vous dans la bonne zone pour progresser sans vous blesser",
            color: "#ef4444",
          },
        ].map((feature) => (
          <div key={feature.title} className="flex items-center gap-4 bg-muted/50 rounded-xl p-4 text-left">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: `${feature.color}20` }}
            >
              {feature.emoji}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{feature.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onNext} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 md:w-auto">
        Continuer
      </Button>
    </div>
  );
}

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

function parseIsoDateParts(iso: string): { d: number; m: number; y: number } | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [ys, ms, ds] = iso.split("-").map(Number);
  const dt = new Date(ys, ms - 1, ds);
  if (dt.getFullYear() !== ys || dt.getMonth() !== ms - 1 || dt.getDate() !== ds) return null;
  return { d: ds, m: ms, y: ys };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function toIsoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* Date picker — 3 listes natives (meilleur confort iOS que Popover + Calendar) */
function OnboardingDatePicker({
  id,
  label,
  value,
  onChange,
  required = false,
  preset = "birth",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  /** birth: années 1920 → année en cours ; future: année en cours → +5 ans */
  preset?: "birth" | "future";
}) {
  const currentYear = new Date().getFullYear();
  const isFuture = preset === "future";
  const parsed = parseIsoDateParts(value);

  const defaultBirthYear = Math.min(currentYear - 28, currentYear - 10);

  const [day, setDay] = useState(() => {
    if (parsed) return parsed.d;
    if (isFuture) return new Date().getDate();
    return 1;
  });
  const [month, setMonth] = useState(() => {
    if (parsed) return parsed.m;
    if (isFuture) return new Date().getMonth() + 1;
    return 1;
  });
  const [year, setYear] = useState(() => {
    if (parsed) return parsed.y;
    if (isFuture) return currentYear;
    return defaultBirthYear;
  });

  useEffect(() => {
    const p = parseIsoDateParts(value);
    if (p) {
      setDay(p.d);
      setMonth(p.m);
      setYear(p.y);
      return;
    }
    const now = new Date();
    if (isFuture) {
      setDay(now.getDate());
      setMonth(now.getMonth() + 1);
      setYear(now.getFullYear());
    } else {
      setDay(1);
      setMonth(1);
      setYear(Math.min(currentYear - 28, currentYear - 10));
    }
  }, [value, isFuture, currentYear]);

  const months = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" },
  ];

  const maxDay = daysInMonth(year, month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const years = isFuture
    ? Array.from({ length: 6 }, (_, i) => currentYear + i)
    : Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);

  const clampDay = (d: number, m: number, y: number) => Math.min(d, daysInMonth(y, m));

  const commit = (d: number, m: number, y: number) => {
    const dm = clampDay(d, m, y);
    const date = new Date(y, m - 1, dm);
    if (!Number.isNaN(date.getTime())) {
      onChange(toIsoDate(y, m, dm));
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-day`} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <select
          id={`${id}-day`}
          aria-label={`${label} — jour`}
          value={Math.min(day, maxDay)}
          onChange={(e) => {
            const d = Number(e.target.value);
            setDay(d);
            commit(d, month, year);
          }}
          className="min-h-[44px] rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          id={`${id}-month`}
          aria-label={`${label} — mois`}
          value={month}
          onChange={(e) => {
            const m = Number(e.target.value);
            setMonth(m);
            const nextDay = clampDay(day, m, year);
            if (nextDay !== day) setDay(nextDay);
            commit(nextDay, m, year);
          }}
          className="min-h-[44px] rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {months.map((mo) => (
            <option key={mo.value} value={mo.value}>
              {mo.label}
            </option>
          ))}
        </select>
        <select
          id={`${id}-year`}
          aria-label={`${label} — année`}
          value={year}
          onChange={(e) => {
            const y = Number(e.target.value);
            setYear(y);
            const nextDay = clampDay(day, month, y);
            if (nextDay !== day) setDay(nextDay);
            commit(nextDay, month, y);
          }}
          className="min-h-[44px] rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
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
            <button
              key={gender}
              onClick={() => setData({ ...data, gender })}
              className={`relative rounded-lg border-2 px-4 py-6 text-center transition-all ${
                data.gender === gender
                  ? "border-accent bg-accent/10 shadow-[0_0_0_2px_hsl(var(--accent))]"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <p className="font-semibold capitalize">{gender}</p>
            </button>
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
          <button
            key={level.id}
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
          </button>
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
  const planDistance = data.goalPick ? goalPickToPlanDistance(data.goalPick) : null;
  const availablePlans =
    planDistance && planDistance !== "none" ? getPlansForDistance(planDistance) : [];

  const pickGoal = (id: OnboardingGoalPick) => {
    if (id === "none") {
      setData({ ...data, goalPick: "none", selectedPlanId: null });
      return;
    }
    if (id === "regular") {
      setData({ ...data, goalPick: "regular", selectedPlanId: "regular_running" });
      return;
    }
    const d = goalPickToPlanDistance(id);
    const first = d ? getPlansForDistance(d)[0] : undefined;
    setData({
      ...data,
      goalPick: id,
      selectedPlanId: first?.id ?? null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quel est votre objectif ?</h2>
      </div>

      <div className="space-y-3">
        {GOAL_OPTIONS.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() => pickGoal(goal.id)}
            className={cn(
              "w-full rounded-lg border-2 p-4 text-left transition-all",
              data.goalPick === goal.id
                ? "border-accent bg-accent/10 shadow-[0_0_0_2px_hsl(var(--accent))]"
                : "border-border hover:border-accent/50",
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>
                {goal.emoji}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{goal.label}</p>
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {data.goalPick && ["marathon", "semi", "10k", "5k"].includes(data.goalPick) && availablePlans.length > 0 ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Choisissez votre niveau
          </h3>
          {availablePlans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setData({ ...data, selectedPlanId: plan.id })}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                data.selectedPlanId === plan.id
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card",
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

          <OnboardingDatePicker
            id="raceDate"
            label="Date de la course (optionnel)"
            value={data.raceTargetDate || ""}
            onChange={(date) => setData({ ...data, raceTargetDate: date })}
            preset="future"
          />

          <div className="space-y-3">
            <GoalTimePicker
              label="Objectif de temps (optionnel)"
              value={data.raceTargetTime || "00:45:00"}
              onChange={(time) => setData({ ...data, raceTargetTime: time })}
            />
            <p className="text-xs text-muted-foreground">
              Ces informations aident à personnaliser votre plan ; vous pourrez les modifier plus tard.
            </p>
          </div>
        </div>
      ) : null}

      {data.goalPick && data.goalPick !== "none" ? (
        <div className="space-y-2 rounded-xl border border-border bg-card/50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Label>Quels jours pouvez-vous vous entraîner ?</Label>
          <DaySelector
            selectedDays={data.availableDays}
            onChange={(days) => setData({ ...data, availableDays: days })}
          />
        </div>
      ) : data.goalPick === "none" ? (
        <div className="rounded-xl border border-border bg-card/50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm text-muted-foreground">
            Aucun objectif précis sélectionné. Vous pourrez en définir un plus tard depuis l&apos;onglet Plan.
          </p>
        </div>
      ) : null}

      <Button
        onClick={onNext}
        disabled={
          !data.goalPick ||
          (data.goalPick !== "none" && data.availableDays.length < 2) ||
          (["marathon", "semi", "10k", "5k"].includes(data.goalPick ?? "") && !data.selectedPlanId)
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
  const goalSummaryLabel =
    data.goalPick === "none" || !data.goalPick
      ? "Course libre sans objectif précis"
      : GOAL_OPTIONS.find((g) => g.id === data.goalPick)?.label ?? "Course";
  const planLabel =
    plan?.name ?? (data.selectedPlanId ? getPlanById(data.selectedPlanId)?.name : null) ?? "—";

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
            <p className="font-semibold">{goalSummaryLabel}</p>
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
        {plan ? (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plan proposé</p>
              <p className="font-semibold">{planLabel}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plan proposé</p>
              <p className="font-semibold">Aucun plan imposé</p>
            </div>
          </div>
        )}
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
