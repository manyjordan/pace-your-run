import {
  Apple,
  Flag,
  Footprints,
  Lightbulb,
  MapPin,
  MessageCircle,
  Target,
  type LucideIcon,
} from "lucide-react";

export type ForumCategoryDefinition = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  topics: string[];
};

export const FORUM_CATEGORIES: Record<string, ForumCategoryDefinition> = {
  objectifs: {
    id: "objectifs",
    label: "Objectifs",
    description: "Plans, progression, rythme d'entraînement et préparation d'objectifs.",
    icon: Target,
    accent: "bg-accent/10 text-accent",
    topics: ["5 km / 10 km", "Semi / marathon", "Reprise et progression"],
  },
  nutrition: {
    id: "nutrition",
    label: "Nutrition",
    description: "Hydratation, alimentation et récupération autour de l'effort.",
    icon: Apple,
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    topics: ["Avant la séance", "Pendant l'effort", "Récupération"],
  },
  equipment: {
    id: "equipment",
    label: "Équipement",
    description: "Chaussures, capteurs, montres et matériel utile.",
    icon: Footprints,
    accent: "bg-accent/10 text-accent",
    topics: ["Chaussures route", "Capteurs et montres", "Équipement selon la météo"],
  },
  "preparation-course": {
    id: "preparation-course",
    label: "Préparation course",
    description: "Affûtage, stratégie et organisation avant la compétition.",
    icon: Flag,
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    topics: ["Plan d'entraînement", "Affûtage", "Stratégie de course"],
  },
  suggestions: {
    id: "suggestions",
    label: "Suggestions",
    description: "Partagez vos idées d'amélioration pour l'application.",
    icon: Lightbulb,
    accent: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    topics: ["Nouvelles fonctionnalités", "Améliorations existantes", "Bugs rencontrés"],
  },
  organiser: {
    id: "organiser",
    label: "Organiser des runs",
    description: "Trouvez des partenaires et proposez des sorties groupées.",
    icon: MapPin,
    accent: "bg-orange-500/10 text-orange-500 dark:text-orange-400",
    topics: ["Run débutants", "Run intermédiaires", "Trail", "Soirée running"],
  },
  autres: {
    id: "autres",
    label: "Autres",
    description: "Discussions générales autour du running.",
    icon: MessageCircle,
    accent: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    topics: ["Général", "Présentations", "Hors-sujet"],
  },
};
