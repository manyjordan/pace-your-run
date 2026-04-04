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
  // Weight Loss Plans
  createWeightPlan("weight_beginner_2days_4weeks", "Perte de poids - Débutant (2j/semaine, 4 semaines)", 2, 4),
  createWeightPlan("weight_beginner_3days_8weeks", "Perte de poids - Débutant (3j/semaine, 8 semaines)", 3, 8),
  createWeightPlan("weight_beginner_3days_12weeks", "Perte de poids - Débutant (3j/semaine, 12 semaines)", 3, 12),
  createWeightPlan("weight_intermediate_3days_8weeks", "Perte de poids - Intermédiaire (3j/semaine, 8 semaines)", 3, 8),
  createWeightPlan("weight_intermediate_4days_12weeks", "Perte de poids - Intermédiaire (4j/semaine, 12 semaines)", 4, 12),
  createWeightPlan("weight_advanced_4days_12weeks", "Perte de poids - Avancé (4j/semaine, 12 semaines)", 4, 12),
  createWeightPlan("weight_advanced_5days_12weeks", "Perte de poids - Avancé (5j/semaine, 12 semaines)", 5, 12),

  // Distance 5K Plans
  createDistancePlan5k("distance_5k_beginner_2days_4weeks", "Objectif 5km - Débutant (2j/semaine, 4 semaines)", "beginner", 2, 4),
  createDistancePlan5k("distance_5k_beginner_3days_8weeks", "Objectif 5km - Débutant (3j/semaine, 8 semaines)", "beginner", 3, 8),
  createDistancePlan5k("distance_5k_intermediate_3days_8weeks", "Objectif 5km - Intermédiaire (3j/semaine, 8 semaines)", "intermediate", 3, 8),
  createDistancePlan5k("distance_5k_intermediate_4days_8weeks", "Objectif 5km - Intermédiaire (4j/semaine, 8 semaines)", "intermediate", 4, 8),
  createDistancePlan5k("distance_5k_advanced_4days_4weeks", "Objectif 5km - Avancé (4j/semaine, 4 semaines)", "advanced", 4, 4),

  // Distance 10K Plans
  createDistancePlan10k("distance_10k_beginner_3days_8weeks", "Objectif 10km - Débutant (3j/semaine, 8 semaines)", "beginner", 3, 8),
  createDistancePlan10k("distance_10k_beginner_3days_12weeks", "Objectif 10km - Débutant (3j/semaine, 12 semaines)", "beginner", 3, 12),
  createDistancePlan10k("distance_10k_intermediate_3days_8weeks", "Objectif 10km - Intermédiaire (3j/semaine, 8 semaines)", "intermediate", 3, 8),
  createDistancePlan10k("distance_10k_intermediate_4days_12weeks", "Objectif 10km - Intermédiaire (4j/semaine, 12 semaines)", "intermediate", 4, 12),
  createDistancePlan10k("distance_10k_advanced_4days_8weeks", "Objectif 10km - Avancé (4j/semaine, 8 semaines)", "advanced", 4, 8),
  createDistancePlan10k("distance_10k_advanced_5days_8weeks", "Objectif 10km - Avancé (5j/semaine, 8 semaines)", "advanced", 5, 8),

  // Distance 20K Plans
  createDistancePlan20k("distance_20k_beginner_3days_12weeks", "Objectif 20km - Débutant (3j/semaine, 12 semaines)", "beginner", 3, 12),
  createDistancePlan20k("distance_20k_intermediate_3days_12weeks", "Objectif 20km - Intermédiaire (3j/semaine, 12 semaines)", "intermediate", 3, 12),
  createDistancePlan20k("distance_20k_intermediate_4days_12weeks", "Objectif 20km - Intermédiaire (4j/semaine, 12 semaines)", "intermediate", 4, 12),
  createDistancePlan20k("distance_20k_advanced_4days_12weeks", "Objectif 20km - Avancé (4j/semaine, 12 semaines)", "advanced", 4, 12),
  createDistancePlan20k("distance_20k_advanced_5days_12weeks", "Objectif 20km - Avancé (5j/semaine, 12 semaines)", "advanced", 5, 12),

  // Semi-Marathon Plans
  createRacePlanSemi("semi_beginner_3days_12weeks", "Semi-marathon - Débutant (3j/semaine, 12 semaines)", "beginner", 3, 12),
  createRacePlanSemi("semi_beginner_4days_16weeks", "Semi-marathon - Débutant (4j/semaine, 16 semaines)", "beginner", 4, 16),
  createRacePlanSemi("semi_intermediate_3days_12weeks", "Semi-marathon - Intermédiaire (3j/semaine, 12 semaines)", "intermediate", 3, 12),
  createRacePlanSemi("semi_intermediate_4days_12weeks", "Semi-marathon - Intermédiaire (4j/semaine, 12 semaines)", "intermediate", 4, 12),
  createRacePlanSemi("semi_advanced_4days_12weeks", "Semi-marathon - Avancé (4j/semaine, 12 semaines)", "advanced", 4, 12),
  createRacePlanSemi("semi_advanced_5days_12weeks", "Semi-marathon - Avancé (5j/semaine, 12 semaines)", "advanced", 5, 12),

  // Marathon Plans
  createRacePlanMarathon("marathon_beginner_4days_16weeks", "Marathon - Débutant (4j/semaine, 16 semaines)", "beginner", 4, 16),
  createRacePlanMarathon("marathon_beginner_5days_16weeks", "Marathon - Débutant (5j/semaine, 16 semaines)", "beginner", 5, 16),
  createRacePlanMarathon("marathon_intermediate_4days_16weeks", "Marathon - Intermédiaire (4j/semaine, 16 semaines)", "intermediate", 4, 16),
  createRacePlanMarathon("marathon_intermediate_5days_16weeks", "Marathon - Intermédiaire (5j/semaine, 16 semaines)", "intermediate", 5, 16),
  createRacePlanMarathon("marathon_advanced_4days_16weeks", "Marathon - Avancé (4j/semaine, 16 semaines)", "advanced", 4, 16),
  createRacePlanMarathon("marathon_advanced_5days_16weeks", "Marathon - Avancé (5j/semaine, 16 semaines)", "advanced", 5, 16),
];

export function getPlanById(id: string): TrainingPlan | undefined {
  return TRAINING_PLANS.find(plan => plan.id === id);
}
