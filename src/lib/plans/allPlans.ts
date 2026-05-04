import type {
  PlanDistance,
  PlanLevel,
  PlanSession,
  PlanSessionType,
  PlanWeek,
  TrainingPlan,
} from "./types";
import { estimateSessionMinutes } from "./types";

const DEFAULT_EQUIPMENT = [
  "Montre GPS pour suivre l'allure",
  "Bouteille ou ceinture d'hydratation au-delà de 60–75 min",
  "Chaussures adaptées au bitume et à votre foulée",
];

const DEFAULT_NUTRITION = [
  "Hydratez-vous avant la soif sur les séances longues",
  "Repas équilibré (glucides + protéines) dans l'heure après l'effort",
  "Dormir 7–8 h les semaines de volume élevé",
];

const DEFAULT_SHOES = [
  "Alternez deux paires si vous courez souvent sur le bitume",
  "Surveillez l'usure tous les 500–700 km",
];

type Paces = {
  easy: string;
  tempo: string;
  long: string;
  interval: string;
};

function roundKm(n: number): number {
  return Math.round(n * 10) / 10;
}

function mk(
  day: string,
  type: PlanSessionType,
  label: string,
  description: string,
  distance: number,
  pace: string,
  intensity: PlanSession["intensity"],
): PlanSession {
  const d = roundKm(distance);
  return {
    day,
    type,
    label,
    description,
    distance: d,
    pace,
    intensity,
    duration: estimateSessionMinutes(d, pace),
  };
}

function phaseForWeek(weekNumber: number, totalWeeks: number): PlanWeek["phase"] {
  if (weekNumber > totalWeeks - 2) return "taper";
  if (weekNumber >= totalWeeks - 4) return "peak";
  const t = weekNumber / totalWeeks;
  if (t <= 0.38) return "base";
  return "build";
}

function focusFor(phase: PlanWeek["phase"], weekNumber: number): string {
  if (phase === "taper") return "Affûtage — volume en baisse, fraîcheur avant la course";
  if (phase === "peak") return "Pic — volume maximal contrôlé, qualité ciblée";
  if (phase === "base") return "Base — allure facile, régularité et durée";
  return `Construction — semaine ${weekNumber}, progression maîtrisée`;
}

/** Weekly km curve: ramp to peak, optional recovery dips, 2-week taper */
function makeKmSeries(
  weeks: number,
  startKm: number,
  peakKm: number,
  opts?: { recoverMod?: number },
): number[] {
  const recoverMod = opts?.recoverMod ?? 0.88;
  const out: number[] = [];
  const taperStart = weeks - 1;
  for (let w = 1; w <= weeks; w++) {
    if (w >= taperStart) {
      const peakProxy = out[w - 2] ?? peakKm;
      if (w === taperStart) out.push(Math.round(peakProxy * 0.58));
      else out.push(Math.round(peakProxy * 0.36));
      continue;
    }
    const rampEnd = Math.max(2, Math.floor(weeks * 0.72));
    let km: number;
    if (w <= rampEnd) {
      const t = (w - 1) / Math.max(1, rampEnd - 1);
      km = startKm + (peakKm - startKm) * t;
    } else {
      km = peakKm * (0.96 + 0.04 * Math.sin((w - rampEnd) * 0.8));
    }
    if (w % 4 === 0 && w < taperStart - 1) km *= recoverMod;
    out.push(Math.max(startKm * 0.85, Math.round(km)));
  }
  return out;
}

function splitLongRemainder(weeklyKm: number, long: number, parts: number): number[] {
  const rest = Math.max(0, weeklyKm - long);
  const base = rest / parts;
  const arr = Array.from({ length: parts }, () => base);
  const drift = rest - base * parts;
  if (parts > 0) arr[parts - 1] += drift;
  return arr.map(roundKm);
}

