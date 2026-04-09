import type { RunRow } from "./database";

export type PredictionResult = {
  model: string;
  description: string;
  predictedSeconds: number;
  confidence: "high" | "medium" | "low";
};

export type RacePrediction = {
  targetDistanceKm: number;
  targetLabel: string;
  predictions: PredictionResult[];
  rangeMinSeconds: number;
  rangeMaxSeconds: number;
  consensusSeconds: number;
};

export const RACE_DISTANCES = [
  { label: "5 km", km: 5 },
  { label: "10 km", km: 10 },
  { label: "20 km", km: 20 },
  { label: "Semi-marathon", km: 21.097 },
  { label: "Marathon", km: 42.195 },
] as const;

const RIEGEL_EXP = 1.06;
const CAMERON_EXP_BASE = 1.07;
const EXTENDED_RIEGEL_EXP = 1.08;

const MIN_DISTANCE_KM = 3;
const MIN_RUNS = 2;

function eligibleRuns(runs: RunRow[]): RunRow[] {
  return runs.filter((r) => r.distance_km > MIN_DISTANCE_KM && r.duration_seconds > 0);
}

function paceSecondsPerKm(r: RunRow): number {
  return r.duration_seconds / r.distance_km;
}

/** Best single performance: fastest pace among eligible runs. */
function bestReferenceRun(runs: RunRow[]): RunRow | null {
  const e = eligibleRuns(runs);
  if (e.length === 0) return null;
  let best = e[0];
  let bestPace = paceSecondsPerKm(best);
  for (let i = 1; i < e.length; i++) {
    const p = paceSecondsPerKm(e[i]);
    if (p < bestPace) {
      bestPace = p;
      best = e[i];
    }
  }
  return best;
}

/** Up to 3 best runs by pace (for extended Riegel). */
function topThreeBestRuns(runs: RunRow[]): RunRow[] {
  const e = [...eligibleRuns(runs)].sort((a, b) => paceSecondsPerKm(a) - paceSecondsPerKm(b));
  return e.slice(0, 3);
}

function distanceConfidence(referenceKm: number, targetKm: number): "high" | "medium" {
  const ratio = referenceKm / targetKm;
  return ratio >= 0.5 && ratio <= 1.5 ? "high" : "medium";
}

function predictRiegel(T1: number, D1: number, D2: number): number {
  return T1 * Math.pow(D2 / D1, RIEGEL_EXP);
}

function predictCameron(T1: number, D1: number, D2: number): number {
  const exp = CAMERON_EXP_BASE - 0.0065 * D2;
  return T1 * Math.pow(D2 / D1, exp);
}

function predictExtendedRiegel(runs: RunRow[], D2: number): { seconds: number; usedCount: number } {
  const top = topThreeBestRuns(runs);
  if (top.length === 0) return { seconds: 0, usedCount: 0 };
  let sum = 0;
  for (const r of top) {
    sum += r.duration_seconds * Math.pow(D2 / r.distance_km, EXTENDED_RIEGEL_EXP);
  }
  return { seconds: sum / top.length, usedCount: top.length };
}

/** Jack Daniels-style VO2 estimate from one race (speed in m/min, T in minutes). */
function estimateVO2(distanceKm: number, durationSeconds: number): number {
  const T = durationSeconds / 60;
  if (T <= 0) return 0;
  const speed = (distanceKm * 1000) / T;
  const speed2 = speed * speed;
  const numerator = -4.6 + 0.182258 * speed + 0.000104 * speed2;
  const denominator =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * T) +
    0.2989558 * Math.exp(-0.1932605 * T);
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

const VDOT_LEVELS = [38, 42, 46, 50, 54] as const;

