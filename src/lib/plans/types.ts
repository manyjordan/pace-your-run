export type Intensity = "easy" | "moderate" | "tempo" | "interval" | "race";

export type IntervalSet = {
  reps: number;
  distanceM?: number;
  durationSeconds?: number;
  pace: string;
  recoverySeconds: number;
  recoveryType: "walk" | "jog" | "rest";
  recoveryPace?: string;
};

export type Session = {
  day: string;
  type: string;
  distance: number;
  pace: string;
  duration: number;
  description: string;
  intensity: Intensity;
  warmupMinutes?: number;
  cooldownMinutes?: number;
  intervals?: IntervalSet;
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
export function paceToMinutes(pace: string): number {
  const [m, s] = pace.split(":").map(Number);
  return m + s / 60;
}

// Helper to calculate duration in minutes
export function calculateDuration(distance: number, pace: string): number {
  return Math.round(distance * paceToMinutes(pace));
}

// Generate weeks with progressive overload
export function generateWeeklyTemplate(
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
export function minusSeconds(pace: string, seconds: number): string {
  const [m, s] = pace.split(":").map(Number);
  let totalSeconds = m * 60 + s - seconds;
  if (totalSeconds < 0) totalSeconds = 0;
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function addSeconds(pace: string, seconds: number): string {
  const [m, s] = pace.split(":").map(Number);
  const totalSeconds = m * 60 + s + seconds;
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

// Generate complete schedule for a plan
export function generateSchedule(
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