function buildWeek(
  weekNumber: number,
  totalWeeks: number,
  weeklyKm: number,
  spw: 3 | 4 | 5,
  paces: Paces,
  longCap: number,
  quality: "low" | "mid" | "high",
  distance: PlanDistance,
): PlanWeek {
  const phase = phaseForWeek(weekNumber, totalWeeks);
  const longFrac = spw >= 5 ? 0.36 : spw === 4 ? 0.4 : 0.48;
  let long = Math.min(weeklyKm * longFrac, longCap);
  long = roundKm(long);
  const remainder = Math.max(0, weeklyKm - long);
  const sessions: PlanSession[] = [];
  const wantQuality =
    quality !== "low" && weekNumber % 4 !== 0 && weekNumber < totalWeeks - 1 && phase !== "taper";

  if (spw === 3) {
    const [a, b] = splitLongRemainder(weeklyKm, long, 2);
    sessions.push(
      mk("Mar", "easy", "Course facile", "Endurance fondamentale, respiration aisée", a, paces.easy, "easy"),
    );
    if (wantQuality && quality === "high") {
      sessions.push(
        mk(
          "Jeu",
          "interval",
          "Intervalles courts",
          "Échauffement 15′ puis répétitions courtes à allure soutenue, récup active",
          b,
          paces.interval,
          "hard",
        ),
      );
    } else if (wantQuality) {
      sessions.push(
        mk("Jeu", "tempo", "Tempo", "Bloc continu confortablement dur, au seuil bas", b, paces.tempo, "moderate"),
      );
    } else {
      sessions.push(
        mk("Jeu", "easy", "Course facile", "Même allure que mardi, conversation possible", b, paces.easy, "easy"),
      );
    }
    sessions.push(
      mk(
        "Dim",
        "long",
        "Sortie longue",
        distance === "marathon"
          ? "Allure très facile, hydratez, derniers km encore plus calmes"
          : "Allure facile stable, gestion de l'effort sur la durée",
        long,
        paces.long,
        "easy",
      ),
    );
  } else if (spw === 4) {
    const [e1, e2, e3] = splitLongRemainder(weeklyKm, long, 3);
    sessions.push(
      mk("Mar", "easy", "Course facile", "Footing aérobie, pas de montée de lactate", e1, paces.easy, "easy"),
    );
    if (wantQuality && quality !== "low") {
      sessions.push(
        mk("Jeu", "tempo", "Tempo", "20–40′ à allure seuil bas, récup intégrée dans la séance", e2, paces.tempo, "moderate"),
      );
    } else {
      sessions.push(
        mk("Jeu", "easy", "Course facile", "Régularité, cadence naturelle", e2, paces.easy, "easy"),
      );
    }
    sessions.push(
      mk("Sam", "easy", "Récup active", "Très facile, circulation et sensation des jambes", e3, paces.easy, "easy"),
    );
    sessions.push(
      mk("Dim", "long", "Sortie longue", "Construire la résistance, alimentation testée si besoin", long, paces.long, "easy"),
    );
  } else {
    const r = remainder;
    if (wantQuality) {
      const mar = roundKm(r * 0.24);
      const inter = roundKm(r * 0.2);
      const jeu = roundKm(r * 0.2);
      const ven = roundKm(r * 0.16);
      const drift = roundKm(r - mar - inter - jeu - ven);
      sessions.push(
        mk("Mar", "easy", "Course facile", "Démarrage en douceur, zones basses", mar + drift * 0.5, paces.easy, "easy"),
      );
      sessions.push(
        mk(
          "Mer",
          "interval",
          "Intervalles",
          "Fractionné court : vitesse contrôlée, récup complète entre les répétitions",
          inter,
          paces.interval,
          "hard",
        ),
      );
      sessions.push(
        mk("Jeu", "easy", "Récupération", "Jogging très léger après la qualité", jeu, paces.easy, "easy"),
      );
      sessions.push(
        mk("Ven", "tempo", "Tempo", "Bloc unique à allure marathon ou seuil selon objectif", ven + drift * 0.5, paces.tempo, "moderate"),
      );
    } else {
      const q = splitLongRemainder(weeklyKm, long, 4);
      sessions.push(
        mk("Mar", "easy", "Course facile", "Démarrage en douceur, zones basses", q[0] ?? r * 0.25, paces.easy, "easy"),
      );
      sessions.push(
        mk("Mer", "easy", "Course facile", "Volume modéré, même discipline d'allure", q[1] ?? r * 0.25, paces.easy, "easy"),
      );
      sessions.push(
        mk("Jeu", "easy", "Footing", "Relance courte si bonne sensation", q[2] ?? r * 0.25, paces.easy, "easy"),
      );
      sessions.push(
        mk("Ven", "easy", "Préparation", "Avant le week-end, rester frais pour la longue", q[3] ?? r * 0.25, paces.easy, "easy"),
      );
    }
    sessions.push(
      mk("Dim", "long", "Sortie longue", "Partie clé de la semaine, hydratation et mental", long, paces.long, "easy"),
    );
  }

  const totalDistance = roundKm(sessions.reduce((s, x) => s + x.distance, 0));
  return {
    weekNumber,
    week: weekNumber,
    phase,
    totalDistance,
    focus: focusFor(phase, weekNumber),
    sessions,
  };
}

