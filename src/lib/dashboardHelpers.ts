import type { StravaActivity } from "@/lib/strava";
import { Route, Clock, Mountain } from "lucide-react";

type WeeklyMetricCard = {
  title: string;
  unit: string;
  currentValue: string;
  change: string;
  icon: typeof Route;
  color: string;
  chartData: Array<{ week: string; value: number; showTick?: boolean }>;
  comment: string;
  granularity?: "week" | "month" | "quarter";
  period?: "1m" | "3m" | "1y" | "all";
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

export function getMetricAmountForTitle(title: string, activities: StravaActivity[]) {
  if (title.includes("Distance")) {
    return activities.reduce((sum, activity) => sum + activity.distance / 1000, 0);
  }
  if (title.includes("Durée")) {
    return activities.reduce((sum, activity) => sum + activity.moving_time / 3600, 0);
  }
  return activities.reduce((sum, activity) => sum + (activity.total_elevation_gain ?? 0), 0);
}

export function formatWeeklyGrowthSummary(title: string, activities: StravaActivity[]) {
  const currentWeekStart = getStartOfWeek(new Date());
  const weeklyValues = Array.from({ length: 4 }, (_, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (3 - index) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= weekStart && activityDate < weekEnd;
    });

    return getMetricAmountForTitle(title, weekActivities);
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

export function formatMetricBarLabel(title: string, value: number) {
  if (value === 0) return "";
  if (title.includes("Distance")) return `${Math.round(value)}`;
  if (title.includes("Durée")) return `${Math.round(value)}`;
  return `${Math.round(value)}`;
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

export function formatDashboardTooltip(title: string, value: number): [string, string] {
  if (title.includes("Distance")) {
    return [formatDistanceTooltipValue(value), "Distance en km"];
  }

  if (title.includes("Durée")) {
    return [formatHoursTooltipValue(value), "Durée en heure et minutes"];
  }

  return [`${Math.round(value)} m`, "Dénivelé en mètres"];
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
  period: "1m" | "3m" | "1y" | "all",
) {
  const month = start.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  const monthLabel = `${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  const year = String(start.getFullYear()).slice(-2);

  if (granularity === "month" && (period === "1y" || period === "all")) {
    return `${monthLabel} ${year}`;
  }

  if (period === "1y" || period === "all") {
    const day = String(start.getDate()).padStart(2, "0");
    return `${day} ${monthLabel} ${year}`;
  }

  if (granularity === "week") {
    return `${start.getDate()} ${monthLabel}`;
  }

  if (granularity === "month") {
    return monthLabel;
  }

  const quarter = Math.floor(start.getMonth() / 3) + 1;
  return `Q${quarter}`;
}

export function trimLeadingZeroPeriods<T extends { value: number }>(series: T[]) {
  const firstNonZeroIndex = series.findIndex((item) => item.value > 0);
  if (firstNonZeroIndex === -1) return series;
  return series.slice(firstNonZeroIndex);
}

export function getAdaptiveTickStep(
  length: number,
  granularity: "week" | "month" | "quarter",
  period?: "1m" | "3m" | "1y" | "all",
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
  period?: "1m" | "3m" | "1y" | "all",
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
  activities: StravaActivity[],
  granularity: "week" | "month" | "quarter",
  period: "1m" | "3m" | "1y" | "all",
): WeeklyMetricCard {
  const now = new Date();
  let startDate = new Date();

  if (period === "1m") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === "3m") {
    startDate.setMonth(now.getMonth() - 3);
  } else if (period === "1y") {
    startDate.setFullYear(now.getFullYear() - 1);
  } else {
    startDate = new Date("2000-01-01");
  }

  const filteredActivities = activities.filter((activity) => {
    const actDate = new Date(activity.start_date);
    return actDate >= startDate && actDate <= now;
  });

  let periods: Array<{ label: string; start: Date; distanceKm: number; durationSeconds: number; elevation: number }> = [];
  let currentLabel = "";

  if (granularity === "week") {
    const alignedStartDate = getStartOfWeek(startDate);
    const currentWeekStart = getStartOfWeek(now);
    const weekCount =
      Math.max(
        1,
        Math.round((currentWeekStart.getTime() - alignedStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
      );

    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(alignedStartDate);
      weekStart.setDate(alignedStartDate.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekActivities = filteredActivities.filter((activity) => {
        const actDate = new Date(activity.start_date);
        return actDate >= weekStart && actDate < weekEnd;
      });

      const label = formatAxisDateLabel(weekStart, "week", period);

      periods.push({
        label,
        start: new Date(weekStart),
        distanceKm: weekActivities.reduce((sum, a) => sum + a.distance / 1000, 0),
        durationSeconds: weekActivities.reduce((sum, a) => sum + a.moving_time, 0),
        elevation: weekActivities.reduce((sum, a) => sum + (a.total_elevation_gain ?? 0), 0),
      });

      if (weekStart.getTime() === currentWeekStart.getTime()) currentLabel = label;
    }
  } else if (granularity === "month") {
    const monthCount = Math.ceil((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) || 1;
    for (let i = monthCount - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthActivities = filteredActivities.filter((activity) => {
        const actDate = new Date(activity.start_date);
        return actDate >= monthStart && actDate < monthEnd;
      });

      const label = formatAxisDateLabel(monthStart, "month", period);
      periods.push({
        label,
        start: new Date(monthStart),
        distanceKm: monthActivities.reduce((sum, a) => sum + a.distance / 1000, 0),
        durationSeconds: monthActivities.reduce((sum, a) => sum + a.moving_time, 0),
        elevation: monthActivities.reduce((sum, a) => sum + (a.total_elevation_gain ?? 0), 0),
      });

      if (i === 0) currentLabel = label;
    }
  } else {
    const quarterCount = Math.ceil((now.getTime() - startDate.getTime()) / (91 * 24 * 60 * 60 * 1000)) || 1;
    for (let i = quarterCount - 1; i >= 0; i--) {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - i * 3, 1);
      const quarterEnd = i === 0 ? now : new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 1);

      const quarterActivities = filteredActivities.filter((activity) => {
        const actDate = new Date(activity.start_date);
        return actDate >= quarterStart && actDate < quarterEnd;
      });

      const label = formatAxisDateLabel(quarterStart, "quarter", period);
      periods.push({
        label,
        start: new Date(quarterStart),
        distanceKm: quarterActivities.reduce((sum, a) => sum + a.distance / 1000, 0),
        durationSeconds: quarterActivities.reduce((sum, a) => sum + a.moving_time, 0),
        elevation: quarterActivities.reduce((sum, a) => sum + (a.total_elevation_gain ?? 0), 0),
      });

      if (i === 0) currentLabel = label;
    }
  }

  if (periods.length === 0) {
    periods = [{ label: "N/A", start: new Date(now), distanceKm: 0, durationSeconds: 0, elevation: 0 }];
    currentLabel = "N/A";
  }

  const getMetricValue = (period: (typeof periods)[number]) => {
    if (title.includes("Distance")) return period.distanceKm;
    if (title.includes("Durée")) return period.durationSeconds;
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

    if (percentChange > 20 && lastAverage > (title.includes("Distance") ? 30 : title.includes("Durée") ? 12000 : 200)) {
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

  const icon = title.includes("Distance") ? Route : title.includes("Durée") ? Clock : Mountain;
  const color = "hsl(var(--accent))";

  let displayValue = "";
  if (title.includes("Distance")) {
    displayValue = `${currentValue.toFixed(1)} km`;
  } else if (title.includes("Durée")) {
    displayValue = formatWeeklyDurationLabel(currentValue);
  } else {
    displayValue = `${Math.round(currentValue)} m`;
  }

  return {
    title,
    unit: title.includes("Distance") ? "km" : title.includes("Durée") ? "h" : "m",
    currentValue: displayValue,
    change: formatWeeklyGrowthSummary(title, activities),
    icon,
    color,
    chartData: annotateAdaptiveTicks(periods.map((p) => ({
        week: p.label,
        value: title.includes("Distance")
          ? p.distanceKm
          : title.includes("Durée")
            ? Number((p.durationSeconds / 3600).toFixed(1))
            : p.elevation,
      })), granularity, period),
    comment: generateComment(currentValue, previousValue, allValues),
    granularity: granularity as "week" | "month" | "quarter",
    period: period as "1m" | "3m" | "1y" | "all",
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
