import { ScrollReveal } from "@/components/ScrollReveal";
import { Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import SessionDetail from "./SessionDetail";

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
};

type Session = {
  day: string;
  type: string;
  distanceKm: number;
  pace: string;
  color: string;
};

type Phase = {
  name: "Montee en charge" | "Pic" | "Affutage";
  weeks: number;
  focus: string;
  loadMultiplier: number;
};

const STORAGE_KEY = "pace-user-profile-goal";
const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const colorEasy = "hsl(200, 80%, 55%)";
const colorQuality = "hsl(0, 72%, 51%)";
const colorTempo = "hsl(38, 92%, 50%)";
const colorLong = "hsl(72, 89%, 58%)";
const colorRecovery = "hsl(270, 60%, 60%)";

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
};

function parsePaceToMinutes(pace: string): number {
  const [m, s] = pace.split(":").map(Number);
  if (Number.isNaN(m) || Number.isNaN(s)) return 0;
  return m + s / 60;
}

function formatEstimatedTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function estimateWeeks(profile: ProfileGoalData): number {
  if (profile.goalType === "weight") {
    if (profile.weightTargetDate) {
      const today = new Date();
      const target = new Date(profile.weightTargetDate);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return Math.min(20, Math.max(6, Math.ceil(diffDays / 7)));
    }
    return 12;
  }
  if (profile.goalType === "race") {
    if (profile.raceTargetDate) {
      const today = new Date();
      const target = new Date(profile.raceTargetDate);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return Math.min(20, Math.max(6, Math.ceil(diffDays / 7)));
    }
    const raceKm = Number(profile.raceDistanceKm) || 10;
    if (raceKm >= 42) return 12;
    if (raceKm >= 21) return 10;
    return 8;
  }
  if (profile.goalType === "distance") {
    if (profile.distanceTargetDate) {
      const today = new Date();
      const target = new Date(profile.distanceTargetDate);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return Math.min(16, Math.max(6, Math.ceil(diffDays / 7)));
    }
    const targetKm = Number(profile.distanceKm) || 20;
    if (targetKm >= 42) return 12;
    if (targetKm >= 20) return 10;
    return 8;
  }
  return 8;
}

function buildPhases(profile: ProfileGoalData): Phase[] {
  const totalWeeks = estimateWeeks(profile);
  const monteeWeeks = Math.max(3, Math.round(totalWeeks * 0.55));
  const picWeeks = Math.max(2, Math.round(totalWeeks * 0.3));
  const affutageWeeks = Math.max(1, totalWeeks - monteeWeeks - picWeeks);

  if (profile.goalType === "weight") {
    return [
      { name: "Montee en charge", weeks: monteeWeeks, focus: "Installer la regularite et augmenter progressivement le volume.", loadMultiplier: 0.9 },
      { name: "Pic", weeks: picWeeks, focus: "Maximiser la depense avec 1-2 seances qualite/semaine.", loadMultiplier: 1.05 },
      { name: "Affutage", weeks: affutageWeeks, focus: "Reduire la fatigue tout en maintenant la frequence.", loadMultiplier: 0.75 },
    ];
  }

  if (profile.goalType === "race") {
    return [
      { name: "Montee en charge", weeks: monteeWeeks, focus: "Construire base aerobie et volume specifique.", loadMultiplier: 0.95 },
      { name: "Pic", weeks: picWeeks, focus: "Accent sur allure objectif et sorties longues cles.", loadMultiplier: 1.12 },
      { name: "Affutage", weeks: affutageWeeks, focus: "Baisser le volume, garder de la vitesse, arriver frais.", loadMultiplier: 0.7 },
    ];
  }

  return [
    { name: "Montee en charge", weeks: monteeWeeks, focus: "Augmenter progressivement le kilometrage cible.", loadMultiplier: 0.95 },
    { name: "Pic", weeks: picWeeks, focus: "Semaine(s) au plus proche de la charge cible.", loadMultiplier: 1.1 },
    { name: "Affutage", weeks: affutageWeeks, focus: "Consolider l'endurance et diminuer la charge.", loadMultiplier: 0.72 },
  ];
}

