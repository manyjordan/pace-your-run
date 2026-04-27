export interface TrainingLoadData {
  acuteLoad: number;
  chronicLoad: number;
  acwr: number;
  status: "undertraining" | "optimal" | "overreaching" | "danger";
  statusLabel: string;
  statusColor: string;
  recommendation: string;
}

function calculateTrimp(
  run: {
    duration_seconds: number;
    avg_heart_rate?: number;
    distance_km: number;
  },
  maxHR: number = 190,
): number {
  const durationMin = run.duration_seconds / 60;
  if (run.avg_heart_rate && maxHR > 0) {
    const hrReserve = run.avg_heart_rate / maxHR;
    return durationMin * hrReserve * 1.92;
  }

  const paceMinKm = run.duration_seconds / 60 / run.distance_km;
  const intensity = paceMinKm < 4 ? 1.2 : paceMinKm < 5 ? 1.0 : paceMinKm < 6 ? 0.8 : 0.6;
  return durationMin * intensity;
}

export function calculateTrainingLoad(
  runs: Array<{
    started_at: string;
    duration_seconds: number;
    avg_heart_rate?: number;
    distance_km: number;
  }>,
  maxHR: number = 190,
): TrainingLoadData | null {
  if (!runs || runs.length === 0) return null;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const recentRuns = runs.filter((r) => new Date(r.started_at) >= oneWeekAgo);
  const chronicRuns = runs.filter((r) => {
    const d = new Date(r.started_at);
    return d >= fourWeeksAgo && d < oneWeekAgo;
  });

  const acuteLoad = recentRuns.reduce((sum, run) => sum + calculateTrimp(run, maxHR), 0);
  const chronicWeeklyLoad = chronicRuns.reduce((sum, run) => sum + calculateTrimp(run, maxHR), 0) / 3;
  const acwr = chronicWeeklyLoad > 0 ? acuteLoad / chronicWeeklyLoad : 1;

  let status: TrainingLoadData["status"];
  let statusLabel: string;
  let statusColor: string;
  let recommendation: string;

  if (acwr < 0.8) {
    status = "undertraining";
    statusLabel = "Sous-entrainement";
    statusColor = "#9CA3AF";
    recommendation = "Augmentez progressivement le volume pour maintenir votre forme.";
  } else if (acwr <= 1.3) {
    status = "optimal";
    statusLabel = "Charge optimale";
    statusColor = "#1DB954";
    recommendation = "Vous etes dans la zone ideale. Continuez ainsi !";
  } else if (acwr <= 1.5) {
    status = "overreaching";
    statusLabel = "Surcharge legere";
    statusColor = "#fb923c";
    recommendation = "Reduisez legerement l'intensite cette semaine pour eviter la blessure.";
  } else {
    status = "danger";
    statusLabel = "Risque de blessure";
    statusColor = "#ef4444";
    recommendation = "Charge trop elevee. Prenez 2-3 jours de repos ou course tres facile.";
  }

  return {
    acuteLoad,
    chronicLoad: chronicWeeklyLoad,
    acwr,
    status,
    statusLabel,
    statusColor,
    recommendation,
  };
}
