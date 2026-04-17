import type { RunRow } from "@/lib/database";
import { Route, Clock, Mountain } from "lucide-react";
import { format, getMonth, getYear } from "date-fns";
import { fr } from "date-fns/locale";

export type MetricKind = "distance" | "duration" | "elevation";

/** Supported time windows for dashboard metric charts (buildMetricData). */
export type MetricChartPeriod = "1m" | "3m" | "6m" | "1y" | "all";
export type AggregationUnit = "week" | "month" | "quarter";

export function getAggregationUnit(period: MetricChartPeriod): AggregationUnit {
  if (period === "all") return "quarter";
  if (period === "1y") return "month";
  return "week";
}

function runActivityDate(run: RunRow): string {
  return run.started_at ?? run.created_at ?? new Date().toISOString();
}

function inferMetricKind(title: string): MetricKind {
  if (title.includes("Distance")) return "distance";
  if (title.includes("Durée")) return "duration";
  return "elevation";
}

type WeeklyMetricCard = {
  title: string;
  unit: string;
  currentValue: string;
  change: string;
  icon: typeof Route;
  color: string;
  metricKind: MetricKind;
  chartData: Array<{ week: string; value: number; showTick?: boolean; barLabel?: string }>;
  comment: string;
  granularity?: "week" | "month" | "quarter";
  period?: MetricChartPeriod;
};

type GoalSummaryData = {
  goalType: "weight" | "race" | "distance";
  raceType: "marathon" | "semi" | "20k" | "10k" | "5k" | "other";
  raceDistanceKm: string;
  raceTargetDate: string;
  raceTargetTime: string;
  distanceKm?: string;
  targetWeightKg?: string;
};

type UpcomingSession = {
  type: string;
  distance: string;
  pace: string;
  day: string;
  color: string;
};

const upcomingSessions = [
  { type: "Sortie tempo", distance: "8km", pace: "4:45/km", day: "Demain", color: "hsl(var(--lime))" },
  { type: "Récupération facile", distance: "5km", pace: "5:30/km", day: "Mercredi", color: "hsl(38, 92%, 50%)" },
  { type: "Intervalles", distance: "10km", pace: "4:15/km", day: "Vendredi", color: "hsl(0, 72%, 51%)" },
];

export function getStartOfWeek(input: Date) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

export function getMetricAmountForKind(kind: MetricKind, runs: RunRow[]) {
  if (kind === "distance") {
    return runs.reduce((sum, run) => sum + run.distance_km, 0);
  }
  if (kind === "duration") {
    return runs.reduce((sum, run) => sum + run.duration_seconds / 3600, 0);
  }
  return runs.reduce((sum, run) => sum + (run.elevation_gain ?? 0), 0);
}

export function getMetricAmountForTitle(title: string, runs: RunRow[]) {
  return getMetricAmountForKind(inferMetricKind(title), runs);
}

export function formatWeeklyGrowthSummary(kind: MetricKind, runs: RunRow[]) {
  const currentWeekStart = getStartOfWeek(new Date());
  const weeklyValues = Array.from({ length: 4 }, (_, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (3 - index) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekRuns = runs.filter((run) => {
      const activityDate = new Date(runActivityDate(run));
      return activityDate >= weekStart && activityDate < weekEnd;
    });

    return getMetricAmountForKind(kind, weekRuns);
  });

  const baseline = weeklyValues[0];
  const current = weeklyValues[weeklyValues.length - 1];

  if (weeklyValues.every((value) => value === 0)) {
    return "0% / sem sur 3 sem";
  }

  if (baseline <= 0) {
    return current > 0
      ? "+100% / sem sur 3 sem"
      : "0% / sem sur 3 sem";
  }

  const weeklyRate = Math.pow(Math.max(current, 0.0001) / baseline, 1 / 3) - 1;
  const percentage = Math.round(weeklyRate * 100);

  if (percentage >= 0) {
    return `+${percentage}% / sem sur 3 sem`;
  }

  return `${percentage}% / sem sur 3 sem`;
}