function buildSessions(profile: ProfileGoalData): { sessions: Session[]; subtitle: string } {
  const days = Math.min(7, Math.max(1, Number(profile.availableDaysPerWeek) || 3));
  const activeDays = weekDays.slice(0, days);
  const sessions: Session[] = [];

  if (profile.goalType === "weight") {
    const base: Session[] = [
      { day: "Lun", type: "Footing facile", distanceKm: 6, pace: "6:00", color: colorEasy },
      { day: "Mar", type: "Tempo leger", distanceKm: 5, pace: "5:30", color: colorTempo },
      { day: "Mer", type: "Recuperation active", distanceKm: 4, pace: "6:30", color: colorRecovery },
      { day: "Jeu", type: "Footing facile", distanceKm: 6, pace: "5:55", color: colorEasy },
      { day: "Ven", type: "Intervalles courts", distanceKm: 5, pace: "5:00", color: colorQuality },
      { day: "Sam", type: "Sortie longue facile", distanceKm: 8, pace: "6:10", color: colorLong },
      { day: "Dim", type: "Jog de recuperation", distanceKm: 4, pace: "6:40", color: colorRecovery },
    ];
    activeDays.forEach((day, i) => sessions.push({ ...base[i], day }));
    return { sessions, subtitle: `Plan perte de poids adapte a ${days} jour(s)/semaine` };
  }

  if (profile.goalType === "race") {
    const raceKm = Number(profile.raceDistanceKm) || 10;
    const longRun = Math.min(Math.max(raceKm * 0.55, 8), 30);
    const tempoKm = Math.min(Math.max(raceKm * 0.35, 5), 16);
    const easyKm = Math.min(Math.max(raceKm * 0.25, 5), 12);
    const base: Session[] = [
      { day: "Lun", type: "Footing facile", distanceKm: easyKm, pace: "5:45", color: colorEasy },
      { day: "Mar", type: "Intervalles (allure course)", distanceKm: Math.max(6, easyKm), pace: "4:40", color: colorQuality },
      { day: "Mer", type: "Recuperation", distanceKm: 4, pace: "6:20", color: colorRecovery },
      { day: "Jeu", type: "Seuil / tempo", distanceKm: tempoKm, pace: "5:00", color: colorTempo },
      { day: "Ven", type: "Footing facile", distanceKm: easyKm, pace: "5:50", color: colorEasy },
      { day: "Sam", type: "Sortie longue", distanceKm: longRun, pace: "5:35", color: colorLong },
      { day: "Dim", type: "Jog de recuperation", distanceKm: 5, pace: "6:25", color: colorRecovery },
    ];
    activeDays.forEach((day, i) => sessions.push({ ...base[i], day }));
    return { sessions, subtitle: `Plan course (${raceKm} km) adapte a ${days} jour(s)/semaine` };
  }

  const targetKm = Number(profile.distanceKm) || 20;
  const longRun = Math.min(Math.max(targetKm * 0.45, 8), 28);
  const enduranceKm = Math.min(Math.max(targetKm * 0.25, 6), 14);
  const base: Session[] = [
    { day: "Lun", type: "Endurance fondamentale", distanceKm: enduranceKm, pace: "5:55", color: colorEasy },
    { day: "Mar", type: "Intervalles progressifs", distanceKm: Math.max(6, enduranceKm - 1), pace: "4:50", color: colorQuality },
    { day: "Mer", type: "Recuperation", distanceKm: 4, pace: "6:25", color: colorRecovery },
    { day: "Jeu", type: "Sortie reguliere", distanceKm: enduranceKm, pace: "5:40", color: colorTempo },
    { day: "Ven", type: "Footing facile", distanceKm: Math.max(5, enduranceKm - 2), pace: "6:00", color: colorEasy },
    { day: "Sam", type: "Sortie longue distance", distanceKm: longRun, pace: "5:50", color: colorLong },
    { day: "Dim", type: "Recuperation active", distanceKm: 5, pace: "6:30", color: colorRecovery },
  ];
  activeDays.forEach((day, i) => sessions.push({ ...base[i], day }));
  return { sessions, subtitle: `Plan distance (${targetKm} km) adapte a ${days} jour(s)/semaine` };
}

export default function TrainingTab() {
  const [profile, setProfile] = useState<ProfileGoalData>(defaultProfile);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    const readProfile = () => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setProfile(defaultProfile);
        return;
      }
      try {
        setProfile({ ...defaultProfile, ...JSON.parse(raw) as ProfileGoalData });
      } catch {
        setProfile(defaultProfile);
      }
    };

    readProfile();
    window.addEventListener("storage", readProfile);
    window.addEventListener("pace-goal-updated", readProfile);
    return () => {
      window.removeEventListener("storage", readProfile);
      window.removeEventListener("pace-goal-updated", readProfile);
    };
  }, []);

  const { sessions, subtitle } = useMemo(() => buildSessions(profile), [profile]);
  const totalKm = sessions.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalMin = sessions.reduce((sum, s) => sum + s.distanceKm * parsePaceToMinutes(s.pace), 0);
  const phases = useMemo(() => buildPhases(profile), [profile]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Prochaines semaines</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Voici les phases de votre plan d'entraînement. Chaque phase a un objectif spécifique pour vous préparer progressivement à votre objectif.</p>
        <div className="space-y-3">
          {phases.map((phase, idx) => (
            <div key={phase.name} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{idx + 1}. {phase.name}</p>
                <Badge variant="outline" className="text-[10px]">{phase.weeks} sem.</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{phase.focus}</p>
              <p className="text-xs text-accent font-medium">
                Charge cible: ~{Math.round(totalKm * phase.loadMultiplier)} km/semaine
              </p>
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                {phase.name === "Montee en charge" && "📈 Cette phase construit votre base aérobie. Augmentez progressivement le volume pour adapter votre corps à l'effort."}
                {phase.name === "Pic" && "⚡ Phase intensive pour augmenter votre capacité. Vous travaillez à des allures rapides et incluez des séances qualité. C'est la phase clé de votre progression."}
                {phase.name === "Affutage" && "🎯 Phase de récupération active. Réduisez le volume tout en maintenant l'intensité pour arriver frais à votre objectif."}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Cette semaine</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>
        <div className="space-y-2">
          {sessions.map((session, i) => (
            <ScrollReveal key={session.day} delay={i * 0.05}>
              <button
                onClick={() => setSelectedSession(session)}
                className="w-full flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: session.color }} />
                <div className="w-10 text-xs font-semibold text-muted-foreground">{session.day}</div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{session.type}</p>
                  <p className="text-xs text-muted-foreground">{session.distanceKm.toFixed(1)} km · {session.pace}/km</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </ScrollReveal>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-accent/10 p-3 text-center text-xs text-accent font-medium">
          Total hebdo : {totalKm.toFixed(1)}km · {formatEstimatedTime(totalMin)} estimees
        </div>
      </div>

      {selectedSession && (
        <SessionDetail session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
