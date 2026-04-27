import { differenceInDays } from "date-fns";

interface RunData {
  started_at: string;
  distance_km: number;
  duration_seconds: number;
  average_heartrate?: number;
}

export interface TrainingLoadResult {
  atl: number;
  ctl: number;
  tsb: number;
  status: "peak" | "optimal" | "tired" | "fresh" | "detraining";
  statusLabel: string;
  statusColor: string;
  statusDescription: string;
  trend: "improving" | "stable" | "declining";
}

function calculateTrimp(run: RunData): number {
  const durationMin = run.duration_seconds / 60;
  const paceSecPerKm = run.distance_km > 0 ? run.duration_seconds / run.distance_km : 360;
  const intensityFactor = Math.min(1.5, Math.max(0.5, 360 / paceSecPerKm));
  return durationMin * intensityFactor;
}

export function calculateTrainingLoad(runs: RunData[]): TrainingLoadResult {
  const now = new Date();

  let atl = 0;
  const atlDecay = 1 - 1 / 7;
  for (let i = 6; i >= 0; i -= 1) {
    const dayRuns = runs.filter((r) => differenceInDays(now, new Date(r.started_at)) === i);
    const dayLoad = dayRuns.reduce((sum, r) => sum + calculateTrimp(r), 0);
    atl = atl * atlDecay + dayLoad * (1 - atlDecay);
  }

  let ctl = 0;
  const ctlDecay = 1 - 1 / 42;
  for (let i = 41; i >= 0; i -= 1) {
    const dayRuns = runs.filter((r) => differenceInDays(now, new Date(r.started_at)) === i);
    const dayLoad = dayRuns.reduce((sum, r) => sum + calculateTrimp(r), 0);
    ctl = ctl * ctlDecay + dayLoad * (1 - ctlDecay);
  }

  const tsb = ctl - atl;

  let status: TrainingLoadResult["status"];
  let statusLabel: string;
  let statusColor: string;
  let statusDescription: string;

  if (ctl < 20) {
    status = "detraining";
    statusLabel = "Desentrainement";
    statusColor = "#9CA3AF";
    statusDescription = "Volume d'entrainement trop faible. Augmentez progressivement.";
  } else if (tsb < -20) {
    status = "tired";
    statusLabel = "Fatigue";
    statusColor = "#ef4444";
    statusDescription = "Charge aigue elevee. Prevoyez une semaine de recuperation.";
  } else if (tsb > 25) {
    status = "fresh";
    statusLabel = "Frais";
    statusColor = "#60a5fa";
    statusDescription = "Bien repose. Ideal avant une competition.";
  } else if (tsb >= -10 && tsb <= 5) {
    status = "peak";
    statusLabel = "Pic de forme";
    statusColor = "#1DB954";
    statusDescription = "Equilibre ideal entre fatigue et forme. Periode optimale pour performer.";
  } else {
    status = "optimal";
    statusLabel = "En progression";
    statusColor = "#fb923c";
    statusDescription = "Bonne charge d'entrainement. Continuez ainsi.";
  }

  const weekAgoRuns = runs.filter((r) => {
    const days = differenceInDays(now, new Date(r.started_at));
    return days <= 14 && days > 7;
  });
  const recentRuns = runs.filter((r) => differenceInDays(now, new Date(r.started_at)) <= 7);
  const recentLoad = recentRuns.reduce((sum, r) => sum + calculateTrimp(r), 0);
  const prevLoad = weekAgoRuns.reduce((sum, r) => sum + calculateTrimp(r), 0);
  const trend: TrainingLoadResult["trend"] =
    recentLoad > prevLoad * 1.05 ? "improving" : recentLoad < prevLoad * 0.95 ? "declining" : "stable";

  return { atl, ctl, tsb, status, statusLabel, statusColor, statusDescription, trend };
}
