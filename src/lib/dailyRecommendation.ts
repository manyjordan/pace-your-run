import type { TrainingLoadResult } from "./trainingLoad";

export interface DailyRecommendation {
  type: "rest" | "easy" | "moderate" | "hard" | "race_ready";
  emoji: string;
  title: string;
  description: string;
  color: string;
  maxIntensity: string;
}

export function getDailyRecommendation(load: TrainingLoadResult, lastRunDaysAgo: number): DailyRecommendation {
  if (lastRunDaysAgo === 0) {
    return {
      type: "rest",
      emoji: "😴",
      title: "Repos aujourd'hui",
      description: "Vous avez couru aujourd'hui. Récupérez bien.",
      color: "#9CA3AF",
      maxIntensity: "Repos actif uniquement",
    };
  }

  if (load.tsb < -25) {
    return {
      type: "rest",
      emoji: "🔴",
      title: "Récupération obligatoire",
      description: "Votre fatigue est élevée. Repos ou yoga uniquement.",
      color: "#ef4444",
      maxIntensity: "Repos total ou marche légère",
    };
  }

  if (load.tsb < -10) {
    return {
      type: "easy",
      emoji: "🟡",
      title: "Sortie très facile",
      description: "Fatigue modérée. Maximum 45 min en Zone 1-2.",
      color: "#facc15",
      maxIntensity: "Zone 1-2 uniquement, < 45 min",
    };
  }

  if (load.tsb >= -10 && load.tsb <= 5) {
    return {
      type: "hard",
      emoji: "🟢",
      title: "Séance de qualité possible",
      description: "Bonne forme. Idéal pour un fractionné ou un tempo.",
      color: "#1DB954",
      maxIntensity: "Zone 3-4, fractionné ou tempo",
    };
  }

  if (load.tsb > 5 && load.tsb <= 25) {
    return {
      type: "moderate",
      emoji: "🟢",
      title: "Sortie longue idéale",
      description: "Bien reposé. Parfait pour une sortie longue endurance.",
      color: "#1DB954",
      maxIntensity: "Zone 2-3, sortie longue",
    };
  }

  return {
    type: "race_ready",
    emoji: "⚡",
    title: "Forme de compétition",
    description: "Vous êtes frais et en forme. Idéal pour une course ou un test.",
    color: "#1DB954",
    maxIntensity: "Toutes intensités",
  };
}