function buildRacePlan(def: {
  id: string;
  distance: PlanDistance;
  level: PlanLevel;
  name: string;
  description: string;
  emoji: string;
  targetTime?: string;
  weeks: number;
  spw: 3 | 4 | 5;
  goal: "race" | "distance";
  legacyLevel: "beginner" | "intermediate" | "advanced";
  targetDistance: NonNullable<TrainingPlan["targetDistance"]>;
  paces: Paces;
  startKm: number;
  peakKm: number;
  longCap: number;
  quality: "low" | "mid" | "high";
  recoverMod?: number;
}): TrainingPlan {
  const km = makeKmSeries(def.weeks, def.startKm, def.peakKm, { recoverMod: def.recoverMod });
  const weeklySchedule = km.map((kmW, i) =>
    buildWeek(i + 1, def.weeks, kmW, def.spw, def.paces, def.longCap, def.quality, def.distance),
  );
  return {
    id: def.id,
    distance: def.distance,
    level: def.level,
    name: def.name,
    description: def.description,
    emoji: def.emoji,
    targetTime: def.targetTime,
    durationWeeks: def.weeks,
    sessionsPerWeek: def.spw,
    daysPerWeek: def.spw,
    weeklySchedule,
    goal: def.goal,
    summary: def.description,
    legacyLevel: def.legacyLevel,
    targetDistance: def.targetDistance,
    equipmentTips: DEFAULT_EQUIPMENT,
    nutritionTips: DEFAULT_NUTRITION,
    shoeTips: DEFAULT_SHOES,
  };
}

function buildRegularRunning(): TrainingPlan {
  const weeks = 12;
  const spw: 3 | 4 | 5 = 3;
  const paces: Paces = {
    easy: "6:20-6:50",
    tempo: "5:45-6:05",
    long: "6:15-6:45",
    interval: "5:20-5:40",
  };
  const km = makeKmSeries(weeks, 14, 34, { recoverMod: 0.9 });
  const weeklySchedule = km.map((kmW, i) => {
    const wn = i + 1;
    const phase = phaseForWeek(wn, weeks);
    const [a, b] = splitLongRemainder(kmW, Math.min(kmW * 0.45, 16), 2);
    const sessions: PlanSession[] = [
      mk("Mar", "easy", "Course facile", "Habitude et plaisir, intensité basse", a, paces.easy, "easy"),
      mk("Jeu", "easy", "Sortie modérée", "Un cran au-dessus du facile mais sans forcer", b, paces.easy, "easy"),
      mk(
        "Dim",
        "long",
        "Sortie longue",
        "Durée progressive, privilégier la régularité au chrono",
        roundKm(kmW - a - b),
        paces.long,
        "easy",
      ),
    ];
    const totalDistance = roundKm(sessions.reduce((s, x) => s + x.distance, 0));
    return {
      weekNumber: wn,
      week: wn,
      phase,
      totalDistance,
      focus: focusFor(phase, wn),
      sessions,
    };
  });

  return {
    id: "regular_running",
    distance: "regular",
    level: "finisher",
    name: "Courir régulièrement",
    description: "3 sorties par semaine pour ancrer une routine durable",
    emoji: "🏃",
    durationWeeks: weeks,
    sessionsPerWeek: spw,
    daysPerWeek: spw,
    weeklySchedule,
    goal: "weight",
    summary: "Plan général pour courir 3 fois par semaine avec progression douce du volume.",
    legacyLevel: "beginner",
    equipmentTips: DEFAULT_EQUIPMENT,
    nutritionTips: DEFAULT_NUTRITION,
    shoeTips: DEFAULT_SHOES,
  };
}