export function formatMetricBarLabelForKind(kind: MetricKind, value: number) {
  if (value === 0) return "";
  if (kind === "distance") return `${Math.round(value)}`;
  if (kind === "duration") return `${Math.round(value)}`;
  return `${Math.round(value)}`;
}

export function formatMetricBarLabel(title: string, value: number) {
  return formatMetricBarLabelForKind(inferMetricKind(title), value);
}

export function formatDistanceTooltipValue(value: number) {
  return `${value.toFixed(1).replace(".", ",")} km`;
}

export function formatHoursTooltipValue(value: number) {
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

export function formatDashboardTooltipForKind(kind: MetricKind, value: number): [string, string] {
  if (kind === "distance") {
    return [formatDistanceTooltipValue(value), "Distance en km"];
  }

  if (kind === "duration") {
    return [formatHoursTooltipValue(value), "Durée en heure et minutes"];
  }

  return [`${Math.round(value)} m`, "Dénivelé en mètres"];
}

export function formatDashboardTooltip(title: string, value: number): [string, string] {
  return formatDashboardTooltipForKind(inferMetricKind(title), value);
}

/** Short label above bars (strip redundant unit suffix where it matches the tooltip). */
export function compactWeeklyBarTopLabel(kind: MetricKind, barLabel: string) {
  if (!barLabel) return "";
  if (kind === "distance") return barLabel.replace(" km", "");
  if (kind === "elevation") return barLabel.replace(" m", "");
  return barLabel;
}

export function formatWeeklyDurationLabel(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes}min`;
  }

  return `${hours}h${String(minutes).padStart(2, "0")}min`;
}

export function formatAxisDateLabel(
  start: Date,
  granularity: "week" | "month" | "quarter",
  _period: MetricChartPeriod,
) {
  if (granularity === "month") {
    return format(start, "MMM yy", { locale: fr })
      .replace(".", "")
      .replace(/^./, (c) => c.toUpperCase());
  }
  if (granularity === "quarter") {
    const quarter = Math.floor(getMonth(start) / 3) + 1;
    return `T${quarter} ${getYear(start)}`;
  }
  const month = format(start, "MMM", { locale: fr }).replace(".", "");
  return `${start.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}

export function trimLeadingZeroPeriods<T extends { value: number }>(series: T[]) {
  const firstNonZeroIndex = series.findIndex((item) => item.value > 0);
  if (firstNonZeroIndex === -1) return series;
  return series.slice(firstNonZeroIndex);
}

export function getAdaptiveTickStep(
  length: number,
  granularity: "week" | "month" | "quarter",
  period?: MetricChartPeriod,
) {
  if (granularity === "week" && (period === "1y" || period === "all")) return 4;
  if (granularity === "month" && (period === "1y" || period === "all")) return 3;
  if (granularity === "quarter") return 1;
  if (granularity === "month") {
    if (length > 18) return 4;
    if (length > 12) return 3;
    if (length > 8) return 2;
    return 1;
  }

  if (length > 52) return 8;
  if (length > 36) return 6;
  if (length > 24) return 4;
  if (length > 16) return 3;
  if (length > 10) return 2;
  return 1;
}

export function annotateAdaptiveTicks<T extends { year?: string }>(
  series: T[],
  granularity: "week" | "month" | "quarter",
  period?: MetricChartPeriod,
) {
  const step = getAdaptiveTickStep(series.length, granularity, period);
  return series.map((item, index) => {
    return {
      ...item,
      showTick: index === 0 || index === series.length - 1 || index % step === 0,
    };
  });
}

export function buildWeeklyInsight(metrics: WeeklyMetricCard[]) {
  if (metrics.length === 0) return "";

  const getMetricValues = (metric: WeeklyMetricCard) =>
    metric.chartData.length > 1
      ? {
          current: metric.chartData[metric.chartData.length - 1].value,
          previous: metric.chartData[metric.chartData.length - 2].value,
        }
      : {
          current: metric.chartData[metric.chartData.length - 1]?.value || 0,
          previous: 0,
        };

  const distanceVals = getMetricValues(metrics[0]);
  const durationVals = getMetricValues(metrics[1]);
  const elevationVals = getMetricValues(metrics[2]);

  const noActivity = distanceVals.current === 0 && durationVals.current === 0 && elevationVals.current === 0;
  const lowVolume = distanceVals.current <= 15 && durationVals.current <= 2.5;
  const stableDistance = Math.abs(distanceVals.current - distanceVals.previous) <= 3;
  const stableDuration = Math.abs(durationVals.current - durationVals.previous) <= 0.5;
  const stableElevation = Math.abs(elevationVals.current - elevationVals.previous) <= 80;
  const upMeaningfully =
    distanceVals.current - distanceVals.previous >= 5 ||
    durationVals.current - durationVals.previous >= 1 ||
    elevationVals.current - elevationVals.previous >= 100;
  const downMeaningfully =
    distanceVals.previous > 0 &&
    (distanceVals.previous - distanceVals.current >= 5 ||
      durationVals.previous - durationVals.current >= 1 ||
      elevationVals.previous - elevationVals.current >= 100);

  if (noActivity) {
    return "Semaine vide pour l'instant. Une sortie facile suffirait à relancer la dynamique.";
  }

  if (lowVolume) {
    return "Semaine légère pour l'instant. Une ou deux séances bien posées feront déjà la différence.";
  }

  if (stableDistance && stableDuration && stableElevation) {
    return "Semaine assez stable. Continue sur ce rythme.";
  }

  if (upMeaningfully && !downMeaningfully) {
    return "Bonne dynamique cette semaine. Le volume monte proprement.";
  }

  if (downMeaningfully) {
    return "Semaine plus légère que la précédente. Utile si tu es dans une phase de récupération.";
  }

  return "Semaine constructive. Continue à empiler les séances utiles.";
}

export function buildMetricData(
  title: string,
  runs: RunRow[],
  granularity: "week" | "month" | "quarter",
  period: MetricChartPeriod,
  metricKind?: MetricKind,
): WeeklyMetricCard {
  const kind = metricKind ?? inferMetricKind(title);
  const now = new Date();
  let startDate = new Date();

  if (period === "1m") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === "3m") {
    startDate.setMonth(now.getMonth() - 3);
  } else if (period === "6m") {
    startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  } else if (period === "1y") {
    startDate.setFullYear(now.getFullYear() - 1);
  } else {
    startDate = new Date("2000-01-01");
  }

  const filteredRuns = runs.filter((run) => {
    const actDate = new Date(runActivityDate(run));
    return actDate >= startDate && actDate <= now;
  });

  const effectiveGranularity = getAggregationUnit(period);

  const makeWeekStart = (date: Date) => getStartOfWeek(date);
  const makeMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const makeQuarterStart = (date: Date) => new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
  const addUnit = (date: Date, unit: AggregationUnit) => {
    const d = new Date(date);
    if (unit === "week") d.setDate(d.getDate() + 7);
    if (unit === "month") d.setMonth(d.getMonth() + 1);
    if (unit === "quarter") d.setMonth(d.getMonth() + 3);
    return d;
  };
  const startForUnit = (date: Date, unit: AggregationUnit) => {
    if (unit === "week") return makeWeekStart(date);
    if (unit === "month") return makeMonthStart(date);
    return makeQuarterStart(date);
  };

  let periods: Array<{
    label: string;
    start: Date;
    distanceKm: number;
    durationSeconds: number;
    elevation: number;
    averagePaceSecondsPerKm: number;
    averageHeartRate: number | null;
  }> = [];
  let currentLabel = "";

  const alignedStartDate = startForUnit(startDate, effectiveGranularity);
  const alignedCurrentStart = startForUnit(now, effectiveGranularity);
  for (
    let bucketStart = new Date(alignedStartDate);
    bucketStart <= alignedCurrentStart;
    bucketStart = addUnit(bucketStart, effectiveGranularity)
  ) {
    const bucketEnd = addUnit(bucketStart, effectiveGranularity);
    const bucketRuns = filteredRuns.filter((run) => {
      const actDate = new Date(runActivityDate(run));
      return actDate >= bucketStart && actDate < bucketEnd;
    });
    const distanceKm = bucketRuns.reduce((sum, r) => sum + r.distance_km, 0);
    const durationSeconds = bucketRuns.reduce((sum, r) => sum + r.duration_seconds, 0);
    const elevation = bucketRuns.reduce((sum, r) => sum + (r.elevation_gain ?? 0), 0);
    const averagePaceSecondsPerKm = distanceKm > 0 ? durationSeconds / distanceKm : 0;
    const hrSamples = bucketRuns
      .map((r) => r.average_heartrate ?? null)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
    const averageHeartRate = hrSamples.length
      ? hrSamples.reduce((sum, bpm) => sum + bpm, 0) / hrSamples.length
      : null;
    const label = formatAxisDateLabel(bucketStart, effectiveGranularity, period);

    periods.push({
      label,
      start: new Date(bucketStart),
      distanceKm,
      durationSeconds,
      elevation,
      averagePaceSecondsPerKm,
      averageHeartRate,
    });

    if (bucketStart.getTime() === alignedCurrentStart.getTime()) currentLabel = label;
  }

  if (periods.length === 0) {
    periods = [{ label: "N/A", start: new Date(now), distanceKm: 0, durationSeconds: 0, elevation: 0 }];
    currentLabel = "N/A";
  }

  const getMetricValue = (period: (typeof periods)[number]) => {
    if (kind === "distance") return period.distanceKm;
    if (kind === "duration") return period.durationSeconds;
    return period.elevation;
  };

  if (period === "all") {
    const firstNonZeroIndex = periods.findIndex((entry) => getMetricValue(entry) > 0);
    if (firstNonZeroIndex > 0) {
      periods = periods.slice(firstNonZeroIndex);
    }
  }

  const current = periods[periods.length - 1];
  const previous = periods.length > 1 ? periods[periods.length - 2] : current;

  const currentValue = getMetricValue(current);
  const previousValue = getMetricValue(previous);

  const allValues = periods.map(getMetricValue);
  const generateComment = (current: number, previous: number, all: number[]): string => {
    const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const lastAverage = all.slice(-Math.max(1, Math.floor(all.length / 3))).reduce((sum, v) => sum + v, 0) / Math.max(1, Math.floor(all.length / 3));

    if (current === 0) {
      return "Allez il est temps d'aller courir, l'amélioration en course à pieds se construit grâce à la régularité";
    }

    if (percentChange > 20 && lastAverage > (kind === "distance" ? 30 : kind === "duration" ? 12000 : 200)) {
      return "Attention à pas pousser trop rapidement avec le risque de se blesser, ça vaut le coup de levier un peu le pied pour laisser le temps au corps de récupérer";
    }

    if (current > previous && previous > 0) {
      return "Bravo tu progresses ! Continues comme ça pour maintenir cette dynamique";
    }

    if (current === previous && current > 0) {
      return "Régularité au rendez-vous, c'est excellent pour la progression à long terme";
    }

    if (current < previous && previous > 0) {
      return "La période a été plus chargée que d'habitude ? Laisse à ton corps le temps de récupérer";
    }

    return "Continue à travailler, chaque jour compte";
  };

  const icon = kind === "distance" ? Route : kind === "duration" ? Clock : Mountain;
  const color = "hsl(var(--accent))";

  let displayValue = "";
  if (kind === "distance") {
    displayValue = `${currentValue.toFixed(1)} km`;
  } else if (kind === "duration") {
    displayValue = formatWeeklyDurationLabel(currentValue);
  } else {
    displayValue = `${Math.round(currentValue)} m`;
  }

  return {
    title,
    unit: kind === "distance" ? "km" : kind === "duration" ? "h" : "m",
    currentValue: displayValue,
    change: formatWeeklyGrowthSummary(kind, runs),
    icon,
    color,
    metricKind: kind,
    chartData: annotateAdaptiveTicks(
      periods.map((p) => {
        const value =
          kind === "distance"
            ? p.distanceKm
            : kind === "duration"
              ? Number((p.durationSeconds / 3600).toFixed(1))
              : p.elevation;
        const barLabel =
          kind === "distance"
            ? p.distanceKm > 0
              ? formatDistanceTooltipValue(p.distanceKm)
              : ""
            : kind === "duration"
              ? p.durationSeconds > 0
                ? formatHoursTooltipValue(p.durationSeconds / 3600)
                : ""
              : p.elevation > 0
                ? `${Math.round(p.elevation)} m`
                : "";
        return { week: p.label, value, barLabel, granularity: effectiveGranularity };
      }),
      effectiveGranularity,
      period,
    ),
    comment: generateComment(currentValue, previousValue, allValues),
    granularity: effectiveGranularity,
    period,
  };
}

