export type ForumCategoryId = "objectifs" | "nutrition" | "equipment" | "preparation-course";

export type ForumThreadSeed = {
  id: string;
  title: string;
  excerpt: string;
  categoryId: ForumCategoryId;
  tags: string[];
  replies: number;
  lastActivity: string;
};

export type ForumCategorySeed = {
  id: ForumCategoryId;
  title: string;
  description: string;
  threadCount: number;
  topics: string[];
};

export const forumCategories: ForumCategorySeed[] = [
  {
    id: "objectifs",
    title: "Objectifs",
    description: "Préparer un chrono, choisir une distance cible et structurer sa progression.",
    threadCount: 18,
    topics: ["5 km / 10 km", "Semi / marathon", "Reprise et progression"],
  },
  {
    id: "nutrition",
    title: "Nutrition",
    description: "Hydratation, gels, petit-déjeuner de course et récupération après l'effort.",
    threadCount: 14,
    topics: ["Avant la séance", "Pendant l'effort", "Récupération"],
  },
  {
    id: "equipment",
    title: "Equipment",
    description: "Chaussures, cardio, montres GPS, textile et choix du matériel adapté.",
    threadCount: 22,
    topics: ["Chaussures route", "Capteurs et montres", "Équipement selon la météo"],
  },
  {
    id: "preparation-course",
    title: "Préparation course",
    description: "Planification, affûtage, stratégie d'allure et logistique de jour J.",
    threadCount: 16,
    topics: ["Plan d'entraînement", "Affûtage", "Stratégie de course"],
  },
];

export const forumThreadSeeds: ForumThreadSeed[] = [
  {
    id: "sub45-10k",
    title: "Comment construire un objectif 10 km en moins de 45 minutes ?",
    excerpt: "Volume hebdo, séance seuil, allure cible et répartition des semaines pour progresser sans se cramer.",
    categoryId: "objectifs",
    tags: ["10 km", "chrono", "plan"],
    replies: 12,
    lastActivity: "Il y a 2 h",
  },
  {
    id: "first-half-marathon",
    title: "Premier semi : viser la régularité ou terminer avec du jus ?",
    excerpt: "Discussion sur la stratégie d'allure, le pacing et la gestion mentale pour un premier semi-marathon.",
    categoryId: "objectifs",
    tags: ["semi", "débutant", "pacing"],
    replies: 8,
    lastActivity: "Aujourd'hui",
  },
  {
    id: "gels-for-race-day",
    title: "Quels gels et quelle hydratation pour une sortie longue ou un semi ?",
    excerpt: "Retours d'expérience sur les apports glucidiques, le timing et ce qui passe vraiment bien à l'estomac.",
    categoryId: "nutrition",
    tags: ["gels", "hydratation", "sortie longue"],
    replies: 15,
    lastActivity: "Il y a 5 h",
  },
  {
    id: "breakfast-before-race",
    title: "Petit-déjeuner avant une course : simple, digeste et efficace ?",
    excerpt: "Idées de routines nutritionnelles avant une course matinale, selon distance et heure de départ.",
    categoryId: "nutrition",
    tags: ["avant-course", "routine", "digestion"],
    replies: 6,
    lastActivity: "Hier",
  },
  {
    id: "daily-trainer-choice",
    title: "Une seule paire pour tout faire ou rotation de chaussures ?",
    excerpt: "Comparaison entre chaussure polyvalente, paire d'entraînement, paire spécifique et carbone.",
    categoryId: "equipment",
    tags: ["chaussures", "rotation", "entraînement"],
    replies: 21,
    lastActivity: "Il y a 1 h",
  },
  {
    id: "hr-strap-vs-watch",
    title: "Ceinture cardio ou montre au poignet pour les séances qualitatives ?",
    excerpt: "Fiabilité des données, confort et intérêt réel selon le type de séance et le niveau du coureur.",
    categoryId: "equipment",
    tags: ["cardio", "montre", "capteur"],
    replies: 9,
    lastActivity: "Aujourd'hui",
  },
  {
    id: "taper-week-checklist",
    title: "Que faire la dernière semaine avant une course objectif ?",
    excerpt: "Réduction du volume, sommeil, alimentation, stress et derniers rappels d'allure.",
    categoryId: "preparation-course",
    tags: ["affûtage", "objectif", "course"],
    replies: 11,
    lastActivity: "Il y a 3 h",
  },
  {
    id: "marathon-pacing-plan",
    title: "Comment définir une stratégie d'allure réaliste sur marathon ?",
    excerpt: "Repères par segments, gestion du départ, ravitaillements et adaptation si les sensations changent.",
    categoryId: "preparation-course",
    tags: ["marathon", "allure", "stratégie"],
    replies: 17,
    lastActivity: "Hier",
  },
];