// —— Marathon ——
export const marathonFinisher = buildRacePlan({
  id: "marathon_finisher",
  distance: "marathon",
  level: "finisher",
  name: "Marathon Finisher",
  description: "Terminez votre premier marathon en toute sécurité",
  emoji: "🥉",
  targetTime: "4h30-5h",
  weeks: 16,
  spw: 4,
  goal: "race",
  legacyLevel: "beginner",
  targetDistance: "marathon",
  paces: {
    easy: "6:15-6:45",
    tempo: "5:50-6:10",
    long: "6:30-7:00",
    interval: "5:35-5:55",
  },
  startKm: 30,
  peakKm: 54,
  longCap: 32,
  quality: "low",
});

export const marathonSub4h = buildRacePlan({
  id: "marathon_sub4h",
  distance: "marathon",
  level: "performance",
  name: "Marathon Sub 4h",
  description: "Franchissez la barre des 4 heures avec un rythme structuré",
  emoji: "🥈",
  targetTime: "3h45-4h00",
  weeks: 16,
  spw: 4,
  goal: "race",
  legacyLevel: "intermediate",
  targetDistance: "marathon",
  paces: {
    easy: "5:50-6:15",
    tempo: "5:05-5:20",
    long: "5:45-6:05",
    interval: "4:50-5:05",
  },
  startKm: 34,
  peakKm: 62,
  longCap: 36,
  quality: "mid",
});

export const marathonSub3h30 = buildRacePlan({
  id: "marathon_sub3h30",
  distance: "marathon",
  level: "competitor",
  name: "Marathon Sub 3h30",
  description: "Volume élevé et séances spécifiques pour viser 3h15-3h30",
  emoji: "🥇",
  targetTime: "3h15-3h30",
  weeks: 18,
  spw: 5,
  goal: "race",
  legacyLevel: "advanced",
  targetDistance: "marathon",
  paces: {
    easy: "5:25-5:45",
    tempo: "4:45-5:00",
    long: "5:15-5:35",
    interval: "4:25-4:40",
  },
  startKm: 40,
  peakKm: 78,
  longCap: 40,
  quality: "high",
});

export const marathonSub3h = buildRacePlan({
  id: "marathon_sub3h",
  distance: "marathon",
  level: "elite",
  name: "Marathon Sub 3h",
  description: "Plan exigeant pour coureurs expérimentés visant moins de 3h",
  emoji: "⚡",
  targetTime: "2h50-3h00",
  weeks: 20,
  spw: 5,
  goal: "race",
  legacyLevel: "advanced",
  targetDistance: "marathon",
  paces: {
    easy: "4:55-5:15",
    tempo: "4:20-4:35",
    long: "4:45-5:05",
    interval: "4:00-4:15",
  },
  startKm: 48,
  peakKm: 92,
  longCap: 44,
  quality: "high",
  recoverMod: 0.86,
});

// —— Semi ——
export const semiFinisher = buildRacePlan({
  id: "semi_finisher",
  distance: "semi",
  level: "finisher",
  name: "Semi-marathon Finisher",
  description: "Préparez votre premier 21 km avec progression prudente",
  emoji: "🥉",
  targetTime: "2h15-2h30",
  weeks: 12,
  spw: 3,
  goal: "race",
  legacyLevel: "beginner",
  targetDistance: "semi",
  paces: {
    easy: "6:10-6:35",
    tempo: "5:40-5:55",
    long: "6:00-6:25",
    interval: "5:25-5:40",
  },
  startKm: 22,
  peakKm: 44,
  longCap: 20,
  quality: "low",
});