export function formatGoalLabel(goal: GoalSummaryData | null) {
  if (!goal) return "";

  if (goal.goalType === "race") {
    if (goal.raceType === "marathon") return "ton marathon";
    if (goal.raceType === "semi") return "ton semi-marathon";
    if (goal.raceType === "20k") return "ton 20 km";
    if (goal.raceType === "10k") return "ton 10 km";
    if (goal.raceType === "5k") return "ton 5 km";
    return goal.raceDistanceKm ? `ta course de ${goal.raceDistanceKm} km` : "ta course";
  }

  if (goal.goalType === "distance") {
    return goal.distanceKm ? `ton objectif de ${goal.distanceKm} km` : "ton objectif distance";
  }

  return goal.targetWeightKg ? `ton objectif de ${goal.targetWeightKg} kg` : "ton objectif de poids";
}

export function buildGoalAwareWeeklyInsight(
  metrics: WeeklyMetricCard[],
  goal: GoalSummaryData | null,
  sessions?: UpcomingSession[],
) {
  const baseInsight = buildWeeklyInsight(metrics);
  if (!goal) return baseInsight;

  const goalLabel = formatGoalLabel(goal);
  const defaultSessions = [
    { type: "Sortie tempo", distance: "8km", pace: "4:45/km", day: "Demain", color: "hsl(var(--lime))" },
    { type: "Récupération facile", distance: "5km", pace: "5:30/km", day: "Mercredi", color: "hsl(38, 92%, 50%)" },
    { type: "Intervalles", distance: "10km", pace: "4:15/km", day: "Vendredi", color: "hsl(0, 72%, 51%)" },
  ];
  const useSessions = sessions || defaultSessions;
  const sessionsCount = useSessions.length;
  const sessionPreview = useSessions
    .slice(0, 2)
    .map((session) => `${session.type.toLowerCase()} ${session.day.toLowerCase()}`)
    .join(" puis ");

  if (goal.goalType === "race" && goal.raceTargetDate) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(goal.raceTargetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );

    if (sessionsCount > 0) {
      return `${baseInsight} Objectif ${goalLabel}${daysLeft > 0 ? ` dans ${daysLeft} jours` : ""} : ${sessionsCount} séances prévues, dont ${sessionPreview}.`;
    }

    return `${baseInsight} Objectif ${goalLabel}${daysLeft > 0 ? ` dans ${daysLeft} jours` : ""}.`;
  }

  if (goal.goalType === "distance" && sessionsCount > 0) {
    return `${baseInsight} Pour ${goalLabel}, ${sessionsCount} séances sont prévues cette semaine, dont ${sessionPreview}.`;
  }

  if (goal.goalType === "weight" && sessionsCount > 0) {
    return `${baseInsight} Pour ${goalLabel}, garde une semaine régulière avec ${sessionsCount} séances prévues.`;
  }

  return `${baseInsight} Cap sur ${goalLabel}.`;
}
