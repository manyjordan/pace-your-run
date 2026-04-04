export type Intensity = "easy" | "moderate" | "tempo" | "interval" | "race";

export type Session = {
  day: string;
  type: string;
  distance: number;
  pace: string;
  duration: number;
  description: string;
  intensity: Intensity;
};

export type Week = {
  week: number;
  sessions: Session[];
  totalDistance: number;
  focus: string;
};

export type TrainingPlan = {
  id: string;
  name: string;
  goal: "weight" | "distance" | "race";
  targetDistance?: "5k" | "10k" | "20k" | "semi" | "marathon";
  level: "beginner" | "intermediate" | "advanced";
  daysPerWeek: 2 | 3 | 4 | 5;
  durationWeeks: 4 | 8 | 12 | 16;
  summary: string;
  weeklySchedule: Week[];
  equipmentTips: string[];
  nutritionTips: string[];
  shoeTips: string[];
};

// Helper to calculate pace to minutes
function paceToMinutes(pace: string): number {
  const [m, s] = pace.split(":").map(Number);
  return m + s / 60;
}

// Helper to calculate duration in minutes
function calculateDuration(distance: number, pace: string): number {
  return Math.round(distance * paceToMinutes(pace));
}

// Generate weeks with progressive overload
function generateWeeklyTemplate(
  baseDistance: number,
  basePace: string,
  daysPerWeek: 2 | 3 | 4 | 5,
  weekNumber: number,
  totalWeeks: number
): Session[] {
  const sessions: Session[] = [];
  
  // Alternate between easy, moderate, and tempo days
  const intensities: Array<{ type: string; intensity: Intensity; pace: string; multiplier: number }> = [];
  
  if (daysPerWeek === 2) {
    intensities.push(
      { type: "Sortie facile", intensity: "easy", pace: basePace, multiplier: 1 },
      { type: "Sortie facile", intensity: "easy", pace: basePace, multiplier: 1 }
    );
  } else if (daysPerWeek === 3) {
    intensities.push(
      { type: "Sortie facile", intensity: "easy", pace: basePace, multiplier: 1 },
      { type: "Sortie tempo", intensity: "tempo", pace: minusSeconds(basePace, 30), multiplier: 0.7 },
      { type: "Sortie facile", intensity: "easy", pace: basePace, multiplier: 1 }
    );
  } else if (daysPerWeek === 4) {
    intensities.push(
      { type: "Sortie facile", intensity: "easy", pace: basePace, multiplier: 1 },
      { type: "Sortie tempo", intensity: "tempo", pace: minusSeconds(basePace, 30), multiplier: 0.75 },
      { type: "Récupération active", intensity: "easy", pace: addSeconds(basePace, 20), multiplier: 0.8 },
      { type: "Sortie longue", intensity: "easy", pace: addSeconds(basePace, 10), multiplier: 1.3 }
    );
  } else {
    // 5 days
    intensities.push(
      { type: "Sortie facile", intensity: "easy", pace: basePace, multiplier: 1 },
      { type: "Intervalles courts", intensity: "interval", pace: minusSeconds(basePace, 60), multiplier: 0.8 },
      { type: "Récupération active", intensity: "easy", pace: addSeconds(basePace, 20), multiplier: 0.7 },
      { type: "Sortie tempo", intensity: "tempo", pace: minusSeconds(basePace, 30), multiplier: 0.85 },
      { type: "Sortie longue", intensity: "easy", pace: addSeconds(basePace, 10), multiplier: 1.4 }
    );
  }
  
  // Calculate volume progression with recovery weeks every 4 weeks
  let volumeMultiplier = 1;
  const progressionWeek = ((weekNumber - 1) % 4) + 1;
  
  if (progressionWeek === 1) volumeMultiplier = 0.95;
  else if (progressionWeek === 2) volumeMultiplier = 1.05;
  else if (progressionWeek === 3) volumeMultiplier = 1.08;
  else if (progressionWeek === 4) volumeMultiplier = 0.8; // Recovery week
  
  // Taper for last 2 weeks
  if (weekNumber > totalWeeks - 2) {
    volumeMultiplier *= (0.65 + (weekNumber - (totalWeeks - 2)) * 0.2);
  }
  
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  
  intensities.forEach((config, idx) => {
    sessions.push({
      day: days[idx % 7],
      type: config.type,
      distance: Math.round(baseDistance * config.multiplier * volumeMultiplier * 10) / 10,
      pace: config.pace,
      duration: calculateDuration(Math.round(baseDistance * config.multiplier * volumeMultiplier * 10) / 10, config.pace),
      description: `${config.type} - Semaine ${weekNumber}`,
      intensity: config.intensity,
    });
  });
  
  return sessions;
}