export const semiSub2h = buildRacePlan({
  id: "semi_sub2h",
  distance: "semi",
  level: "performance",
  name: "Semi Sub 2h",
  description: "Objectif chrono sous les 2 heures",
  emoji: "🥈",
  targetTime: "1h50-2h00",
  weeks: 12,
  spw: 4,
  goal: "race",
  legacyLevel: "intermediate",
  targetDistance: "semi",
  paces: {
    easy: "5:35-5:55",
    tempo: "4:55-5:10",
    long: "5:20-5:40",
    interval: "4:40-4:55",
  },
  startKm: 26,
  peakKm: 52,
  longCap: 22,
  quality: "mid",
});

export const semiSub1h45 = buildRacePlan({
  id: "semi_sub1h45",
  distance: "semi",
  level: "competitor",
  name: "Semi Sub 1h45",
  description: "Allures soutenues et volume pour viser 1h40-1h45",
  emoji: "🥇",
  targetTime: "1h38-1h45",
  weeks: 12,
  spw: 5,
  goal: "race",
  legacyLevel: "advanced",
  targetDistance: "semi",
  paces: {
    easy: "5:10-5:30",
    tempo: "4:35-4:50",
    long: "4:55-5:10",
    interval: "4:15-4:30",
  },
  startKm: 30,
  peakKm: 58,
  longCap: 24,
  quality: "high",
});

export const semiSub1h30 = buildRacePlan({
  id: "semi_sub1h30",
  distance: "semi",
  level: "elite",
  name: "Semi Sub 1h30",
  description: "Plan haute intensité pour coureurs confirmés",
  emoji: "⚡",
  targetTime: "1h25-1h30",
  weeks: 12,
  spw: 5,
  goal: "race",
  legacyLevel: "advanced",
  targetDistance: "semi",
  paces: {
    easy: "4:45-5:05",
    tempo: "4:10-4:25",
    long: "4:35-4:50",
    interval: "3:55-4:10",
  },
  startKm: 34,
  peakKm: 64,
  longCap: 26,
  quality: "high",
  recoverMod: 0.86,
});

// —— 10 km ——
export const tenkmFinisher = buildRacePlan({
  id: "10k_finisher",
  distance: "10k",
  level: "finisher",
  name: "10 km Finisher",
  description: "Votre premier 10 km bien préparé",
  emoji: "🥉",
  targetTime: "60-65 min",
  weeks: 8,
  spw: 3,
  goal: "race",
  legacyLevel: "beginner",
  targetDistance: "10k",
  paces: {
    easy: "6:05-6:30",
    tempo: "5:35-5:50",
    long: "5:55-6:15",
    interval: "5:20-5:35",
  },
  startKm: 16,
  peakKm: 32,
  longCap: 14,
  quality: "low",
});

export const tenkmSub55 = buildRacePlan({
  id: "10k_sub55",
  distance: "10k",
  level: "performance",
  name: "10 km Sub 55",
  description: "Travail de seuil et vitesse pour descendre sous 55′",
  emoji: "🥈",
  targetTime: "50-55 min",
  weeks: 8,
  spw: 4,
  goal: "race",
  legacyLevel: "intermediate",
  targetDistance: "10k",
  paces: {
    easy: "5:40-6:00",
    tempo: "5:00-5:15",
    long: "5:25-5:40",
    interval: "4:45-5:00",
  },
  startKm: 18,
  peakKm: 38,
  longCap: 15,
  quality: "mid",
});

export const tenkmSub45 = buildRacePlan({
  id: "10k_sub45",
  distance: "10k",
  level: "competitor",
  name: "10 km Sub 45",
  description: "Volume modéré mais séances nerveuses pour viser 42–45′",
  emoji: "🥇",
  targetTime: "42-45 min",
  weeks: 8,
  spw: 4,
  goal: "race",
  legacyLevel: "advanced",
  targetDistance: "10k",
  paces: {
    easy: "5:15-5:35",
    tempo: "4:35-4:50",
    long: "4:55-5:10",
    interval: "4:15-4:30",
  },
  startKm: 22,
  peakKm: 44,
  longCap: 16,
  quality: "high",
});