/** Approximate Daniels equivalent times (seconds) by VDOT — simplified table. */
const TIMES_BY_VDOT: Record<(typeof VDOT_LEVELS)[number], { km: number; sec: number }[]> = {
  38: [
    { km: 5, sec: 1520 },
    { km: 10, sec: 3240 },
    { km: 21.097, sec: 7380 },
    { km: 42.195, sec: 15600 },
  ],
  42: [
    { km: 5, sec: 1380 },
    { km: 10, sec: 2920 },
    { km: 21.097, sec: 6600 },
    { km: 42.195, sec: 13800 },
  ],
  46: [
    { km: 5, sec: 1260 },
    { km: 10, sec: 2660 },
    { km: 21.097, sec: 5940 },
    { km: 42.195, sec: 12200 },
  ],
  50: [
    { km: 5, sec: 1150 },
    { km: 10, sec: 2430 },
    { km: 21.097, sec: 5340 },
    { km: 42.195, sec: 10800 },
  ],
  54: [
    { km: 5, sec: 1050 },
    { km: 10, sec: 2220 },
    { km: 21.097, sec: 4800 },
    { km: 42.195, sec: 9580 },
  ],
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function anchorsForVdot(vdot: number): { km: number; sec: number }[] {
  const clamped = Math.min(54, Math.max(38, vdot));
  if (clamped <= VDOT_LEVELS[0]) {
    return TIMES_BY_VDOT[VDOT_LEVELS[0]].map((x) => ({ ...x }));
  }
  if (clamped >= VDOT_LEVELS[VDOT_LEVELS.length - 1]) {
    return TIMES_BY_VDOT[VDOT_LEVELS[VDOT_LEVELS.length - 1]].map((x) => ({ ...x }));
  }
  let lo = 0;
  for (let i = 0; i < VDOT_LEVELS.length - 1; i++) {
    if (clamped >= VDOT_LEVELS[i] && clamped <= VDOT_LEVELS[i + 1]) {
      lo = i;
      break;
    }
  }
  const v0 = VDOT_LEVELS[lo];
  const v1 = VDOT_LEVELS[lo + 1];
  const t = (clamped - v0) / (v1 - v0);
  const a0 = TIMES_BY_VDOT[v0];
  const a1 = TIMES_BY_VDOT[v1];
  return a0.map((p, i) => ({
    km: p.km,
    sec: lerp(p.sec, a1[i].sec, t),
  }));
}

/** Interpolate / extrapolate time at target distance from standard anchors (simplified Daniels). */
function timeFromDanielsAnchors(targetKm: number, anchors: { km: number; sec: number }[]): number {
  const sorted = [...anchors].sort((a, b) => a.km - b.km);
  if (targetKm <= sorted[0].km) {
    return sorted[0].sec * Math.pow(targetKm / sorted[0].km, RIEGEL_EXP);
  }
  const last = sorted[sorted.length - 1];
  if (targetKm >= last.km) {
    return last.sec * Math.pow(targetKm / last.km, RIEGEL_EXP);
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (targetKm >= a.km && targetKm <= b.km) {
      const u = (targetKm - a.km) / (b.km - a.km);
      return lerp(a.sec, b.sec, u);
    }
  }
  return last.sec;
}

function predictDaniels(reference: RunRow, targetKm: number): number {
  const vo2 = estimateVO2(reference.distance_km, reference.duration_seconds);
  const vdot = Math.min(70, Math.max(30, vo2));
  const anchors = anchorsForVdot(vdot);
  return timeFromDanielsAnchors(targetKm, anchors);
}

export function formatPredictionTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}h ${m}min ${sec}s`;
  }
  if (m > 0) {
    return `${m}min ${sec}s`;
  }
  return `${sec}s`;
}

export function getRacePrediction(
  runs: RunRow[],
  targetDistanceKm: number,
  targetLabel: string,
): RacePrediction | null {
  const eligible = eligibleRuns(runs);
  if (eligible.length < MIN_RUNS) return null;

  const ref = bestReferenceRun(runs);
  if (!ref) return null;

  const D1 = ref.distance_km;
  const T1 = ref.duration_seconds;
  const D2 = targetDistanceKm;

  const distConf = distanceConfidence(D1, D2);

  const riegelSec = predictRiegel(T1, D1, D2);
  const cameronSec = predictCameron(T1, D1, D2);
  const danielsSec = predictDaniels(ref, D2);
  const { seconds: extendedSec, usedCount } = predictExtendedRiegel(runs, D2);

  const extendedConf: "high" | "medium" = usedCount >= 3 ? "high" : "medium";

  const predictions: PredictionResult[] = [
    {
      model: "Riegel",
      description: "Extrapolation classique par loi de puissance (exposant 1,06).",
      predictedSeconds: riegelSec,
      confidence: distConf,
    },
    {
      model: "Cameron",
      description: "Variante avec exposant dépendant de la distance cible (souvent meilleure sur le long).",
      predictedSeconds: cameronSec,
      confidence: distConf,
    },
    {
      model: "Jack Daniels (VO2)",
      description: "Estimation de la consommation d’oxygène puis équivalents chronométriques simplifiés.",
      predictedSeconds: danielsSec,
      confidence: "medium",
    },
    {
      model: "Riegel étendu",
      description: "Moyenne des extrapolations (exposant 1,08) sur vos 3 meilleures courses récentes.",
      predictedSeconds: extendedSec,
      confidence: extendedConf,
    },
  ];

  const secs = predictions.map((p) => p.predictedSeconds).filter((x) => x > 0 && Number.isFinite(x));
  if (secs.length === 0) return null;

  const rangeMinSeconds = Math.min(...secs);
  const rangeMaxSeconds = Math.max(...secs);

  const consensusSeconds =
    0.3 * riegelSec + 0.3 * cameronSec + 0.2 * danielsSec + 0.2 * extendedSec;

  return {
    targetDistanceKm,
    targetLabel,
    predictions,
    rangeMinSeconds,
    rangeMaxSeconds,
    consensusSeconds,
  };
}

export type VO2maxEstimate = {
  value: number;
  level: "very_low" | "low" | "moderate" | "good" | "excellent" | "superior";
  levelLabel: string;
  trend: "up" | "down" | "stable" | null;
  trendValue: number | null;
  basedOnRun: {
    distanceKm: number;
    durationSeconds: number;
    startedAt: string | null;
  } | null;
};

export function estimateVO2maxFromRuns(runs: RunRow[]): VO2maxEstimate | null {
  const eligible = runs.filter((r) => r.distance_km >= 3 && r.duration_seconds > 0);
  if (eligible.length === 0) return null;

  const best = eligible.reduce((a, b) =>
    a.duration_seconds / a.distance_km < b.duration_seconds / b.distance_km ? a : b,
  );

  const vo2 = estimateVO2(best.distance_km, best.duration_seconds);
  const clamped = Math.round(Math.min(85, Math.max(25, vo2)));

  const getLevel = (v: number): VO2maxEstimate["level"] => {
    if (v < 35) return "very_low";
    if (v < 42) return "low";
    if (v < 49) return "moderate";
    if (v < 56) return "good";
    if (v < 63) return "excellent";
    return "superior";
  };

  const levelLabels: Record<VO2maxEstimate["level"], string> = {
    very_low: "Très faible",
    low: "Faible",
    moderate: "Moyen",
    good: "Bon",
    excellent: "Excellent",
    superior: "Supérieur",
  };

  const level = getLevel(clamped);

  const now = Date.now();
  const fourWeeksAgo = now - 28 * 24 * 60 * 60 * 1000;
  const eightWeeksAgo = now - 56 * 24 * 60 * 60 * 1000;

  const recentRuns = eligible.filter(
    (r) => r.started_at && new Date(r.started_at).getTime() >= fourWeeksAgo,
  );
  const olderRuns = eligible.filter((r) => {
    const t = r.started_at ? new Date(r.started_at).getTime() : 0;
    return t >= eightWeeksAgo && t < fourWeeksAgo;
  });

  let trend: VO2maxEstimate["trend"] = null;
  let trendValue: number | null = null;

  if (recentRuns.length > 0 && olderRuns.length > 0) {
    const recentBest = recentRuns.reduce((a, b) =>
      a.duration_seconds / a.distance_km < b.duration_seconds / b.distance_km ? a : b,
    );
    const olderBest = olderRuns.reduce((a, b) =>
      a.duration_seconds / a.distance_km < b.duration_seconds / b.distance_km ? a : b,
    );
    const recentVO2 = Math.round(
      Math.min(85, Math.max(25, estimateVO2(recentBest.distance_km, recentBest.duration_seconds))),
    );
    const olderVO2 = Math.round(
      Math.min(85, Math.max(25, estimateVO2(olderBest.distance_km, olderBest.duration_seconds))),
    );
    const diff = recentVO2 - olderVO2;
    if (Math.abs(diff) >= 1) {
      trend = diff > 0 ? "up" : "down";
      trendValue = Math.abs(diff);
    } else {
      trend = "stable";
      trendValue = 0;
    }
  }

  return {
    value: clamped,
    level,
    levelLabel: levelLabels[level],
    trend,
    trendValue,
    basedOnRun: {
      distanceKm: best.distance_km,
      durationSeconds: best.duration_seconds,
      startedAt: best.started_at,
    },
  };
}