// Utility to modify pace
function minusSeconds(pace: string, seconds: number): string {
  const [m, s] = pace.split(":").map(Number);
  let totalSeconds = m * 60 + s - seconds;
  if (totalSeconds < 0) totalSeconds = 0;
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function addSeconds(pace: string, seconds: number): string {
  const [m, s] = pace.split(":").map(Number);
  const totalSeconds = m * 60 + s + seconds;
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

// Generate complete schedule for a plan
function generateSchedule(
  baseDistance: number,
  basePace: string,
  daysPerWeek: 2 | 3 | 4 | 5,
  durationWeeks: 4 | 8 | 12 | 16
): Week[] {
  const schedule: Week[] = [];
  
  for (let week = 1; week <= durationWeeks; week++) {
    const sessions = generateWeeklyTemplate(baseDistance, basePace, daysPerWeek, week, durationWeeks);
    const totalDistance = Math.round(sessions.reduce((sum, s) => sum + s.distance, 0) * 10) / 10;
    
    let focus = "Progression régulière";
    const progressionWeek = ((week - 1) % 4) + 1;
    
    if (progressionWeek === 4) focus = "Semaine de récupération - Volume réduit de 20%";
    else if (week > durationWeeks - 2) focus = "Phase d'affûtage - Réduire le volume et garder la vitesse";
    else if (progressionWeek === 1) focus = "Début d'un nouveau cycle de 4 semaines";
    
    schedule.push({
      week,
      sessions,
      totalDistance,
      focus,
    });
  }
  
  return schedule;
}

// ========== WEIGHT LOSS PLANS ==========

const createWeightPlan = (
  id: string,
  name: string,
  daysPerWeek: 2 | 3 | 4 | 5,
  durationWeeks: 4 | 8 | 12 | 16
): TrainingPlan => ({
  id,
  name,
  goal: "weight",
  level: id.includes("beginner") ? "beginner" : id.includes("intermediate") ? "intermediate" : "advanced",
  daysPerWeek,
  durationWeeks,
  summary: `Plan de perte de poids adaptée avec ${daysPerWeek} séances par semaine sur ${durationWeeks} semaines`,
  equipmentTips: [
    "Chaussures de running confortables et bien amorties",
    "Vêtements respirants et adaptés à la saison",
    "Montre ou appli pour tracker le temps",
    "Ceinture cardiaque (optionnel, pour monitorer l'intensité)"
  ],
  nutritionTips: [
    "Hydratez-vous régulièrement : 500ml par heure de course",
    "Mangez équilibré : protéines, glucides complexes et lipides",
    "Prenez un petit-déjeuner 2h avant la course",
    "Évitez les excès caloriques après l'effort",
    "Consultez un diététicien pour un plan personnalisé"
  ],
  shoeTips: [
    "Chaussures neutres recommandées pour débuter",
    "Remplacez vos chaussures tous les 800-1000 km",
    "Préférez les chaussures légères pour les sorties tempo",
    "Testez vos chaussures avant une longue sortie"
  ],
  weeklySchedule: generateSchedule(
    daysPerWeek === 2 ? 4 : daysPerWeek === 3 ? 4.5 : daysPerWeek === 4 ? 5 : 5.5,
    "6:15/km",
    daysPerWeek,
    durationWeeks
  ),
});

// ========== DISTANCE PLANS (5K) ==========

const createDistancePlan5k = (
  id: string,
  name: string,
  level: "beginner" | "intermediate" | "advanced",
  daysPerWeek: 2 | 3 | 4 | 5,
  durationWeeks: 4 | 8 | 12 | 16
): TrainingPlan => ({
  id,
  name,
  goal: "distance",
  targetDistance: "5k",
  level,
  daysPerWeek,
  durationWeeks,
  summary: `Plan progressif vers 5km avec ${daysPerWeek} séances par semaine sur ${durationWeeks} semaines`,
  equipmentTips: [
    "Chaussures de running confortables et légères",
    "Vêtements adaptés à la saison",
    "Montre pour tracker les distances",
    "Lampadaire ou éclairage pour les sorties crépusculaires"
  ],
  nutritionTips: [
    "Hydratez-vous bien avant et après",
    "Privilégiez les glucides 3h avant la course",
    "Récupérez avec des protéines dans l'heure suivant l'effort",
    "Évitez l'alcool 24h après une séance intense"
  ],
  shoeTips: [
    "Chaussures neutres ou légèrement supportive selon votre type de pied",
    "Vérifiez l'usure régulièrement",
    "Gardez une paire de chaussures pour les sorties faciles et une pour les intensités"
  ],
  weeklySchedule: generateSchedule(
    level === "beginner" ? (daysPerWeek === 2 ? 3 : 3.5) : level === "intermediate" ? (daysPerWeek === 3 ? 4 : 4.5) : 5,
    level === "beginner" ? "6:30/km" : level === "intermediate" ? "5:45/km" : "5:00/km",
    daysPerWeek,
    durationWeeks
  ),
});

// ========== DISTANCE PLANS (10K) ==========

const createDistancePlan10k = (
  id: string,
  name: string,
  level: "beginner" | "intermediate" | "advanced",
  daysPerWeek: 2 | 3 | 4 | 5,
  durationWeeks: 4 | 8 | 12 | 16
): TrainingPlan => ({
  id,
  name,
  goal: "distance",
  targetDistance: "10k",
  level,
  daysPerWeek,
  durationWeeks,
  summary: `Plan progressif vers 10km avec ${daysPerWeek} séances par semaine sur ${durationWeeks} semaines`,
  equipmentTips: [
    "Chaussures de running confortables",
    "Ceinture ou sac de transport pour l'hydratation",
    "Vêtements respirants et anti-transpirants",
    "Montre GPS pour tracker les distances"
  ],
  nutritionTips: [
    "Hydratez-vous toutes les 20 minutes pendant les sorties > 1h",
    "Consommez des glucides simples (banana, gel) si sortie > 1h",
    "Récupérez avec un repas équilibré dans les 2h",
    "Mangez suffisamment de fibres pour la récupération musculaire"
  ],
  shoeTips: [
    "Chaussures spécifiques pour votre type de foulée",
    "Utilisez des semelles adaptées si besoin",
    "Testez vos chaussures en conditions réelles avant les longues sorties"
  ],
  weeklySchedule: generateSchedule(
    level === "beginner" ? (daysPerWeek === 3 ? 5 : 5.5) : level === "intermediate" ? 6.5 : 7.5,
    level === "beginner" ? "6:00/km" : level === "intermediate" ? "5:15/km" : "4:30/km",
    daysPerWeek,
    durationWeeks
  ),
});

// ========== DISTANCE PLANS (20K) ==========

const createDistancePlan20k = (
  id: string,
  name: string,
  level: "beginner" | "intermediate" | "advanced",
  daysPerWeek: 2 | 3 | 4 | 5,
  durationWeeks: 4 | 8 | 12 | 16
): TrainingPlan => ({
  id,
  name,
  goal: "distance",
  targetDistance: "20k",
  level,
  daysPerWeek,
  durationWeeks,
  summary: `Plan progressif vers 20km avec ${daysPerWeek} séances par semaine sur ${durationWeeks} semaines`,
  equipmentTips: [
    "Chaussures robustes et bien amorties",
    "Sac d'hydratation (minimum 1-1.5L pour les longues sorties)",
    "Vêtements anti-transpirants et anti-frottements",
    "Montre GPS fiable"
  ],
  nutritionTips: [
    "Hydratez-vous toutes les 20 minutes avec électrolytes",
    "Consommez 30-60g de glucides/heure pendant les sorties > 1h30",
    "Prenez des barres énergétiques ou gels",
    "Récupérez avec protéines et glucides dans l'heure",
    "Dormez suffisamment pour la récupération (8-9h)"
  ],
  shoeTips: [
    "Chaussures ultra confortables et très bien amorties",
    "Privilégiez la stabilité et le confort pour les longues distances",
    "Deux paires de chaussures minimum (alternative si usure)"
  ],
  weeklySchedule: generateSchedule(
    level === "beginner" ? 8 : level === "intermediate" ? 9.5 : 11,
    level === "beginner" ? "5:45/km" : level === "intermediate" ? "4:45/km" : "4:15/km",
    daysPerWeek,
    durationWeeks
  ),
});

// ========== RACE PLANS (SEMI-MARATHON) ==========

const createRacePlanSemi = (
  id: string,
  name: string,
  level: "beginner" | "intermediate" | "advanced",
  daysPerWeek: 2 | 3 | 4 | 5,
  durationWeeks: 4 | 8 | 12 | 16
): TrainingPlan => ({
  id,
  name,
  goal: "race",
  targetDistance: "semi",
  level,
  daysPerWeek,
  durationWeeks,
  summary: `Préparation semi-marathon avec ${daysPerWeek} séances par semaine sur ${durationWeeks} semaines`,
  equipmentTips: [
    "Chaussures de compétition testées en conditions réelles",
    "Vêtements de compétition confortables",
    "Dossard et puce de chronométrage",
    "Montre GPS pour pacer la course"
  ],
  nutritionTips: [
    "Prenez un petit-déjeuner 2-3h avant la course",
    "Hydratez-vous 500ml avant le départ",
    "Consommez des glucides simplement digestibles",
    "Évitez les aliments trop fibreux la veille",
    "Reposez-vous bien la nuit avant la compétition"
  ],
  shoeTips: [
    "Portez vos chaussures de compétition plusieurs fois avant la course",
    "Préférez les chaussures légères pour la performance",
    "Testez l'adhérence sur le circuit officiel si possible"
  ],
  weeklySchedule: generateSchedule(
    level === "beginner" ? 7.5 : level === "intermediate" ? 9 : 10.5,
    level === "beginner" ? "5:30/km" : level === "intermediate" ? "4:30/km" : "3:45/km",
    daysPerWeek,
    durationWeeks
  ),
});

// ========== RACE PLANS (MARATHON) ==========

const createRacePlanMarathon = (
  id: string,
  name: string,
  level: "beginner" | "intermediate" | "advanced",
  daysPerWeek: 2 | 3 | 4 | 5,
  durationWeeks: 4 | 8 | 12 | 16
): TrainingPlan => ({
  id,
  name,
  goal: "race",
  targetDistance: "marathon",
  level,
  daysPerWeek,
  durationWeeks,
  summary: `Préparation marathon avec ${daysPerWeek} séances par semaine sur ${durationWeeks} semaines`,
  equipmentTips: [
    "Chaussures de marathon testées sur des dizaines de km",
    "Vêtements anti-frottements (appliquer Vaseline)",
    "Gel ou barres énergétiques personnels",
    "Dossard et puce de chronométrage",
    "Montre GPS fiable"
  ],
  nutritionTips: [
    "Passez 3 jours avant à une diète à base de glucides",
    "Hydratez-vous régulièrement toutes les 20 minutes",
    "Consommez 200-300 calories/heure (gels, barres, eau)",
    "Pratiquez votre stratégie nutritionnelle en entraînement",
    "Évitez l'alcool et les repas lourds les 2 jours avant"
  ],
  shoeTips: [
    "Portez vos chaussures au moins 30km avant le marathon",
    "Privilégiez le confort extrême (amortissement maximum)",
    "Changez de chaussures toutes les 500km si besoin"
  ],
  weeklySchedule: generateSchedule(
    level === "beginner" ? 10 : level === "intermediate" ? 12 : 14,
    level === "beginner" ? "5:15/km" : level === "intermediate" ? "4:15/km" : "3:45/km",
    daysPerWeek,
    durationWeeks
  ),
});

// ========== BUILD ALL PLANS ==========

export const TRAINING_PLANS: TrainingPlan[] = [
  {
    id: "weight_beginner_3days_8weeks",
    name: "Perte de poids — Débutant (3 j, 8 sem.)",
    goal: "weight",
    level: "beginner",
    daysPerWeek: 3,
    durationWeeks: 8,
    summary: "Ce bloc privilégie des sorties faciles et un tempo court pour brûler des calories sans saturer le système nerveux. Des semaines de relâchement et un affûtage final sécurisent la régularité.",
    equipmentTips: ["Lampe frontale légère pour les sorties du soir après le travail.","Ceinture minimaliste ou gilet pour téléphone et clés.","Bouteille souple 500 ml pour les sorties longues du week-end."],
    nutritionTips: ["Après chaque séance, associez protéines et glucides dans l’heure.","Réduisez les grignotages liquides (sodas) en semaine pour voir l’effet sur la forme.","Buvez un grand verre d’eau au réveil les jours de course."],
    shoeTips: ["Chaussure amortie neutre pour les sorties longues dominicales.","Alternez deux modèles si vous courez 3 fois par semaine régulièrement."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.7, pace: "7:00/km", duration: 40, description: "Endurance douce, semaine 1 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 4.3, pace: "6:15/km", duration: 27, description: "Bloc continu modéré, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.7, pace: "7:30/km", duration: 43, description: "Volume dominical calme, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 15.7,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "7:00/km", duration: 44, description: "Endurance douce, semaine 2 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 4.7, pace: "6:15/km", duration: 29, description: "Bloc continu modéré, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.3, pace: "7:30/km", duration: 47, description: "Volume dominical calme, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 17.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7, pace: "7:00/km", duration: 49, description: "Endurance douce, semaine 3 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 5.2, pace: "6:15/km", duration: 33, description: "Bloc continu modéré, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7, pace: "7:30/km", duration: 53, description: "Volume dominical calme, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 19.2,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.6, pace: "7:00/km", duration: 39, description: "Endurance douce, semaine 4 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 4.2, pace: "6:15/km", duration: 26, description: "Bloc continu modéré, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.6, pace: "7:30/km", duration: 42, description: "Volume dominical calme, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 15.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.3, pace: "7:00/km", duration: 51, description: "Endurance douce, semaine 5 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 5.5, pace: "6:15/km", duration: 34, description: "Bloc continu modéré, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.3, pace: "7:30/km", duration: 55, description: "Volume dominical calme, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 20.1,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.9, pace: "7:00/km", duration: 55, description: "Endurance douce, semaine 6 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 5.9, pace: "6:15/km", duration: 37, description: "Bloc continu modéré, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.9, pace: "7:30/km", duration: 59, description: "Volume dominical calme, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 21.7,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.6, pace: "7:00/km", duration: 39, description: "Endurance douce, semaine 7 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 4.2, pace: "6:15/km", duration: 26, description: "Bloc continu modéré, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.6, pace: "7:30/km", duration: 42, description: "Volume dominical calme, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 15.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 4.8, pace: "7:00/km", duration: 34, description: "Endurance douce, semaine 8 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 3.6, pace: "6:15/km", duration: 23, description: "Bloc continu modéré, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 4.8, pace: "7:30/km", duration: 36, description: "Volume dominical calme, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 13.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "weight_intermediate_4days_12weeks",
    name: "Perte de poids — Intermédiaire (4 j, 12 sem.)",
    goal: "weight",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 12,
    summary: "Quatre sorties hebdo alternent endurance, seuil léger et longue du dimanche pour maximiser la dépense tout en gérant la fatigue. La structure en microcycles évite les semaines plates ou excessives.",
    equipmentTips: ["Montre simple avec chronomètre pour cadencer les blocs au seuil.","Textile technique même par temps frais pour éviter la surchauffe.","Tapis de gainage 10′ après deux séances pour le core."],
    nutritionTips: ["Repas du midi riche en légumes et protéines maigres les jours de seuil.","Évitez l’alcool la veille de la sortie longue du dimanche.","Collation banane + eau 90′ avant la séance du mercredi."],
    shoeTips: ["Modèle polyvalent légèrement plus ferme pour le tempo du mercredi.","Changez de semelle intérieure tous les 6 mois si usage quotidien."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.8, pace: "5:45/km", duration: 56, description: "Sortie relâchée, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 6.6, pace: "5:00/km", duration: 33, description: "2×10′ tempo avec 2′ récup, semaine 1.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 6.6, pace: "6:00/km", duration: 40, description: "Très facile au lendemain du seuil, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.8, pace: "6:15/km", duration: 61, description: "Volume stable, respiration nasale possible, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 32.8,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.7, pace: "5:45/km", duration: 62, description: "Sortie relâchée, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 7.1, pace: "5:00/km", duration: 36, description: "2×10′ tempo avec 2′ récup, semaine 2.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.1, pace: "6:00/km", duration: 43, description: "Très facile au lendemain du seuil, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.7, pace: "6:15/km", duration: 67, description: "Volume stable, respiration nasale possible, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 35.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.4, pace: "5:45/km", duration: 66, description: "Sortie relâchée, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 7.6, pace: "5:00/km", duration: 38, description: "2×10′ tempo avec 2′ récup, semaine 3.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.6, pace: "6:00/km", duration: 46, description: "Très facile au lendemain du seuil, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.4, pace: "6:15/km", duration: 71, description: "Volume stable, respiration nasale possible, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 38,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.3, pace: "5:45/km", duration: 53, description: "Sortie relâchée, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 6.2, pace: "5:00/km", duration: 31, description: "2×10′ tempo avec 2′ récup, semaine 4.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 6.2, pace: "6:00/km", duration: 37, description: "Très facile au lendemain du seuil, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.3, pace: "6:15/km", duration: 58, description: "Volume stable, respiration nasale possible, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 31,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.9, pace: "5:45/km", duration: 51, description: "Sortie relâchée, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.9, pace: "5:00/km", duration: 30, description: "2×10′ tempo avec 2′ récup, semaine 5.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.9, pace: "6:00/km", duration: 35, description: "Très facile au lendemain du seuil, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.9, pace: "6:15/km", duration: 56, description: "Volume stable, respiration nasale possible, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 29.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.6, pace: "5:45/km", duration: 55, description: "Sortie relâchée, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 6.4, pace: "5:00/km", duration: 32, description: "2×10′ tempo avec 2′ récup, semaine 6.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 6.4, pace: "6:00/km", duration: 38, description: "Très facile au lendemain du seuil, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.6, pace: "6:15/km", duration: 60, description: "Volume stable, respiration nasale possible, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 32,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.3, pace: "5:45/km", duration: 59, description: "Sortie relâchée, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 6.8, pace: "5:00/km", duration: 34, description: "2×10′ tempo avec 2′ récup, semaine 7.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 6.8, pace: "6:00/km", duration: 41, description: "Très facile au lendemain du seuil, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.3, pace: "6:15/km", duration: 64, description: "Volume stable, respiration nasale possible, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 34.2,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.4, pace: "5:45/km", duration: 48, description: "Sortie relâchée, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.6, pace: "5:00/km", duration: 28, description: "2×10′ tempo avec 2′ récup, semaine 8.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.6, pace: "6:00/km", duration: 34, description: "Très facile au lendemain du seuil, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "6:15/km", duration: 53, description: "Volume stable, respiration nasale possible, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 28,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8, pace: "5:45/km", duration: 46, description: "Sortie relâchée, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.3, pace: "5:00/km", duration: 27, description: "2×10′ tempo avec 2′ récup, semaine 9.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.3, pace: "6:00/km", duration: 32, description: "Très facile au lendemain du seuil, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8, pace: "6:15/km", duration: 50, description: "Volume stable, respiration nasale possible, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 26.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.6, pace: "5:45/km", duration: 49, description: "Sortie relâchée, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.8, pace: "5:00/km", duration: 29, description: "2×10′ tempo avec 2′ récup, semaine 10.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.8, pace: "6:00/km", duration: 35, description: "Très facile au lendemain du seuil, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.6, pace: "6:15/km", duration: 54, description: "Volume stable, respiration nasale possible, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 28.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8, pace: "5:45/km", duration: 46, description: "Sortie relâchée, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.3, pace: "5:00/km", duration: 27, description: "2×10′ tempo avec 2′ récup, semaine 11.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.3, pace: "6:00/km", duration: 32, description: "Très facile au lendemain du seuil, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8, pace: "6:15/km", duration: 50, description: "Volume stable, respiration nasale possible, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 26.6,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.8, pace: "5:45/km", duration: 39, description: "Sortie relâchée, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 4.6, pace: "5:00/km", duration: 23, description: "2×10′ tempo avec 2′ récup, semaine 12.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 4.6, pace: "6:00/km", duration: 28, description: "Très facile au lendemain du seuil, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.8, pace: "6:15/km", duration: 43, description: "Volume stable, respiration nasale possible, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 22.8,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_5k_beginner_3days_8weeks",
    name: "5 km — Débutant (3 j, 8 sem.)",
    goal: "distance",
    targetDistance: "5k",
    level: "beginner",
    daysPerWeek: 3,
    durationWeeks: 8,
    summary: "Les intervalles courts restent courts et la longue du dimanche reste très confortable pour apprendre à tenir un rythme. Le volume monte par paliers puis se déleste pour arriver frais sur un 5 km test.",
    equipmentTips: ["Piste d’athlétisme ou segment plat mesuré pour les 400 m du jeudi.","Chronomètre ou appli avec répétition d’intervalles.","Vêtement visible pour les sorties en soirée."],
    nutritionTips: ["Dîner digeste la veille du jeudi (pâtes + légumes, peu de graisse).","Eau pendant la journée, pas seulement au moment de courir.","Petit-déjeuner léger 2 h avant le test final si matinal."],
    shoeTips: ["Chaussure souple pour les répétitions, amortie pour le dimanche.","Évitez une paire toute neuve la semaine du test."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.2, pace: "7:00/km", duration: 36, description: "Base aérobie, semaine 1.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 5.2, pace: "6:15/km", duration: 33, description: "8×400 m récup active, semaine 1.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.9, pace: "7:30/km", duration: 52, description: "Allure très confortable, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 17.3,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.7, pace: "7:00/km", duration: 40, description: "Base aérobie, semaine 2.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 5.7, pace: "6:15/km", duration: 36, description: "8×400 m récup active, semaine 2.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.6, pace: "7:30/km", duration: 57, description: "Allure très confortable, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 19,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "7:00/km", duration: 44, description: "Base aérobie, semaine 3.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 6.3, pace: "6:15/km", duration: 39, description: "8×400 m récup active, semaine 3.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "7:30/km", duration: 63, description: "Allure très confortable, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 21,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5, pace: "7:00/km", duration: 35, description: "Base aérobie, semaine 4.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 5, pace: "6:15/km", duration: 31, description: "8×400 m récup active, semaine 4.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.7, pace: "7:30/km", duration: 50, description: "Allure très confortable, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 16.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.6, pace: "7:00/km", duration: 46, description: "Base aérobie, semaine 5.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 6.6, pace: "6:15/km", duration: 41, description: "8×400 m récup active, semaine 5.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.8, pace: "7:30/km", duration: 66, description: "Allure très confortable, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 22,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.1, pace: "7:00/km", duration: 50, description: "Base aérobie, semaine 6.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 7.1, pace: "6:15/km", duration: 44, description: "8×400 m récup active, semaine 6.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.5, pace: "7:30/km", duration: 71, description: "Allure très confortable, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 23.7,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5, pace: "7:00/km", duration: 35, description: "Base aérobie, semaine 7.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 5, pace: "6:15/km", duration: 31, description: "8×400 m récup active, semaine 7.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.7, pace: "7:30/km", duration: 50, description: "Allure très confortable, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 16.7,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 4.3, pace: "7:00/km", duration: 30, description: "Base aérobie, semaine 8.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 4.3, pace: "6:15/km", duration: 27, description: "8×400 m récup active, semaine 8.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.8, pace: "7:30/km", duration: 44, description: "Allure très confortable, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 14.4,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_5k_intermediate_4days_8weeks",
    name: "5 km — Intermédiaire (4 j, 8 sem.)",
    goal: "distance",
    targetDistance: "5k",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 8,
    summary: "La semaine type place les répétitions au milieu, encadrées par du facile et une longue stable. L’objectif est de rendre le rythme spécifique 5 km familier sans empiler deux séances dures à la suite.",
    equipmentTips: ["GPS fiable pour vérifier la régularité des 400 m.","Rouleaux ou balle pour les mollets après les séances rapides.","Couche technique par temps humide pour le jeudi."],
    nutritionTips: ["Gel ou jus de fruit seulement si la séance du mercredi dépasse 55′.","Repas riche en fer (lentilles, viande maigre) deux fois par semaine.","Café 60′ avant le tempo si habitué, sinon abstenez-vous."],
    shoeTips: ["Modèle réactif bas drop pour les 400 m, autre paire pour l’endurance.","Surveillez l’usure du talon : asymétrie = risque de blessure."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.9, pace: "5:45/km", duration: 40, description: "Technique et foulée, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 4.6, pace: "4:30/km", duration: 21, description: "10×400 m, récup 200 m, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 4.6, pace: "6:00/km", duration: 28, description: "Détente active, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.9, pace: "6:15/km", duration: 43, description: "Inclure 3×3′ modérés au milieu, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 23,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "5:45/km", duration: 44, description: "Technique et foulée, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 5.1, pace: "4:30/km", duration: 23, description: "10×400 m, récup 200 m, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.1, pace: "6:00/km", duration: 31, description: "Détente active, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.6, pace: "6:15/km", duration: 48, description: "Inclure 3×3′ modérés au milieu, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 25.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.4, pace: "5:45/km", duration: 48, description: "Technique et foulée, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 5.6, pace: "4:30/km", duration: 25, description: "10×400 m, récup 200 m, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.6, pace: "6:00/km", duration: 34, description: "Détente active, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "6:15/km", duration: 53, description: "Inclure 3×3′ modérés au milieu, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 28,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.7, pace: "5:45/km", duration: 39, description: "Technique et foulée, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 4.5, pace: "4:30/km", duration: 20, description: "10×400 m, récup 200 m, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 4.5, pace: "6:00/km", duration: 27, description: "Détente active, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.7, pace: "6:15/km", duration: 42, description: "Inclure 3×3′ modérés au milieu, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 22.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.8, pace: "5:45/km", duration: 51, description: "Technique et foulée, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 5.9, pace: "4:30/km", duration: 27, description: "10×400 m, récup 200 m, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.9, pace: "6:00/km", duration: 35, description: "Détente active, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.8, pace: "6:15/km", duration: 55, description: "Inclure 3×3′ modérés au milieu, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 29.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:45/km", duration: 55, description: "Technique et foulée, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 6.3, pace: "4:30/km", duration: 28, description: "10×400 m, récup 200 m, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.3, pace: "6:00/km", duration: 38, description: "Détente active, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.5, pace: "6:15/km", duration: 59, description: "Inclure 3×3′ modérés au milieu, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 31.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.7, pace: "5:45/km", duration: 39, description: "Technique et foulée, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 4.5, pace: "4:30/km", duration: 20, description: "10×400 m, récup 200 m, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 4.5, pace: "6:00/km", duration: 27, description: "Détente active, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.7, pace: "6:15/km", duration: 42, description: "Inclure 3×3′ modérés au milieu, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 22.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.8, pace: "5:45/km", duration: 33, description: "Technique et foulée, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 3.8, pace: "4:30/km", duration: 17, description: "10×400 m, récup 200 m, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 3.8, pace: "6:00/km", duration: 23, description: "Détente active, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.8, pace: "6:15/km", duration: 36, description: "Inclure 3×3′ modérés au milieu, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 19.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_10k_beginner_3days_12weeks",
    name: "10 km — Débutant (3 j, 12 sem.)",
    goal: "distance",
    targetDistance: "10k",
    level: "beginner",
    daysPerWeek: 3,
    durationWeeks: 12,
    summary: "Trois sorties suffisent si elles sont bien typées : facile, tempo court, longue du week-end. Sur trois mois vous consoliderez l’endurance de fond avant de réduire le volume pour viser un 10 km solide.",
    equipmentTips: ["Sac banane pour emporter une petite bouteille sur la longue > 75′.","Crème anti-frottements pour les sorties humides.","Journal d’entraînement papier ou appli pour noter les sensations."],
    nutritionTips: ["Testez votre petit-déjeuner type compétition une fois sur la longue du dimanche.","Hydratez-vous toutes les 25′ quand la séance dépasse 70′.","Dîner glucides modérés la veille du jeudi tempo."],
    shoeTips: ["Chaussure avec bon déroulé pour les temps au seuil bas.","Remplacez avant 800 km si la semelle est lisse sur le bitume."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.8, pace: "7:00/km", duration: 55, description: "Jambes légères, semaine 1.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 7.8, pace: "6:15/km", duration: 49, description: "20–25′ au seuil bas, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "7:30/km", duration: 78, description: "Progression douce sur la 2e moitié si bon feeling, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 26,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.4, pace: "7:00/km", duration: 59, description: "Jambes légères, semaine 2.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 8.4, pace: "6:15/km", duration: 53, description: "20–25′ au seuil bas, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.2, pace: "7:30/km", duration: 84, description: "Progression douce sur la 2e moitié si bon feeling, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 28,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9, pace: "7:00/km", duration: 63, description: "Jambes légères, semaine 3.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 9, pace: "6:15/km", duration: 56, description: "20–25′ au seuil bas, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12, pace: "7:30/km", duration: 90, description: "Progression douce sur la 2e moitié si bon feeling, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 30,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.4, pace: "7:00/km", duration: 52, description: "Jambes légères, semaine 4.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 7.4, pace: "6:15/km", duration: 46, description: "20–25′ au seuil bas, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.8, pace: "7:30/km", duration: 74, description: "Progression douce sur la 2e moitié si bon feeling, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 24.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.1, pace: "7:00/km", duration: 50, description: "Jambes légères, semaine 5.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 7.1, pace: "6:15/km", duration: 44, description: "20–25′ au seuil bas, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.4, pace: "7:30/km", duration: 71, description: "Progression douce sur la 2e moitié si bon feeling, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 23.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "7:00/km", duration: 53, description: "Jambes légères, semaine 6.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 7.6, pace: "6:15/km", duration: 48, description: "20–25′ au seuil bas, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.1, pace: "7:30/km", duration: 76, description: "Progression douce sur la 2e moitié si bon feeling, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 25.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.1, pace: "7:00/km", duration: 57, description: "Jambes légères, semaine 7.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 8.1, pace: "6:15/km", duration: 51, description: "20–25′ au seuil bas, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.8, pace: "7:30/km", duration: 81, description: "Progression douce sur la 2e moitié si bon feeling, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 27,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.6, pace: "7:00/km", duration: 46, description: "Jambes légères, semaine 8.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 6.6, pace: "6:15/km", duration: 41, description: "20–25′ au seuil bas, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.8, pace: "7:30/km", duration: 66, description: "Progression douce sur la 2e moitié si bon feeling, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 22,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "7:00/km", duration: 44, description: "Jambes légères, semaine 9.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 6.3, pace: "6:15/km", duration: 39, description: "20–25′ au seuil bas, semaine 9.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "7:30/km", duration: 63, description: "Progression douce sur la 2e moitié si bon feeling, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 21,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.8, pace: "7:00/km", duration: 48, description: "Jambes légères, semaine 10.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 6.8, pace: "6:15/km", duration: 43, description: "20–25′ au seuil bas, semaine 10.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.1, pace: "7:30/km", duration: 68, description: "Progression douce sur la 2e moitié si bon feeling, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 22.7,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "7:00/km", duration: 44, description: "Jambes légères, semaine 11.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 6.3, pace: "6:15/km", duration: 39, description: "20–25′ au seuil bas, semaine 11.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "7:30/km", duration: 63, description: "Progression douce sur la 2e moitié si bon feeling, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 21,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.4, pace: "7:00/km", duration: 38, description: "Jambes légères, semaine 12.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 5.4, pace: "6:15/km", duration: 34, description: "20–25′ au seuil bas, semaine 12.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.2, pace: "7:30/km", duration: 54, description: "Progression douce sur la 2e moitié si bon feeling, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 18,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_10k_intermediate_4days_12weeks",
    name: "10 km — Intermédiaire (4 j, 12 sem.)",
    goal: "distance",
    targetDistance: "10k",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 12,
    summary: "Les 1000 m au milieu de semaine renforcent l’économie de course pendant que la longue du dimanche reste le pilier aérobie. Les semaines 4 et 8 coupent le volume pour absorber la charge.",
    equipmentTips: ["Montre avec alertes pour les récupérations 2′ entre 1000 m.","Lunettes si vent fort sur la piste ou le plat.","Étirements dynamiques 8′ avant les intervalles."],
    nutritionTips: ["Boisson isotonique maison (eau + jus + pincée de sel) au-delà de 75′.","Dormir 7 h minimum la nuit suivant les mercredis qualité.","Collation yaourt + flocons d’avoine après la longue."],
    shoeTips: ["Paire légère pour mercredis, chaussure plus protectrice pour dimanche.","Contrôle de foulée utile si douleurs récurrentes aux 1000 m."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.9, pace: "5:45/km", duration: 63, description: "Base, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 7.3, pace: "4:30/km", duration: 33, description: "4×1000 m récup 2′, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.3, pace: "6:00/km", duration: 44, description: "Récup post-intervalles, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.9, pace: "6:15/km", duration: 68, description: "Allure marathon imaginaire sur 20′, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 36.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.8, pace: "5:45/km", duration: 68, description: "Base, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 7.9, pace: "4:30/km", duration: 36, description: "4×1000 m récup 2′, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.9, pace: "6:00/km", duration: 47, description: "Récup post-intervalles, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.8, pace: "6:15/km", duration: 74, description: "Allure marathon imaginaire sur 20′, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 39.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.6, pace: "5:45/km", duration: 72, description: "Base, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 8.4, pace: "4:30/km", duration: 38, description: "4×1000 m récup 2′, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.4, pace: "6:00/km", duration: 50, description: "Récup post-intervalles, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.6, pace: "6:15/km", duration: 79, description: "Allure marathon imaginaire sur 20′, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 42,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.4, pace: "5:45/km", duration: 60, description: "Base, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 6.9, pace: "4:30/km", duration: 31, description: "4×1000 m récup 2′, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.9, pace: "6:00/km", duration: 41, description: "Récup post-intervalles, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "6:15/km", duration: 65, description: "Allure marathon imaginaire sur 20′, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 34.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.8, pace: "5:45/km", duration: 56, description: "Base, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 6.6, pace: "4:30/km", duration: 30, description: "4×1000 m récup 2′, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.6, pace: "6:00/km", duration: 40, description: "Récup post-intervalles, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.8, pace: "6:15/km", duration: 61, description: "Allure marathon imaginaire sur 20′, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 32.8,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.6, pace: "5:45/km", duration: 61, description: "Base, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 7.1, pace: "4:30/km", duration: 32, description: "4×1000 m récup 2′, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.1, pace: "6:00/km", duration: 43, description: "Récup post-intervalles, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.6, pace: "6:15/km", duration: 66, description: "Allure marathon imaginaire sur 20′, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 35.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.4, pace: "5:45/km", duration: 66, description: "Base, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 7.6, pace: "4:30/km", duration: 34, description: "4×1000 m récup 2′, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.6, pace: "6:00/km", duration: 46, description: "Récup post-intervalles, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.4, pace: "6:15/km", duration: 71, description: "Allure marathon imaginaire sur 20′, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 38,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.3, pace: "5:45/km", duration: 53, description: "Base, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 6.2, pace: "4:30/km", duration: 28, description: "4×1000 m récup 2′, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.2, pace: "6:00/km", duration: 37, description: "Récup post-intervalles, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.3, pace: "6:15/km", duration: 58, description: "Allure marathon imaginaire sur 20′, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 31,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.9, pace: "5:45/km", duration: 51, description: "Base, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 5.9, pace: "4:30/km", duration: 27, description: "4×1000 m récup 2′, semaine 9.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.9, pace: "6:00/km", duration: 35, description: "Récup post-intervalles, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.9, pace: "6:15/km", duration: 56, description: "Allure marathon imaginaire sur 20′, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 29.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:45/km", duration: 55, description: "Base, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 6.4, pace: "4:30/km", duration: 29, description: "4×1000 m récup 2′, semaine 10.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.4, pace: "6:00/km", duration: 38, description: "Récup post-intervalles, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.5, pace: "6:15/km", duration: 59, description: "Allure marathon imaginaire sur 20′, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 31.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.8, pace: "5:45/km", duration: 51, description: "Base, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 5.9, pace: "4:30/km", duration: 27, description: "4×1000 m récup 2′, semaine 11.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.9, pace: "6:00/km", duration: 35, description: "Récup post-intervalles, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.8, pace: "6:15/km", duration: 55, description: "Allure marathon imaginaire sur 20′, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 29.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "5:45/km", duration: 44, description: "Base, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 5, pace: "4:30/km", duration: 23, description: "4×1000 m récup 2′, semaine 12.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5, pace: "6:00/km", duration: 30, description: "Récup post-intervalles, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.6, pace: "6:15/km", duration: 48, description: "Allure marathon imaginaire sur 20′, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 25.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_10k_advanced_5days_8weeks",
    name: "10 km — Avancé (5 j, 8 sem.)",
    goal: "distance",
    targetDistance: "10k",
    level: "advanced",
    daysPerWeek: 5,
    durationWeeks: 8,
    summary: "Cinq séances injectent du neuromusculaire (côtes), du tempo et une longue sans juxtaposer deux jours exigeants. L’affûtage final préserve la fraîcheur pour convertir le travail en chrono sur 10 km.",
    equipmentTips: ["Terrain de côtes court et raide plutôt que une montée interminable.","Corde à sauter 5′ en échauffement avant les côtes.","Veste coupe-vent pour les récupérations très lentes."],
    nutritionTips: ["Repas riche en glucides complexes la veille du vendredi tempo.","Magnésium alimentaire (oléagineux) si crampes sur les côtes.","Évitez les nouveaux produits la semaine du test 10 km."],
    shoeTips: ["Chaussures avec bon grip pour les montées courtes.","Compétition réservée à une paire testée sur au moins trois tempo."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "5:00/km", duration: 32, description: "Réveil musculaire, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 6.3, pace: "3:45/km", duration: 24, description: "8×60 m montée, récup descente, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.3, pace: "5:15/km", duration: 33, description: "Flux libre, semaine 1.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 6.3, pace: "4:15/km", duration: 27, description: "25′ un peu sous seuil, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.4, pace: "5:30/km", duration: 52, description: "Moteur aérobie, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 34.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.9, pace: "5:00/km", duration: 35, description: "Réveil musculaire, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 6.9, pace: "3:45/km", duration: 26, description: "8×60 m montée, récup descente, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.9, pace: "5:15/km", duration: 36, description: "Flux libre, semaine 2.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 6.9, pace: "4:15/km", duration: 29, description: "25′ un peu sous seuil, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "5:30/km", duration: 57, description: "Moteur aérobie, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 38,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "5:00/km", duration: 38, description: "Réveil musculaire, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 7.6, pace: "3:45/km", duration: 29, description: "8×60 m montée, récup descente, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.6, pace: "5:15/km", duration: 40, description: "Flux libre, semaine 3.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 7.6, pace: "4:15/km", duration: 32, description: "25′ un peu sous seuil, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.4, pace: "5:30/km", duration: 63, description: "Moteur aérobie, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 41.8,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.1, pace: "5:00/km", duration: 31, description: "Réveil musculaire, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 6.1, pace: "3:45/km", duration: 23, description: "8×60 m montée, récup descente, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.1, pace: "5:15/km", duration: 32, description: "Flux libre, semaine 4.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 6.1, pace: "4:15/km", duration: 26, description: "25′ un peu sous seuil, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.1, pace: "5:30/km", duration: 50, description: "Moteur aérobie, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 33.5,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8, pace: "5:00/km", duration: 40, description: "Réveil musculaire, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 8, pace: "3:45/km", duration: 30, description: "8×60 m montée, récup descente, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8, pace: "5:15/km", duration: 42, description: "Flux libre, semaine 5.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 8, pace: "4:15/km", duration: 34, description: "25′ un peu sous seuil, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12, pace: "5:30/km", duration: 66, description: "Moteur aérobie, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 44,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.6, pace: "5:00/km", duration: 43, description: "Réveil musculaire, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 8.6, pace: "3:45/km", duration: 32, description: "8×60 m montée, récup descente, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.6, pace: "5:15/km", duration: 45, description: "Flux libre, semaine 6.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 8.6, pace: "4:15/km", duration: 37, description: "25′ un peu sous seuil, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.9, pace: "5:30/km", duration: 71, description: "Moteur aérobie, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 47.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.1, pace: "5:00/km", duration: 31, description: "Réveil musculaire, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 6.1, pace: "3:45/km", duration: 23, description: "8×60 m montée, récup descente, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.1, pace: "5:15/km", duration: 32, description: "Flux libre, semaine 7.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 6.1, pace: "4:15/km", duration: 26, description: "25′ un peu sous seuil, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.2, pace: "5:30/km", duration: 51, description: "Moteur aérobie, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 33.6,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.2, pace: "5:00/km", duration: 26, description: "Réveil musculaire, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 5.2, pace: "3:45/km", duration: 20, description: "8×60 m montée, récup descente, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.2, pace: "5:15/km", duration: 27, description: "Flux libre, semaine 8.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 5.2, pace: "4:15/km", duration: 22, description: "25′ un peu sous seuil, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.9, pace: "5:30/km", duration: 43, description: "Moteur aérobie, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 28.7,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "semi_beginner_3days_16weeks",
    name: "Semi-marathon — Débutant (3 j, 16 sem.)",
    goal: "race",
    targetDistance: "semi",
    level: "beginner",
    daysPerWeek: 3,
    durationWeeks: 16,
    summary: "Le fartlek du jeudi apporte de la variété sans complexifier la séance, tandis que la longue du dimanche progresse lentement vers des durées semi-réalistes. Quatre cycles de quatre semaines rythment la montée en charge et les relâchements.",
    equipmentTips: ["Ceinture porte-flasque pour les longues > 100′ en fin de plan.","Crème solaire même par ciel couvert sur les sorties longues.","Chaussettes double épaisseur si ampoules sur le gros orteil."],
    nutritionTips: ["Tous les trois dimanches, testez un gel sur la longue pour l’habituer.","Repas de récupération avec protéines dans l’heure qui suit la longue.","Limitez les excès de caféine hors séances qualité."],
    shoeTips: ["Chaussure avec amorti généreux pour les dimanches longs.","Prévoyez une paire plus large si le pied gonfle sur les 2 h."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.6, pace: "7:00/km", duration: 67, description: "Travail d’économie, semaine 1.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.6, pace: "6:15/km", duration: 60, description: "1′ rapide / 2′ facile ×10, semaine 1.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.8, pace: "7:30/km", duration: 96, description: "Derniers km à allure semi si prévu, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 32,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.2, pace: "7:00/km", duration: 71, description: "Travail d’économie, semaine 2.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 10.2, pace: "6:15/km", duration: 64, description: "1′ rapide / 2′ facile ×10, semaine 2.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.6, pace: "7:30/km", duration: 102, description: "Derniers km à allure semi si prévu, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 34,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.8, pace: "7:00/km", duration: 76, description: "Travail d’économie, semaine 3.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 10.8, pace: "6:15/km", duration: 68, description: "1′ rapide / 2′ facile ×10, semaine 3.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.4, pace: "7:30/km", duration: 108, description: "Derniers km à allure semi si prévu, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 36,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.6, pace: "7:00/km", duration: 60, description: "Travail d’économie, semaine 4.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.6, pace: "6:15/km", duration: 54, description: "1′ rapide / 2′ facile ×10, semaine 4.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.5, pace: "7:30/km", duration: 86, description: "Derniers km à allure semi si prévu, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 28.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.1, pace: "7:00/km", duration: 64, description: "Travail d’économie, semaine 5.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.1, pace: "6:15/km", duration: 57, description: "1′ rapide / 2′ facile ×10, semaine 5.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.2, pace: "7:30/km", duration: 92, description: "Derniers km à allure semi si prévu, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 30.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.7, pace: "7:00/km", duration: 68, description: "Travail d’économie, semaine 6.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.7, pace: "6:15/km", duration: 61, description: "1′ rapide / 2′ facile ×10, semaine 6.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.9, pace: "7:30/km", duration: 97, description: "Derniers km à allure semi si prévu, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 32.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.2, pace: "7:00/km", duration: 71, description: "Travail d’économie, semaine 7.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 10.2, pace: "6:15/km", duration: 64, description: "1′ rapide / 2′ facile ×10, semaine 7.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.6, pace: "7:30/km", duration: 102, description: "Derniers km à allure semi si prévu, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 34,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.2, pace: "7:00/km", duration: 57, description: "Travail d’économie, semaine 8.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.2, pace: "6:15/km", duration: 51, description: "1′ rapide / 2′ facile ×10, semaine 8.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11, pace: "7:30/km", duration: 83, description: "Derniers km à allure semi si prévu, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 27.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.7, pace: "7:00/km", duration: 61, description: "Travail d’économie, semaine 9.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.7, pace: "6:15/km", duration: 54, description: "1′ rapide / 2′ facile ×10, semaine 9.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.6, pace: "7:30/km", duration: 87, description: "Derniers km à allure semi si prévu, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 29,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.2, pace: "7:00/km", duration: 64, description: "Travail d’économie, semaine 10.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.2, pace: "6:15/km", duration: 57, description: "1′ rapide / 2′ facile ×10, semaine 10.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.2, pace: "7:30/km", duration: 92, description: "Derniers km à allure semi si prévu, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 30.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.8, pace: "7:00/km", duration: 69, description: "Travail d’économie, semaine 11.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.8, pace: "6:15/km", duration: 61, description: "1′ rapide / 2′ facile ×10, semaine 11.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 13, pace: "7:30/km", duration: 98, description: "Derniers km à allure semi si prévu, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 32.6,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.8, pace: "7:00/km", duration: 55, description: "Travail d’économie, semaine 12.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 7.8, pace: "6:15/km", duration: 49, description: "1′ rapide / 2′ facile ×10, semaine 12.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "7:30/km", duration: 78, description: "Derniers km à allure semi si prévu, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 26,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.3, pace: "7:00/km", duration: 58, description: "Travail d’économie, semaine 13.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.3, pace: "6:15/km", duration: 52, description: "1′ rapide / 2′ facile ×10, semaine 13.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11, pace: "7:30/km", duration: 83, description: "Derniers km à allure semi si prévu, semaine 13.", intensity: "easy" }
      ],
      totalDistance: 27.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.8, pace: "7:00/km", duration: 62, description: "Travail d’économie, semaine 14.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.8, pace: "6:15/km", duration: 55, description: "1′ rapide / 2′ facile ×10, semaine 14.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.7, pace: "7:30/km", duration: 88, description: "Derniers km à allure semi si prévu, semaine 14.", intensity: "easy" }
      ],
      totalDistance: 29.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "7:00/km", duration: 53, description: "Travail d’économie, semaine 15.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 7.6, pace: "6:15/km", duration: 48, description: "1′ rapide / 2′ facile ×10, semaine 15.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.1, pace: "7:30/km", duration: 76, description: "Derniers km à allure semi si prévu, semaine 15.", intensity: "easy" }
      ],
      totalDistance: 25.3,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.5, pace: "7:00/km", duration: 46, description: "Travail d’économie, semaine 16.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 6.5, pace: "6:15/km", duration: 41, description: "1′ rapide / 2′ facile ×10, semaine 16.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.6, pace: "7:30/km", duration: 65, description: "Derniers km à allure semi si prévu, semaine 16.", intensity: "easy" }
      ],
      totalDistance: 21.6,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "semi_intermediate_4days_12weeks",
    name: "Semi-marathon — Intermédiaire (4 j, 12 sem.)",
    goal: "race",
    targetDistance: "semi",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 12,
    summary: "Ce plan transpose la logique 10 km intermédiaire vers la tenue d’allure sur la longue du week-end. Le tempo fractionné du mercredi prépare le rythme demi sans enchaîner deux séances dures consécutives.",
    equipmentTips: ["Gel attaché à la ceinture pour les longues avec blocs au seuil.","Montre avec autonomie > 10 h pour les sorties longues GPS.","T-shirt sans couture pour réduire les frottements sur 18–22 km."],
    nutritionTips: ["Plan hydrique : petite gorgée toutes les 10′ au-delà de 90′.","Cycle glucides 48 h avant une longue importante.","Omega-3 via poisson gras 1–2× par semaine pour l’inflammation."],
    shoeTips: ["Modèle légèrement plus ferme pour les blocs marathon sur longue.","Ne changez pas de drop à moins de 6 semaines de l’objectif."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.5, pace: "5:45/km", duration: 78, description: "Socle aérobie, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 9, pace: "5:00/km", duration: 45, description: "3×6′ à allure 10 km avec 2′ facile, semaine 1.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9, pace: "6:00/km", duration: 54, description: "Jog très lent après le tempo, semaine 1.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 13.5, pace: "6:15/km", duration: 84, description: "Tenue d’allure sur le dernier tiers, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 45,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.6, pace: "5:45/km", duration: 84, description: "Socle aérobie, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 9.7, pace: "5:00/km", duration: 49, description: "3×6′ à allure 10 km avec 2′ facile, semaine 2.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 9.7, pace: "6:00/km", duration: 58, description: "Marche active + très léger footing, semaine 2.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 14.6, pace: "6:15/km", duration: 91, description: "Tenue d’allure sur le dernier tiers, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 48.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.6, pace: "5:45/km", duration: 90, description: "Socle aérobie, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 10.4, pace: "5:00/km", duration: 52, description: "3×6′ à allure 10 km avec 2′ facile, semaine 3.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.4, pace: "6:00/km", duration: 62, description: "Jog très lent après le tempo, semaine 3.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 15.6, pace: "6:15/km", duration: 98, description: "Tenue d’allure sur le dernier tiers, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 52,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.8, pace: "5:45/km", duration: 74, description: "Socle aérobie, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 8.6, pace: "5:00/km", duration: 43, description: "3×6′ à allure 10 km avec 2′ facile, semaine 4.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 8.6, pace: "6:00/km", duration: 52, description: "Marche active + très léger footing, semaine 4.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 12.8, pace: "6:15/km", duration: 80, description: "Tenue d’allure sur le dernier tiers, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 42.8,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.2, pace: "5:45/km", duration: 70, description: "Socle aérobie, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 8.1, pace: "5:00/km", duration: 41, description: "3×6′ à allure 10 km avec 2′ facile, semaine 5.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.1, pace: "6:00/km", duration: 49, description: "Jog très lent après le tempo, semaine 5.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 12.2, pace: "6:15/km", duration: 76, description: "Tenue d’allure sur le dernier tiers, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 40.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.2, pace: "5:45/km", duration: 76, description: "Socle aérobie, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 8.8, pace: "5:00/km", duration: 44, description: "3×6′ à allure 10 km avec 2′ facile, semaine 6.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 8.8, pace: "6:00/km", duration: 53, description: "Marche active + très léger footing, semaine 6.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 13.2, pace: "6:15/km", duration: 83, description: "Tenue d’allure sur le dernier tiers, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 44,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.1, pace: "5:45/km", duration: 81, description: "Socle aérobie, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 9.4, pace: "5:00/km", duration: 47, description: "3×6′ à allure 10 km avec 2′ facile, semaine 7.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.4, pace: "6:00/km", duration: 56, description: "Jog très lent après le tempo, semaine 7.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 14.1, pace: "6:15/km", duration: 88, description: "Tenue d’allure sur le dernier tiers, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 47,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.5, pace: "5:45/km", duration: 66, description: "Socle aérobie, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 7.7, pace: "5:00/km", duration: 39, description: "3×6′ à allure 10 km avec 2′ facile, semaine 8.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 7.7, pace: "6:00/km", duration: 46, description: "Marche active + très léger footing, semaine 8.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 11.5, pace: "6:15/km", duration: 72, description: "Tenue d’allure sur le dernier tiers, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 38.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11, pace: "5:45/km", duration: 63, description: "Socle aérobie, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 7.3, pace: "5:00/km", duration: 37, description: "3×6′ à allure 10 km avec 2′ facile, semaine 9.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.3, pace: "6:00/km", duration: 44, description: "Jog très lent après le tempo, semaine 9.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 11, pace: "6:15/km", duration: 69, description: "Tenue d’allure sur le dernier tiers, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 36.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.9, pace: "5:45/km", duration: 68, description: "Socle aérobie, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 7.9, pace: "5:00/km", duration: 40, description: "3×6′ à allure 10 km avec 2′ facile, semaine 10.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 7.9, pace: "6:00/km", duration: 47, description: "Marche active + très léger footing, semaine 10.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 11.9, pace: "6:15/km", duration: 74, description: "Tenue d’allure sur le dernier tiers, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 39.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.9, pace: "5:45/km", duration: 63, description: "Socle aérobie, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 7.3, pace: "5:00/km", duration: 37, description: "3×6′ à allure 10 km avec 2′ facile, semaine 11.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.3, pace: "6:00/km", duration: 44, description: "Jog très lent après le tempo, semaine 11.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 10.9, pace: "6:15/km", duration: 68, description: "Tenue d’allure sur le dernier tiers, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 36.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.4, pace: "5:45/km", duration: 54, description: "Socle aérobie, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 6.2, pace: "5:00/km", duration: 31, description: "3×6′ à allure 10 km avec 2′ facile, semaine 12.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 6.2, pace: "6:00/km", duration: 37, description: "Marche active + très léger footing, semaine 12.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 9.4, pace: "6:15/km", duration: 59, description: "Tenue d’allure sur le dernier tiers, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 31.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "semi_advanced_5days_12weeks",
    name: "Semi-marathon — Avancé (5 j, 12 sem.)",
    goal: "race",
    targetDistance: "semi",
    level: "advanced",
    daysPerWeek: 5,
    durationWeeks: 12,
    summary: "Cinq sorties par semaine permettent d’alterner vitesse pure, seuil et endurance spécifique sans enchaîner deux stimulations maximales. La longue du dimanche intègre progressivement des portions proches de l’allure objectif demi.",
    equipmentTips: ["Haltères légers pour gainage dynamique les jours de seuil.","Piste ou chemin régulier pour cadencer les 400 m.","Montre avec zones cardiaques pour calibrer le seuil du vendredi."],
    nutritionTips: ["Boisson avec sodium si transpiration importante sur seuil 35′.","Repas protéiné le soir du mercredi après intervalles.","Jeûne partiel évité la veille des doubles séances facile + qualité (ici espacées)."],
    shoeTips: ["Paire plume pour mercredis, chaussure stable pour seuil et longue.","Contrôle visuel du pairage usure / kilométrage toutes les 3 semaines."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.8, pace: "5:00/km", duration: 49, description: "Base, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 9.8, pace: "3:45/km", duration: 37, description: "12×400 m, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 9.8, pace: "5:15/km", duration: 51, description: "Récup, semaine 1.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 9.8, pace: "4:15/km", duration: 42, description: "35′ continus, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.6, pace: "5:30/km", duration: 80, description: "Spécifique demi, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 53.8,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.5, pace: "5:00/km", duration: 53, description: "Base, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 10.5, pace: "3:45/km", duration: 39, description: "12×400 m, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 10.5, pace: "5:15/km", duration: 55, description: "Récup, semaine 2.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 10.5, pace: "4:15/km", duration: 45, description: "35′ continus, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.8, pace: "5:30/km", duration: 87, description: "Spécifique demi, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 57.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.3, pace: "5:00/km", duration: 57, description: "Base, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 11.3, pace: "3:45/km", duration: 42, description: "12×400 m, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.3, pace: "5:15/km", duration: 59, description: "Récup, semaine 3.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 11.3, pace: "4:15/km", duration: 48, description: "35′ continus, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.9, pace: "5:30/km", duration: 93, description: "Spécifique demi, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 62.1,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.2, pace: "5:00/km", duration: 46, description: "Base, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 9.2, pace: "3:45/km", duration: 35, description: "12×400 m, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 9.2, pace: "5:15/km", duration: 48, description: "Récup, semaine 4.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 9.2, pace: "4:15/km", duration: 39, description: "35′ continus, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.9, pace: "5:30/km", duration: 76, description: "Spécifique demi, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 50.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.8, pace: "5:00/km", duration: 44, description: "Base, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 8.8, pace: "3:45/km", duration: 33, description: "12×400 m, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.8, pace: "5:15/km", duration: 46, description: "Récup, semaine 5.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 8.8, pace: "4:15/km", duration: 37, description: "35′ continus, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.2, pace: "5:30/km", duration: 73, description: "Spécifique demi, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 48.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:00/km", duration: 48, description: "Base, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 9.5, pace: "3:45/km", duration: 36, description: "12×400 m, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 9.5, pace: "5:15/km", duration: 50, description: "Récup, semaine 6.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 9.5, pace: "4:15/km", duration: 40, description: "35′ continus, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.2, pace: "5:30/km", duration: 78, description: "Spécifique demi, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 52.2,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.1, pace: "5:00/km", duration: 51, description: "Base, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 10.1, pace: "3:45/km", duration: 38, description: "12×400 m, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 10.1, pace: "5:15/km", duration: 53, description: "Récup, semaine 7.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 10.1, pace: "4:15/km", duration: 43, description: "35′ continus, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.2, pace: "5:30/km", duration: 84, description: "Spécifique demi, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 55.6,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.3, pace: "5:00/km", duration: 42, description: "Base, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 8.3, pace: "3:45/km", duration: 31, description: "12×400 m, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.3, pace: "5:15/km", duration: 44, description: "Récup, semaine 8.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 8.3, pace: "4:15/km", duration: 35, description: "35′ continus, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.5, pace: "5:30/km", duration: 69, description: "Spécifique demi, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 45.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.9, pace: "5:00/km", duration: 40, description: "Base, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 7.9, pace: "3:45/km", duration: 30, description: "12×400 m, semaine 9.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.9, pace: "5:15/km", duration: 41, description: "Récup, semaine 9.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 7.9, pace: "4:15/km", duration: 34, description: "35′ continus, semaine 9.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.9, pace: "5:30/km", duration: 65, description: "Spécifique demi, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 43.5,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.5, pace: "5:00/km", duration: 43, description: "Base, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 8.5, pace: "3:45/km", duration: 32, description: "12×400 m, semaine 10.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.5, pace: "5:15/km", duration: 45, description: "Récup, semaine 10.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 8.5, pace: "4:15/km", duration: 36, description: "35′ continus, semaine 10.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.8, pace: "5:30/km", duration: 70, description: "Spécifique demi, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 46.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.9, pace: "5:00/km", duration: 40, description: "Base, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 7.9, pace: "3:45/km", duration: 30, description: "12×400 m, semaine 11.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.9, pace: "5:15/km", duration: 41, description: "Récup, semaine 11.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 7.9, pace: "4:15/km", duration: 34, description: "35′ continus, semaine 11.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.8, pace: "5:30/km", duration: 65, description: "Spécifique demi, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 43.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.8, pace: "5:00/km", duration: 34, description: "Base, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 6.8, pace: "3:45/km", duration: 26, description: "12×400 m, semaine 12.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.8, pace: "5:15/km", duration: 36, description: "Récup, semaine 12.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 6.8, pace: "4:15/km", duration: 29, description: "35′ continus, semaine 12.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.1, pace: "5:30/km", duration: 56, description: "Spécifique demi, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 37.3,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_beginner_4days_16weeks",
    name: "Marathon — Débutant (4 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "beginner",
    daysPerWeek: 4,
    durationWeeks: 16,
    summary: "Quatre sorties hebdomadaires privilégient la régularité : trois footings gérables en semaine et une longue du dimanche qui monte en douceur. Les progressions du mercredi restent modérées pour limiter les pics de fatigue.",
    equipmentTips: ["Sac à dos 5 l pour tester l’hydratation sur les longues > 2 h.","Bodyglide ou vaseline sur points de friction dès 15 km.","Casquette pour le soleil et la pluie fine."],
    nutritionTips: ["Tous les 15 jours, mangez un repas test la veille de longue dominicale.","Sel de l’Himalaya ou bouillon léger si crampes en fin de longue.","Dormir une heure de plus la semaine du pic de volume."],
    shoeTips: ["Chaussure daily trainer amortie pour 80 % du kilométrage.","Semelle orthopédique fixée avant 200 km sur la paire marathon."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.8, pace: "7:00/km", duration: 90, description: "Aérobie pur, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.5, pace: "7:00/km", duration: 60, description: "Progression sur 25–35′, semaine 1.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.5, pace: "7:15/km", duration: 62, description: "Courte et fluide, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.8, pace: "7:30/km", duration: 96, description: "Marchez 1–2′ si besoin, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 42.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.6, pace: "7:00/km", duration: 95, description: "Aérobie pur, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 9, pace: "7:00/km", duration: 63, description: "Progression sur 25–35′, semaine 2.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 9, pace: "7:15/km", duration: 65, description: "Courte et fluide, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.6, pace: "7:30/km", duration: 102, description: "Marchez 1–2′ si besoin, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 45.2,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.4, pace: "7:00/km", duration: 101, description: "Aérobie pur, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 9.6, pace: "7:00/km", duration: 67, description: "Progression sur 25–35′, semaine 3.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 9.6, pace: "7:15/km", duration: 70, description: "Courte et fluide, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.4, pace: "7:30/km", duration: 108, description: "Marchez 1–2′ si besoin, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 48,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.5, pace: "7:00/km", duration: 81, description: "Aérobie pur, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.7, pace: "7:00/km", duration: 54, description: "Progression sur 25–35′, semaine 4.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.7, pace: "7:15/km", duration: 56, description: "Courte et fluide, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.5, pace: "7:30/km", duration: 86, description: "Marchez 1–2′ si besoin, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 38.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.2, pace: "7:00/km", duration: 85, description: "Aérobie pur, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.1, pace: "7:00/km", duration: 57, description: "Progression sur 25–35′, semaine 5.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.1, pace: "7:15/km", duration: 59, description: "Courte et fluide, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.2, pace: "7:30/km", duration: 92, description: "Marchez 1–2′ si besoin, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 40.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.9, pace: "7:00/km", duration: 90, description: "Aérobie pur, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.6, pace: "7:00/km", duration: 60, description: "Progression sur 25–35′, semaine 6.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.6, pace: "7:15/km", duration: 62, description: "Courte et fluide, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.9, pace: "7:30/km", duration: 97, description: "Marchez 1–2′ si besoin, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 43,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.7, pace: "7:00/km", duration: 96, description: "Aérobie pur, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 9.1, pace: "7:00/km", duration: 64, description: "Progression sur 25–35′, semaine 7.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 9.1, pace: "7:15/km", duration: 66, description: "Courte et fluide, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.7, pace: "7:30/km", duration: 103, description: "Marchez 1–2′ si besoin, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 45.6,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11, pace: "7:00/km", duration: 77, description: "Aérobie pur, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.3, pace: "7:00/km", duration: 51, description: "Progression sur 25–35′, semaine 8.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.3, pace: "7:15/km", duration: 53, description: "Courte et fluide, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11, pace: "7:30/km", duration: 83, description: "Marchez 1–2′ si besoin, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 36.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.6, pace: "7:00/km", duration: 81, description: "Aérobie pur, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.7, pace: "7:00/km", duration: 54, description: "Progression sur 25–35′, semaine 9.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.7, pace: "7:15/km", duration: 56, description: "Courte et fluide, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.6, pace: "7:30/km", duration: 87, description: "Marchez 1–2′ si besoin, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 38.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.3, pace: "7:00/km", duration: 86, description: "Aérobie pur, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.2, pace: "7:00/km", duration: 57, description: "Progression sur 25–35′, semaine 10.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.2, pace: "7:15/km", duration: 59, description: "Courte et fluide, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.3, pace: "7:30/km", duration: 92, description: "Marchez 1–2′ si besoin, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 41,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.1, pace: "7:00/km", duration: 92, description: "Aérobie pur, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.7, pace: "7:00/km", duration: 61, description: "Progression sur 25–35′, semaine 11.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.7, pace: "7:15/km", duration: 63, description: "Courte et fluide, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.1, pace: "7:30/km", duration: 98, description: "Marchez 1–2′ si besoin, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 43.6,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.5, pace: "7:00/km", duration: 74, description: "Aérobie pur, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7, pace: "7:00/km", duration: 49, description: "Progression sur 25–35′, semaine 12.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7, pace: "7:15/km", duration: 51, description: "Courte et fluide, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.5, pace: "7:30/km", duration: 79, description: "Marchez 1–2′ si besoin, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 35,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.1, pace: "7:00/km", duration: 78, description: "Aérobie pur, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.4, pace: "7:00/km", duration: 52, description: "Progression sur 25–35′, semaine 13.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.4, pace: "7:15/km", duration: 54, description: "Courte et fluide, semaine 13.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.1, pace: "7:30/km", duration: 83, description: "Marchez 1–2′ si besoin, semaine 13.", intensity: "easy" }
      ],
      totalDistance: 37,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.7, pace: "7:00/km", duration: 82, description: "Aérobie pur, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.8, pace: "7:00/km", duration: 55, description: "Progression sur 25–35′, semaine 14.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.8, pace: "7:15/km", duration: 57, description: "Courte et fluide, semaine 14.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.7, pace: "7:30/km", duration: 88, description: "Marchez 1–2′ si besoin, semaine 14.", intensity: "easy" }
      ],
      totalDistance: 39,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.1, pace: "7:00/km", duration: 71, description: "Aérobie pur, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 6.7, pace: "7:00/km", duration: 47, description: "Progression sur 25–35′, semaine 15.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 6.7, pace: "7:15/km", duration: 49, description: "Courte et fluide, semaine 15.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.1, pace: "7:30/km", duration: 76, description: "Marchez 1–2′ si besoin, semaine 15.", intensity: "easy" }
      ],
      totalDistance: 33.6,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.6, pace: "7:00/km", duration: 60, description: "Aérobie pur, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 5.8, pace: "7:00/km", duration: 41, description: "Progression sur 25–35′, semaine 16.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 5.8, pace: "7:15/km", duration: 42, description: "Courte et fluide, semaine 16.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.6, pace: "7:30/km", duration: 65, description: "Marchez 1–2′ si besoin, semaine 16.", intensity: "easy" }
      ],
      totalDistance: 28.8,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_intermediate_4days_16weeks",
    name: "Marathon — Intermédiaire (4 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 16,
    summary: "Le seuil du mercredi et les blocs marathon en fin de longue du dimanche préparent l’effort prolongé sans saturer les jambes chaque jour. Les semaines 4, 8 et 12 coupent le volume pour mieux absorber les pics.",
    equipmentTips: ["Flasques 250 ml pour répéter la stratégie boisson du marathon.","Ceinture porte-gels pour les longues > 24 km.","Lunettes polarisantes si parcours en milieu ouvert."],
    nutritionTips: ["1 gel toutes les 45′ sur la longue > 2 h 15.","Petit-déjeuner identique chaque dimanche de longue.","Réduire les fibres 36 h avant le test long ou la course."],
    shoeTips: ["Modèle avec bon retour d’énergie pour les blocs marathon.","Gardez une deuxième paire identique en secours si humidité."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.5, pace: "5:45/km", duration: 89, description: "Endurance, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10.3, pace: "5:00/km", duration: 52, description: "3×8′ au seuil, semaine 1.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.3, pace: "6:00/km", duration: 62, description: "Récup, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.5, pace: "6:15/km", duration: 97, description: "Derniers 30′ allure marathon, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 51.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 16.4, pace: "5:45/km", duration: 94, description: "Endurance, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10.9, pace: "5:00/km", duration: 55, description: "3×8′ au seuil, semaine 2.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.9, pace: "6:00/km", duration: 65, description: "Récup, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.4, pace: "6:15/km", duration: 102, description: "Derniers 30′ allure marathon, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 54.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 17.4, pace: "5:45/km", duration: 100, description: "Endurance, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 11.6, pace: "5:00/km", duration: 58, description: "3×8′ au seuil, semaine 3.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.6, pace: "6:00/km", duration: 70, description: "Récup, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.4, pace: "6:15/km", duration: 109, description: "Derniers 30′ allure marathon, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 58,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14, pace: "5:45/km", duration: 81, description: "Endurance, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9.3, pace: "5:00/km", duration: 47, description: "3×8′ au seuil, semaine 4.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.3, pace: "6:00/km", duration: 56, description: "Récup, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14, pace: "6:15/km", duration: 88, description: "Derniers 30′ allure marathon, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 46.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.8, pace: "5:45/km", duration: 85, description: "Endurance, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9.9, pace: "5:00/km", duration: 50, description: "3×8′ au seuil, semaine 5.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.9, pace: "6:00/km", duration: 59, description: "Récup, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.8, pace: "6:15/km", duration: 93, description: "Derniers 30′ allure marathon, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 49.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.7, pace: "5:45/km", duration: 90, description: "Endurance, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10.5, pace: "5:00/km", duration: 53, description: "3×8′ au seuil, semaine 6.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.5, pace: "6:00/km", duration: 63, description: "Récup, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.7, pace: "6:15/km", duration: 98, description: "Derniers 30′ allure marathon, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 52.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 16.6, pace: "5:45/km", duration: 95, description: "Endurance, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 11.1, pace: "5:00/km", duration: 56, description: "3×8′ au seuil, semaine 7.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.1, pace: "6:00/km", duration: 67, description: "Récup, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.6, pace: "6:15/km", duration: 104, description: "Derniers 30′ allure marathon, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 55.4,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.3, pace: "5:45/km", duration: 76, description: "Endurance, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 8.9, pace: "5:00/km", duration: 45, description: "3×8′ au seuil, semaine 8.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.9, pace: "6:00/km", duration: 53, description: "Récup, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.3, pace: "6:15/km", duration: 83, description: "Derniers 30′ allure marathon, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 44.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.1, pace: "5:45/km", duration: 81, description: "Endurance, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9.4, pace: "5:00/km", duration: 47, description: "3×8′ au seuil, semaine 9.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.4, pace: "6:00/km", duration: 56, description: "Récup, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.1, pace: "6:15/km", duration: 88, description: "Derniers 30′ allure marathon, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 47,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.9, pace: "5:45/km", duration: 86, description: "Endurance, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10, pace: "5:00/km", duration: 50, description: "3×8′ au seuil, semaine 10.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10, pace: "6:00/km", duration: 60, description: "Récup, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.9, pace: "6:15/km", duration: 93, description: "Derniers 30′ allure marathon, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 49.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.8, pace: "5:45/km", duration: 91, description: "Endurance, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10.6, pace: "5:00/km", duration: 53, description: "3×8′ au seuil, semaine 11.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.6, pace: "6:00/km", duration: 64, description: "Récup, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.8, pace: "6:15/km", duration: 99, description: "Derniers 30′ allure marathon, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 52.8,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.7, pace: "5:45/km", duration: 73, description: "Endurance, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 8.5, pace: "5:00/km", duration: 43, description: "3×8′ au seuil, semaine 12.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.5, pace: "6:00/km", duration: 51, description: "Récup, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.7, pace: "6:15/km", duration: 79, description: "Derniers 30′ allure marathon, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 42.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.5, pace: "5:45/km", duration: 78, description: "Endurance, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9, pace: "5:00/km", duration: 45, description: "3×8′ au seuil, semaine 13.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9, pace: "6:00/km", duration: 54, description: "Récup, semaine 13.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.5, pace: "6:15/km", duration: 84, description: "Derniers 30′ allure marathon, semaine 13.", intensity: "moderate" }
      ],
      totalDistance: 45,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.2, pace: "5:45/km", duration: 82, description: "Endurance, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9.5, pace: "5:00/km", duration: 48, description: "3×8′ au seuil, semaine 14.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.5, pace: "6:00/km", duration: 57, description: "Récup, semaine 14.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.2, pace: "6:15/km", duration: 89, description: "Derniers 30′ allure marathon, semaine 14.", intensity: "moderate" }
      ],
      totalDistance: 47.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.2, pace: "5:45/km", duration: 70, description: "Endurance, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 8.1, pace: "5:00/km", duration: 41, description: "3×8′ au seuil, semaine 15.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.1, pace: "6:00/km", duration: 49, description: "Récup, semaine 15.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.2, pace: "6:15/km", duration: 76, description: "Derniers 30′ allure marathon, semaine 15.", intensity: "moderate" }
      ],
      totalDistance: 40.6,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.4, pace: "5:45/km", duration: 60, description: "Endurance, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 7, pace: "5:00/km", duration: 35, description: "3×8′ au seuil, semaine 16.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7, pace: "6:00/km", duration: 42, description: "Récup, semaine 16.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "6:15/km", duration: 65, description: "Derniers 30′ allure marathon, semaine 16.", intensity: "moderate" }
      ],
      totalDistance: 34.8,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_intermediate_5days_16weeks",
    name: "Marathon — Intermédiaire (5 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "intermediate",
    daysPerWeek: 5,
    durationWeeks: 16,
    summary: "La cinquième séance ajoute du rythme marathon encadré par des récupérations actives et des joggings faciles. Le tempo du vendredi reste distinct du mercredi allure marathon pour ne pas cumuler deux sollicitations identiques.",
    equipmentTips: ["Gilet d’hydratation pour simuler le poids du équipement course.","Montre avec segments pour enchaîner 2 × 20′ marathon.","Tapis noir ou escaliers pour le prévention chevilles légères."],
    nutritionTips: ["Repas glucides modérés le jeudi soir avant le vendredi tempo.","Barre céréales 90′ avant la sortie du mercredi si matinale.","Électrolytes en poudre dans une gourde pour les longues chaudes."],
    shoeTips: ["Deux modèles : entraînement amorti + modèle plus nerveux pour tempo.","Surveillez la compression du coup de pied après 600 km."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11, pace: "5:45/km", duration: 63, description: "Volume facile, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11, pace: "5:00/km", duration: 55, description: "3×15′ allure marathon, semaine 1.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11, pace: "6:00/km", duration: 66, description: "Récup, semaine 1.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11, pace: "5:00/km", duration: 55, description: "20′ + 10′ rapide, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.6, pace: "6:15/km", duration: 104, description: "Longue avec 2 dernières allure objectif, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 60.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.7, pace: "5:45/km", duration: 67, description: "Volume facile, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11.7, pace: "5:00/km", duration: 59, description: "3×15′ allure marathon, semaine 2.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.7, pace: "6:00/km", duration: 70, description: "Récup, semaine 2.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11.7, pace: "5:00/km", duration: 59, description: "20′ + 10′ rapide, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.5, pace: "6:15/km", duration: 109, description: "Longue avec 2 dernières allure objectif, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 64.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.4, pace: "5:45/km", duration: 71, description: "Volume facile, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 12.4, pace: "5:00/km", duration: 62, description: "3×15′ allure marathon, semaine 3.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 12.4, pace: "6:00/km", duration: 74, description: "Récup, semaine 3.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 12.4, pace: "5:00/km", duration: 62, description: "20′ + 10′ rapide, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.5, pace: "6:15/km", duration: 116, description: "Longue avec 2 dernières allure objectif, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 68.1,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.9, pace: "5:45/km", duration: 57, description: "Volume facile, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 9.9, pace: "5:00/km", duration: 50, description: "3×15′ allure marathon, semaine 4.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.9, pace: "6:00/km", duration: 59, description: "Récup, semaine 4.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 9.9, pace: "5:00/km", duration: 50, description: "20′ + 10′ rapide, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.8, pace: "6:15/km", duration: 93, description: "Longue avec 2 dernières allure objectif, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 54.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.5, pace: "5:45/km", duration: 60, description: "Volume facile, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 10.5, pace: "5:00/km", duration: 53, description: "3×15′ allure marathon, semaine 5.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.5, pace: "6:00/km", duration: 63, description: "Récup, semaine 5.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 10.5, pace: "5:00/km", duration: 53, description: "20′ + 10′ rapide, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.7, pace: "6:15/km", duration: 98, description: "Longue avec 2 dernières allure objectif, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 57.7,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.1, pace: "5:45/km", duration: 64, description: "Volume facile, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11.1, pace: "5:00/km", duration: 56, description: "3×15′ allure marathon, semaine 6.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.1, pace: "6:00/km", duration: 67, description: "Récup, semaine 6.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11.1, pace: "5:00/km", duration: 56, description: "20′ + 10′ rapide, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.7, pace: "6:15/km", duration: 104, description: "Longue avec 2 dernières allure objectif, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 61.1,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.8, pace: "5:45/km", duration: 68, description: "Volume facile, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11.8, pace: "5:00/km", duration: 59, description: "3×15′ allure marathon, semaine 7.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.8, pace: "6:00/km", duration: 71, description: "Récup, semaine 7.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11.8, pace: "5:00/km", duration: 59, description: "20′ + 10′ rapide, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.7, pace: "6:15/km", duration: 111, description: "Longue avec 2 dernières allure objectif, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 64.9,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:45/km", duration: 55, description: "Volume facile, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 9.5, pace: "5:00/km", duration: 48, description: "3×15′ allure marathon, semaine 8.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.5, pace: "6:00/km", duration: 57, description: "Récup, semaine 8.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 9.5, pace: "5:00/km", duration: 48, description: "20′ + 10′ rapide, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.2, pace: "6:15/km", duration: 89, description: "Longue avec 2 dernières allure objectif, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 52.2,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10, pace: "5:45/km", duration: 58, description: "Volume facile, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 10, pace: "5:00/km", duration: 50, description: "3×15′ allure marathon, semaine 9.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10, pace: "6:00/km", duration: 60, description: "Récup, semaine 9.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 10, pace: "5:00/km", duration: 50, description: "20′ + 10′ rapide, semaine 9.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15, pace: "6:15/km", duration: 94, description: "Longue avec 2 dernières allure objectif, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 55,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.6, pace: "5:45/km", duration: 61, description: "Volume facile, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 10.6, pace: "5:00/km", duration: 53, description: "3×15′ allure marathon, semaine 10.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.6, pace: "6:00/km", duration: 64, description: "Récup, semaine 10.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 10.6, pace: "5:00/km", duration: 53, description: "20′ + 10′ rapide, semaine 10.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.9, pace: "6:15/km", duration: 99, description: "Longue avec 2 dernières allure objectif, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 58.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.3, pace: "5:45/km", duration: 65, description: "Volume facile, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11.3, pace: "5:00/km", duration: 57, description: "3×15′ allure marathon, semaine 11.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.3, pace: "6:00/km", duration: 68, description: "Récup, semaine 11.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11.3, pace: "5:00/km", duration: 57, description: "20′ + 10′ rapide, semaine 11.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.9, pace: "6:15/km", duration: 106, description: "Longue avec 2 dernières allure objectif, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 62.1,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9, pace: "5:45/km", duration: 52, description: "Volume facile, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 9, pace: "5:00/km", duration: 45, description: "3×15′ allure marathon, semaine 12.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9, pace: "6:00/km", duration: 54, description: "Récup, semaine 12.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 9, pace: "5:00/km", duration: 45, description: "20′ + 10′ rapide, semaine 12.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.5, pace: "6:15/km", duration: 84, description: "Longue avec 2 dernières allure objectif, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 49.5,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:45/km", duration: 55, description: "Volume facile, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 9.5, pace: "5:00/km", duration: 48, description: "3×15′ allure marathon, semaine 13.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.5, pace: "6:00/km", duration: 57, description: "Récup, semaine 13.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 9.5, pace: "5:00/km", duration: 48, description: "20′ + 10′ rapide, semaine 13.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.3, pace: "6:15/km", duration: 89, description: "Longue avec 2 dernières allure objectif, semaine 13.", intensity: "moderate" }
      ],
      totalDistance: 52.3,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.1, pace: "5:45/km", duration: 58, description: "Volume facile, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 10.1, pace: "5:00/km", duration: 51, description: "3×15′ allure marathon, semaine 14.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.1, pace: "6:00/km", duration: 61, description: "Récup, semaine 14.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 10.1, pace: "5:00/km", duration: 51, description: "20′ + 10′ rapide, semaine 14.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.1, pace: "6:15/km", duration: 94, description: "Longue avec 2 dernières allure objectif, semaine 14.", intensity: "moderate" }
      ],
      totalDistance: 55.5,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.7, pace: "5:45/km", duration: 50, description: "Volume facile, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 8.7, pace: "5:00/km", duration: 44, description: "3×15′ allure marathon, semaine 15.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.7, pace: "6:00/km", duration: 52, description: "Récup, semaine 15.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 8.7, pace: "5:00/km", duration: 44, description: "20′ + 10′ rapide, semaine 15.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13, pace: "6:15/km", duration: 81, description: "Longue avec 2 dernières allure objectif, semaine 15.", intensity: "moderate" }
      ],
      totalDistance: 47.8,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.4, pace: "5:45/km", duration: 43, description: "Volume facile, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 7.4, pace: "5:00/km", duration: 37, description: "3×15′ allure marathon, semaine 16.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.4, pace: "6:00/km", duration: 44, description: "Récup, semaine 16.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 7.4, pace: "5:00/km", duration: 37, description: "20′ + 10′ rapide, semaine 16.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.1, pace: "6:15/km", duration: 69, description: "Longue avec 2 dernières allure objectif, semaine 16.", intensity: "moderate" }
      ],
      totalDistance: 40.7,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_advanced_4days_16weeks",
    name: "Marathon — Avancé (4 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "advanced",
    daysPerWeek: 4,
    durationWeeks: 16,
    summary: "Les 1000 m au seuil VO2 entretenent la vitesse pendant que la longue intègre des blocs marathon exigeants. La structure respecte un jour de récupération active après chaque séance nerveuse.",
    equipmentTips: ["Podomètre ou capteur cadence pour analyser la fin de longue.","Rouleau dense pour quadriceps post-seuil.","GPS multi-segments pour les 40′ allure marathon."],
    nutritionTips: ["Gels avec caféine seulement si testés sur longue, jamais en première.","Repas fer + vitamine C pour l’hémoglobine sur gros volume.","Hydratation planifiée dès J-3 sur la semaine du marathon."],
    shoeTips: ["Paire compétition réservée aux blocs rapides et au marathon.","Évitez toute nouvelle chaussette le mois de la course."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.3, pace: "5:00/km", duration: 72, description: "Volume modéré, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.3, pace: "3:45/km", duration: 54, description: "5×1000 m cible 10 km, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.3, pace: "5:15/km", duration: 75, description: "Très lent, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.4, pace: "5:30/km", duration: 118, description: "Inclure 40′ allure marathon, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 64.3,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.1, pace: "5:00/km", duration: 76, description: "Volume modéré, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 15.1, pace: "3:45/km", duration: 57, description: "5×1000 m cible 10 km, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 15.1, pace: "5:15/km", duration: 79, description: "Très lent, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 22.7, pace: "5:30/km", duration: 125, description: "Inclure 40′ allure marathon, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 68,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 16, pace: "5:00/km", duration: 80, description: "Volume modéré, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 16, pace: "3:45/km", duration: 60, description: "5×1000 m cible 10 km, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 16, pace: "5:15/km", duration: 84, description: "Très lent, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 24, pace: "5:30/km", duration: 132, description: "Inclure 40′ allure marathon, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 72,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.8, pace: "5:00/km", duration: 64, description: "Volume modéré, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.8, pace: "3:45/km", duration: 48, description: "5×1000 m cible 10 km, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.8, pace: "5:15/km", duration: 67, description: "Très lent, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.2, pace: "5:30/km", duration: 106, description: "Inclure 40′ allure marathon, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 57.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.6, pace: "5:00/km", duration: 68, description: "Volume modéré, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.6, pace: "3:45/km", duration: 51, description: "5×1000 m cible 10 km, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.6, pace: "5:15/km", duration: 71, description: "Très lent, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 20.4, pace: "5:30/km", duration: 112, description: "Inclure 40′ allure marathon, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 61.2,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.4, pace: "5:00/km", duration: 72, description: "Volume modéré, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.4, pace: "3:45/km", duration: 54, description: "5×1000 m cible 10 km, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.4, pace: "5:15/km", duration: 76, description: "Très lent, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.7, pace: "5:30/km", duration: 119, description: "Inclure 40′ allure marathon, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 64.9,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.3, pace: "5:00/km", duration: 77, description: "Volume modéré, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 15.3, pace: "3:45/km", duration: 57, description: "5×1000 m cible 10 km, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 15.3, pace: "5:15/km", duration: 80, description: "Très lent, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 23, pace: "5:30/km", duration: 127, description: "Inclure 40′ allure marathon, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 68.9,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.2, pace: "5:00/km", duration: 61, description: "Volume modéré, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.2, pace: "3:45/km", duration: 46, description: "5×1000 m cible 10 km, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.2, pace: "5:15/km", duration: 64, description: "Très lent, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.4, pace: "5:30/km", duration: 101, description: "Inclure 40′ allure marathon, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 55,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13, pace: "5:00/km", duration: 65, description: "Volume modéré, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13, pace: "3:45/km", duration: 49, description: "5×1000 m cible 10 km, semaine 9.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13, pace: "5:15/km", duration: 68, description: "Très lent, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.5, pace: "5:30/km", duration: 107, description: "Inclure 40′ allure marathon, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 58.5,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.8, pace: "5:00/km", duration: 69, description: "Volume modéré, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.8, pace: "3:45/km", duration: 52, description: "5×1000 m cible 10 km, semaine 10.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.8, pace: "5:15/km", duration: 72, description: "Très lent, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 20.6, pace: "5:30/km", duration: 113, description: "Inclure 40′ allure marathon, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 62,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.6, pace: "5:00/km", duration: 73, description: "Volume modéré, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.6, pace: "3:45/km", duration: 55, description: "5×1000 m cible 10 km, semaine 11.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.6, pace: "5:15/km", duration: 77, description: "Très lent, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.9, pace: "5:30/km", duration: 120, description: "Inclure 40′ allure marathon, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 65.7,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.7, pace: "5:00/km", duration: 59, description: "Volume modéré, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.7, pace: "3:45/km", duration: 44, description: "5×1000 m cible 10 km, semaine 12.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.7, pace: "5:15/km", duration: 61, description: "Très lent, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.5, pace: "5:30/km", duration: 96, description: "Inclure 40′ allure marathon, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 52.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.4, pace: "5:00/km", duration: 62, description: "Volume modéré, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.4, pace: "3:45/km", duration: 47, description: "5×1000 m cible 10 km, semaine 13.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.4, pace: "5:15/km", duration: 65, description: "Très lent, semaine 13.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.5, pace: "5:30/km", duration: 102, description: "Inclure 40′ allure marathon, semaine 13.", intensity: "moderate" }
      ],
      totalDistance: 55.7,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.1, pace: "5:00/km", duration: 66, description: "Volume modéré, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.1, pace: "3:45/km", duration: 49, description: "5×1000 m cible 10 km, semaine 14.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.1, pace: "5:15/km", duration: 69, description: "Très lent, semaine 14.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.6, pace: "5:30/km", duration: 108, description: "Inclure 40′ allure marathon, semaine 14.", intensity: "moderate" }
      ],
      totalDistance: 58.9,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.2, pace: "5:00/km", duration: 56, description: "Volume modéré, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.2, pace: "3:45/km", duration: 42, description: "5×1000 m cible 10 km, semaine 15.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.2, pace: "5:15/km", duration: 59, description: "Très lent, semaine 15.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.8, pace: "5:30/km", duration: 92, description: "Inclure 40′ allure marathon, semaine 15.", intensity: "moderate" }
      ],
      totalDistance: 50.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.6, pace: "5:00/km", duration: 48, description: "Volume modéré, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 9.6, pace: "3:45/km", duration: 36, description: "5×1000 m cible 10 km, semaine 16.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 9.6, pace: "5:15/km", duration: 50, description: "Très lent, semaine 16.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.4, pace: "5:30/km", duration: 79, description: "Inclure 40′ allure marathon, semaine 16.", intensity: "moderate" }
      ],
      totalDistance: 43.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_advanced_5days_16weeks",
    name: "Marathon — Avancé (5 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "advanced",
    daysPerWeek: 5,
    durationWeeks: 16,
    summary: "Ce plan haut volume alterne stimulation aérobie maximale (longue) et travail de seuil marathon sans enchaînement de jours durs consécutifs. L’affûtage final allège fortement la charge pour maximiser la performance le jour J.",
    equipmentTips: ["Straps cheville légères si terrain instable sur longues.","Bain froid 10′ optionnel après la séance du mercredi lourde.","Chargeur portable pour longues sorties GPS > 3 h."],
    nutritionTips: ["90 g glucides / h testés sur la longue du dimanche en phase spécifique.","Dîner pauvre en fibres J-2, riche en glucides J-1.","Plan de rehydratation post-sortie double eau + jus."],
    shoeTips: ["Rotation 3 paires si volume > 80 km/semaine en pic.","Compétition avec 40–60 km d’usure contrôlée avant le marathon."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.3, pace: "5:00/km", duration: 67, description: "Endurance, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.3, pace: "3:45/km", duration: 50, description: "6×1000 m, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.3, pace: "5:15/km", duration: 70, description: "Récup, semaine 1.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 13.3, pace: "4:15/km", duration: 57, description: "2×20′ marathon, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.9, pace: "5:30/km", duration: 109, description: "Spécifique, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 73.1,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.1, pace: "5:00/km", duration: 71, description: "Endurance, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.1, pace: "3:45/km", duration: 53, description: "6×1000 m, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.1, pace: "5:15/km", duration: 74, description: "Récup, semaine 2.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 14.1, pace: "4:15/km", duration: 60, description: "2×20′ marathon, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.1, pace: "5:30/km", duration: 116, description: "Spécifique, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 77.5,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.9, pace: "5:00/km", duration: 75, description: "Endurance, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.9, pace: "3:45/km", duration: 56, description: "6×1000 m, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.9, pace: "5:15/km", duration: 78, description: "Récup, semaine 3.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 14.9, pace: "4:15/km", duration: 63, description: "2×20′ marathon, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 22.4, pace: "5:30/km", duration: 123, description: "Spécifique, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 82,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.9, pace: "5:00/km", duration: 60, description: "Endurance, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.9, pace: "3:45/km", duration: 45, description: "6×1000 m, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.9, pace: "5:15/km", duration: 62, description: "Récup, semaine 4.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 11.9, pace: "4:15/km", duration: 51, description: "2×20′ marathon, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.9, pace: "5:30/km", duration: 98, description: "Spécifique, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 65.5,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.7, pace: "5:00/km", duration: 64, description: "Endurance, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.7, pace: "3:45/km", duration: 48, description: "6×1000 m, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.7, pace: "5:15/km", duration: 67, description: "Récup, semaine 5.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 12.7, pace: "4:15/km", duration: 54, description: "2×20′ marathon, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 19, pace: "5:30/km", duration: 105, description: "Spécifique, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 69.8,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.4, pace: "5:00/km", duration: 67, description: "Endurance, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.4, pace: "3:45/km", duration: 50, description: "6×1000 m, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.4, pace: "5:15/km", duration: 70, description: "Récup, semaine 6.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 13.4, pace: "4:15/km", duration: 57, description: "2×20′ marathon, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 20.1, pace: "5:30/km", duration: 111, description: "Spécifique, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 73.7,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.2, pace: "5:00/km", duration: 71, description: "Endurance, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.2, pace: "3:45/km", duration: 53, description: "6×1000 m, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.2, pace: "5:15/km", duration: 75, description: "Récup, semaine 7.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 14.2, pace: "4:15/km", duration: 60, description: "2×20′ marathon, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.4, pace: "5:30/km", duration: 118, description: "Spécifique, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 78.2,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.4, pace: "5:00/km", duration: 57, description: "Endurance, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.4, pace: "3:45/km", duration: 43, description: "6×1000 m, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.4, pace: "5:15/km", duration: 60, description: "Récup, semaine 8.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 11.4, pace: "4:15/km", duration: 48, description: "2×20′ marathon, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.1, pace: "5:30/km", duration: 94, description: "Spécifique, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 62.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.1, pace: "5:00/km", duration: 61, description: "Endurance, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.1, pace: "3:45/km", duration: 45, description: "6×1000 m, semaine 9.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.1, pace: "5:15/km", duration: 64, description: "Récup, semaine 9.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 12.1, pace: "4:15/km", duration: 51, description: "2×20′ marathon, semaine 9.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.1, pace: "5:30/km", duration: 100, description: "Spécifique, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 66.5,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.8, pace: "5:00/km", duration: 64, description: "Endurance, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.8, pace: "3:45/km", duration: 48, description: "6×1000 m, semaine 10.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.8, pace: "5:15/km", duration: 67, description: "Récup, semaine 10.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 12.8, pace: "4:15/km", duration: 54, description: "2×20′ marathon, semaine 10.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.2, pace: "5:30/km", duration: 106, description: "Spécifique, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 70.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.5, pace: "5:00/km", duration: 68, description: "Endurance, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.5, pace: "3:45/km", duration: 51, description: "6×1000 m, semaine 11.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.5, pace: "5:15/km", duration: 71, description: "Récup, semaine 11.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 13.5, pace: "4:15/km", duration: 57, description: "2×20′ marathon, semaine 11.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 20.3, pace: "5:30/km", duration: 112, description: "Spécifique, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 74.3,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.8, pace: "5:00/km", duration: 54, description: "Endurance, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 10.8, pace: "3:45/km", duration: 41, description: "6×1000 m, semaine 12.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 10.8, pace: "5:15/km", duration: 57, description: "Récup, semaine 12.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 10.8, pace: "4:15/km", duration: 46, description: "2×20′ marathon, semaine 12.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.3, pace: "5:30/km", duration: 90, description: "Spécifique, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 59.5,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.5, pace: "5:00/km", duration: 58, description: "Endurance, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.5, pace: "3:45/km", duration: 43, description: "6×1000 m, semaine 13.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.5, pace: "5:15/km", duration: 60, description: "Récup, semaine 13.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 11.5, pace: "4:15/km", duration: 49, description: "2×20′ marathon, semaine 13.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.2, pace: "5:30/km", duration: 95, description: "Spécifique, semaine 13.", intensity: "moderate" }
      ],
      totalDistance: 63.2,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.1, pace: "5:00/km", duration: 61, description: "Endurance, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.1, pace: "3:45/km", duration: 45, description: "6×1000 m, semaine 14.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.1, pace: "5:15/km", duration: 64, description: "Récup, semaine 14.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 12.1, pace: "4:15/km", duration: 51, description: "2×20′ marathon, semaine 14.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.2, pace: "5:30/km", duration: 100, description: "Spécifique, semaine 14.", intensity: "moderate" }
      ],
      totalDistance: 66.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.4, pace: "5:00/km", duration: 52, description: "Endurance, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 10.4, pace: "3:45/km", duration: 39, description: "6×1000 m, semaine 15.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 10.4, pace: "5:15/km", duration: 55, description: "Récup, semaine 15.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 10.4, pace: "4:15/km", duration: 44, description: "2×20′ marathon, semaine 15.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.7, pace: "5:30/km", duration: 86, description: "Spécifique, semaine 15.", intensity: "moderate" }
      ],
      totalDistance: 57.3,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.9, pace: "5:00/km", duration: 45, description: "Endurance, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 8.9, pace: "3:45/km", duration: 33, description: "6×1000 m, semaine 16.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.9, pace: "5:15/km", duration: 47, description: "Récup, semaine 16.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 8.9, pace: "4:15/km", duration: 38, description: "2×20′ marathon, semaine 16.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.4, pace: "5:30/km", duration: 74, description: "Spécifique, semaine 16.", intensity: "moderate" }
      ],
      totalDistance: 49,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  }
];

export function getPlanById(id: string): TrainingPlan | undefined {
  return TRAINING_PLANS.find(plan => plan.id === id);
}