export const tenkmSub40 = buildRacePlan({
  id: "10k_sub40",
  distance: "10k",
  level: "elite",
  name: "10 km Sub 40",
  description: "Plan exigeant pour 10 km rapides",
  emoji: "⚡",
  targetTime: "38-40 min",
  weeks: 8,
  spw: 5,
  goal: "race",
  legacyLevel: "advanced",
  targetDistance: "10k",
  paces: {
    easy: "4:50-5:10",
    tempo: "4:10-4:25",
    long: "4:35-4:50",
    interval: "3:50-4:05",
  },
  startKm: 24,
  peakKm: 48,
  longCap: 16,
  quality: "high",
  recoverMod: 0.86,
});

// —— 5 km ——
export const fivekmFinisher = buildRacePlan({
  id: "5k_finisher",
  distance: "5k",
  level: "finisher",
  name: "5 km Finisher",
  description: "Découvrir la vitesse sur 5 km en restant prudent",
  emoji: "🥉",
  targetTime: "32-35 min",
  weeks: 6,
  spw: 3,
  goal: "race",
  legacyLevel: "beginner",
  targetDistance: "5k",
  paces: {
    easy: "6:00-6:25",
    tempo: "5:30-5:45",
    long: "5:45-6:05",
    interval: "5:10-5:25",
  },
  startKm: 12,
  peakKm: 22,
  longCap: 10,
  quality: "low",
});

export const fivekmSub30 = buildRacePlan({
  id: "5k_sub30",
  distance: "5k",
  level: "performance",
  name: "5 km Sub 30",
  description: "Fractionné et tempo pour viser 28–30′",
  emoji: "🥈",
  targetTime: "28-30 min",
  weeks: 6,
  spw: 4,
  goal: "race",
  legacyLevel: "intermediate",
  targetDistance: "5k",
  paces: {
    easy: "5:35-5:55",
    tempo: "4:55-5:10",
    long: "5:15-5:30",
    interval: "4:35-4:50",
  },
  startKm: 14,
  peakKm: 26,
  longCap: 11,
  quality: "mid",
});

export const fivekmSub25 = buildRacePlan({
  id: "5k_sub25",
  distance: "5k",
  level: "competitor",
  name: "5 km Sub 25",
  description: "Spécifique vitesse pour coureurs aguerris",
  emoji: "🥇",
  targetTime: "23-25 min",
  weeks: 6,
  spw: 4,
  goal: "race",
  legacyLevel: "advanced",
  targetDistance: "5k",
  paces: {
    easy: "5:05-5:25",
    tempo: "4:25-4:40",
    long: "4:45-5:00",
    interval: "4:00-4:15",
  },
  startKm: 16,
  peakKm: 28,
  longCap: 11,
  quality: "high",
});

export const regularRunning = buildRegularRunning();

export const ALL_PLANS: TrainingPlan[] = [
  marathonFinisher,
  marathonSub4h,
  marathonSub3h30,
  marathonSub3h,
  semiFinisher,
  semiSub2h,
  semiSub1h45,
  semiSub1h30,
  tenkmFinisher,
  tenkmSub55,
  tenkmSub45,
  tenkmSub40,
  fivekmFinisher,
  fivekmSub30,
  fivekmSub25,
  regularRunning,
];

const LEGACY_PLAN_IDS: Record<string, string> = {
  marathon_beginner_4days_16weeks: "marathon_finisher",
  semi_beginner_3days_16weeks: "semi_finisher",
  distance_10k_beginner_3days_12weeks: "10k_finisher",
  distance_10k_intermediate_4days_12weeks: "10k_sub55",
  distance_10k_advanced_5days_8weeks: "10k_sub40",
  weight_beginner_3days_8weeks: "regular_running",
  weight_intermediate_4days_12weeks: "regular_running",
};

export function getPlanById(id: string): TrainingPlan | undefined {
  const direct = ALL_PLANS.find((p) => p.id === id);
  if (direct) return direct;
  const mapped = LEGACY_PLAN_IDS[id];
  return mapped ? ALL_PLANS.find((p) => p.id === mapped) : undefined;
}

export function getPlansForDistance(distance: PlanDistance): TrainingPlan[] {
  return ALL_PLANS.filter((p) => p.distance === distance);
}
