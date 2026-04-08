import { ScrollReveal } from "@/components/ScrollReveal";
import { Calendar, ChevronRight, ChevronLeft, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, getWeekSessions, toggleSessionCompleted } from "@/lib/database";
import { normalizeGoalData } from "@/lib/goalHelpers";
import { getPlanById } from "@/lib/trainingPlans";
import SessionDetail from "./SessionDetail";
import type { TrainingPlan, Session } from "@/lib/trainingPlans";
import type { TrainingPlanSessionRow } from "@/lib/database";

type GoalType = "weight" | "race" | "distance";
type RaceType = "marathon" | "semi" | "20k" | "10k" | "5k" | "other";

type ProfileGoalData = {
  goalType: GoalType;
  availableDaysPerWeek: string;
  weightKg: string;
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

const intensityColors: Record<string, string> = {
  easy: "hsl(200, 80%, 55%)",
  moderate: "hsl(200, 100%, 50%)",
  tempo: "hsl(38, 92%, 50%)",
  interval: "hsl(0, 72%, 51%)",
  race: "hsl(270, 100%, 60%)",
};

const intensityLabels: Record<string, string> = {
  easy: "Facile",
  moderate: "Modéré",
  tempo: "Tempo",
  interval: "Intervalle",
  race: "Course",
};

function getSessionBadge(session: Session) {
  const type = session.type.toLowerCase();
  const description = session.description.toLowerCase();

  if (type.includes("récup")) {
    return {
      label: "Récup",
      color: intensityColors.easy,
    };
  }

  if (type.includes("longue")) {
    return {
      label: description.includes("allure marathon") || session.intensity === "moderate" ? "Spécifique" : "Longue",
      color: description.includes("allure marathon") || session.intensity === "moderate"
        ? intensityColors.moderate
        : intensityColors.easy,
    };
  }

  if (type.includes("facile")) {
    return {
      label: "Endurance",
      color: intensityColors.easy,
    };
  }

  if (type.includes("seuil")) {
    return {
      label: "Seuil",
      color: intensityColors.tempo,
    };
  }

  if (type.includes("tempo")) {
    return {
      label: "Tempo",
      color: intensityColors.tempo,
    };
  }

  if (type.includes("interval")) {
    return {
      label: "Intervalles",
      color: intensityColors.interval,
    };
  }

  return {
    label: intensityLabels[session.intensity] || "Séance",
    color: intensityColors[session.intensity] || intensityColors.easy,
  };
}

const defaultProfile: ProfileGoalData = {
  goalType: "weight",
  availableDaysPerWeek: "3",
  weightKg: "",
  targetWeightKg: "",
  weightTargetDate: "",
  raceType: "10k",
  raceDistanceKm: "10",
  raceTargetTime: "",
  raceTargetDate: "",
  distanceKm: "15",
  distanceTargetDate: "",
  level: "beginner",
};

export default function TrainingTab() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileGoalData>(defaultProfile);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weekSessions, setWeekSessions] = useState<TrainingPlanSessionRow[]>([]);
  const [completingSession, setCompletingSession] = useState<string | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      if (!user) {
        setProfile(defaultProfile);
        setSelectedPlan(null);
        setIsLoading(false);
        return;
      }

      try {
        const profileRow = await getProfile(user.id);
        const goalData = profileRow?.goal_data;

        if (goalData && typeof goalData === "object" && !Array.isArray(goalData)) {
          const newProfile = {
            ...defaultProfile,
            ...(normalizeGoalData(goalData as Partial<ProfileGoalData>) as Partial<ProfileGoalData>),
          };
          setProfile(newProfile);

          // Load the selected plan
          if (newProfile.selectedPlanId) {
            const plan = getPlanById(newProfile.selectedPlanId);
            if (plan) {
              setSelectedPlan(plan);
              
              // Calculate current week based on when goal was saved
              if (newProfile.goalSavedAt) {
                const savedDate = new Date(newProfile.goalSavedAt);
                const now = new Date();
                const weeksDiff = Math.floor((now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                const calculatedWeek = Math.min(Math.max(1, weeksDiff + 1), plan.durationWeeks);
                setCurrentWeek(calculatedWeek);

                // Load week sessions
                const sessions = await getWeekSessions(user.id, newProfile.selectedPlanId, calculatedWeek);
                setWeekSessions(sessions);
              }
            }
          }
        } else {
          setProfile(defaultProfile);
          setSelectedPlan(null);
        }
      } catch {
        setProfile(defaultProfile);
        setSelectedPlan(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlan();

    const handleGoalUpdated = () => {
      void loadPlan();
    };

    window.addEventListener("pace-goal-updated", handleGoalUpdated);
    return () => {
      window.removeEventListener("pace-goal-updated", handleGoalUpdated);
    };
  }, [user]);

  // Reload week sessions when week changes
  useEffect(() => {
    const loadWeekSessions = async () => {
      if (user && selectedPlan) {
        try {
          const sessions = await getWeekSessions(user.id, selectedPlan.id, currentWeek);
          setWeekSessions(sessions);
        } catch (error) {
          console.error("Error loading week sessions:", error);
          setWeekSessions([]);
        }
      }
    };

    void loadWeekSessions();
  }, [user, selectedPlan, currentWeek]);

  const currentWeekData = useMemo(() => {
    if (!selectedPlan) return null;
    return selectedPlan.weeklySchedule.find(w => w.week === currentWeek);
  }, [selectedPlan, currentWeek]);

  const progressPercentage = useMemo(() => {
    if (!selectedPlan) return 0;
    return Math.round((currentWeek / selectedPlan.durationWeeks) * 100);
  }, [selectedPlan, currentWeek]);

  const groupedPhaseOverview = useMemo(() => {
    if (!selectedPlan) return [];

    const totalWeeks = selectedPlan.durationWeeks;
    const taperWeeks = totalWeeks >= 12 ? 2 : 1;
    const picWeek = Math.max(totalWeeks - taperWeeks, 1);
    const taperStart = Math.min(picWeek + 1, totalWeeks);
    const buildEnd = Math.max(picWeek - 1, 1);
    const baseEnd = totalWeeks >= 8 ? Math.max(2, Math.round(totalWeeks * 0.35)) : 0;

    const rawPhases = [
      baseEnd > 0
        ? { label: "Base", startWeek: 1, endWeek: Math.min(baseEnd, buildEnd) }
        : null,
      {
        label: "Build",
        startWeek: baseEnd > 0 ? Math.min(baseEnd + 1, buildEnd) : 1,
        endWeek: buildEnd,
      },
      totalWeeks > 1 ? { label: "Pic", startWeek: picWeek, endWeek: picWeek } : null,
      { label: "Affûtage", startWeek: taperStart, endWeek: totalWeeks },
    ].filter((phase): phase is { label: string; startWeek: number; endWeek: number } =>
      Boolean(phase && phase.startWeek <= phase.endWeek),
    );

    return rawPhases.map((phase) => {
      const weeks = selectedPlan.weeklySchedule.filter(
        (week) => week.week >= phase.startWeek && week.week <= phase.endWeek,
      );

      return {
        ...phase,
        isCurrent: currentWeek >= phase.startWeek && currentWeek <= phase.endWeek,
        focuses: [...new Set(weeks.map((week) => week.focus))].slice(0, 3),
      };
    });
  }, [selectedPlan, currentWeek]);

  const nextWeek = () => {
    if (selectedPlan && currentWeek < selectedPlan.durationWeeks) {
      setCurrentWeek(currentWeek + 1);
      setSelectedSession(null);
    }
  };

  const prevWeek = () => {
    if (currentWeek > 1) {
      setCurrentWeek(currentWeek - 1);
      setSelectedSession(null);
    }
  };

  const handleToggleSessionCompleted = async (session: Session) => {
    if (!user || !selectedPlan) return;
    
    const key = `${session.day}-${session.type}`;
    setCompletingSession(key);
    
    try {
      await toggleSessionCompleted(
        selectedPlan.id,
        currentWeek,
        session.day,
        user.id
      );
      
      // Reload week sessions
      const sessions = await getWeekSessions(user.id, selectedPlan.id, currentWeek);
      setWeekSessions(sessions);
    } catch (error) {
      console.error("Error toggling session:", error);
    } finally {
      setCompletingSession(null);
    }
  };

  const isSessionCompleted = (session: Session) => {
    return weekSessions.some(
      ws => ws.session_day === session.day && ws.completed
    );
  };

  if (isLoading) {
    return <div className="space-y-4" />;
  }

  if (!selectedPlan || !currentWeekData) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold">Aucun plan sélectionné</p>
          <p className="text-xs text-muted-foreground mt-1">Allez dans l'onglet "Objectif" pour sélectionner un plan d'entraînement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de progression */}
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">Progression du plan</h2>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {currentWeek}/{selectedPlan.durationWeeks}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Semaine {currentWeek}</span>
              <span>{progressPercentage}%</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Plan name and info */}
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">{selectedPlan.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{selectedPlan.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px]">
              {selectedPlan.daysPerWeek} j/semaine
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {selectedPlan.durationWeeks} semaines
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {selectedPlan.level === "beginner" ? "Débutant" : selectedPlan.level === "intermediate" ? "Intermédiaire" : "Avancé"}
            </Badge>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Étapes du plan</h2>
            <Badge variant="outline" className="text-[10px]">
              {groupedPhaseOverview.length} phases
            </Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {groupedPhaseOverview.map((phase) => (
              <div
                key={`${phase.label}-${phase.startWeek}-${phase.endWeek}`}
                className={`rounded-lg border p-3 ${phase.isCurrent ? "border-accent bg-accent/10" : "border-border bg-muted/20"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {phase.startWeek === phase.endWeek
                      ? `Semaine ${phase.startWeek}`
                      : `Semaines ${phase.startWeek}-${phase.endWeek}`}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {phase.label}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{phase.focuses.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Semaine actuelle */}
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">Semaine {currentWeek}</h2>
            </div>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{currentWeekData.focus}</p>
          <div className="rounded-lg bg-accent/10 p-2.5 mb-4 text-xs text-accent font-medium text-center">
            Distance totale : {currentWeekData.totalDistance.toFixed(1)} km
          </div>

          <div className="space-y-2">
            {currentWeekData.sessions.map((session, i) => {
              const isCompleted = isSessionCompleted(session);
              const isToggling = completingSession === `${session.day}-${session.type}`;
              const sessionBadge = getSessionBadge(session);
              
              return (
                <ScrollReveal key={`${currentWeek}-${i}`} delay={i === 0 ? 0 : i < 3 ? 0.05 : 0}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSession(session)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedSession(session);
                      }
                    }}
                    className="w-full flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggleSessionCompleted(session);
                      }}
                      disabled={isToggling}
                      className="flex-shrink-0 hover:opacity-70 transition-opacity"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div
                      className="h-10 w-1 rounded-full"
                      style={{ backgroundColor: intensityColors[session.intensity] || intensityColors["easy"] }}
                    />
                    <div className="w-12 text-xs font-semibold text-muted-foreground">{session.day}</div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-semibold ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{session.type}</p>
                      <p className="text-xs text-muted-foreground">{session.distance.toFixed(1)} km · {session.pace} · {session.duration} min</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{ color: sessionBadge.color, borderColor: sessionBadge.color }}
                    >
                      {sessionBadge.label}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* Navigation entre semaines */}
      <ScrollReveal>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={prevWeek}
            disabled={currentWeek <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Semaine précédente
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={nextWeek}
            disabled={currentWeek >= selectedPlan.durationWeeks}
          >
            Semaine suivante
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </ScrollReveal>

      {/* Détails de la séance */}
      {selectedSession && (
        <SessionDetail session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
