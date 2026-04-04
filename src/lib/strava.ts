export const COMMUNITY_POSTS_KEY = "pace-community-posts";

export type GPSTracePoint = {
  lat: number;
  lng: number;
  time: number;
};

export type CommunityPost = {
  id: number;
  user: string;
  initials: string;
  time: string;
  type: "run" | "race";
  title: string;
  description: string;
  stats: { distance: string; pace: string; duration: string; elevation: string };
  likes: number;
  comments: number;
  liked: boolean;
  gpsTrace?: GPSTracePoint[];
};

export type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  start_date: string;
  sport_type?: string;
  type?: string;
  map?: {
    summary_polyline?: string | null;
  };
  splits_metric?: Array<{
    distance: number;
    elapsed_time: number;
    elevation_difference?: number;
    moving_time: number;
    split: number;
    average_speed?: number;
    average_heartrate?: number;
  }>;
};

export type StravaSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    profile: string;
  };
};

export function connectStrava(jwtToken: string): string {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const redirectUri = `${window.location.origin}/functions/v1/strava-auth`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "activity:read_all",
    state: jwtToken,
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatHoursAndMinutes(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes} min`;
  }

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatPace(distanceMeters: number, movingTimeSeconds: number) {
  if (!distanceMeters || !movingTimeSeconds) return "--:-- /km";

  const minutesPerKm = movingTimeSeconds / 60 / (distanceMeters / 1000);
  const wholeMinutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - wholeMinutes) * 60);
  const safeSeconds = seconds === 60 ? 59 : seconds;

  return `${wholeMinutes}:${String(safeSeconds).padStart(2, "0")} /km`;
}

export function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function decodePolyline(polyline: string): Array<{ lat: number; lng: number }> {
  const coordinates: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return coordinates;
}

export function buildTraceFromActivity(activity: StravaActivity) {
  const polyline = activity.map?.summary_polyline;
  if (!polyline) return undefined;

  const points = decodePolyline(polyline);
  if (points.length === 0) return undefined;

  const startedAt = new Date(activity.start_date).getTime();
  const stepMs = points.length > 1 ? Math.max(1000, Math.round((activity.moving_time * 1000) / points.length)) : 1000;

  return points.map((point, index) => ({
    lat: point.lat,
    lng: point.lng,
    time: startedAt + index * stepMs,
  }));
}

function inferPostType(activity: StravaActivity): "run" | "race" {
  const label = `${activity.name} ${activity.sport_type ?? ""} ${activity.type ?? ""}`.toLowerCase();
  if (
    label.includes("marathon") ||
    label.includes("semi") ||
    label.includes("race") ||
    label.includes("course") ||
    label.includes("10k") ||
    label.includes("10 km") ||
    label.includes("5k") ||
    label.includes("5 km")
  ) {
    return "race";
  }

  return "run";
}

export function activityToCommunityPost(activity: StravaActivity, athleteName: string): CommunityPost {
  const trace = buildTraceFromActivity(activity);

  return {
    id: activity.id,
    user: athleteName || "Strava",
    initials: getInitials(athleteName || "Strava"),
    time: formatRelativeTime(activity.start_date),
    type: inferPostType(activity),
    title: activity.name || "Activité Strava",
    description: `Activité importée depuis Strava · ${formatDistance(activity.distance)} en ${formatDuration(activity.moving_time)}.`,
    stats: {
      distance: formatDistance(activity.distance),
      pace: formatPace(activity.distance, activity.moving_time),
      duration: formatDuration(activity.moving_time),
      elevation: `+${Math.round(activity.total_elevation_gain ?? 0)} m`,
    },
    gpsTrace: trace,
    likes: 0,
    comments: 0,
    liked: false,
  };
}

export function buildWeeklyDistanceData(activities: StravaActivity[]) {
  const formatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),
      day: formatter.format(date).replace(".", ""),
      km: 0,
    };
  });

  const byDay = new Map(days.map((entry) => [entry.key, entry]));

  activities.forEach((activity) => {
    const key = new Date(activity.start_date).toISOString().slice(0, 10);
    const dayEntry = byDay.get(key);
    if (dayEntry) {
      dayEntry.km += activity.distance / 1000;
    }
  });

  return days.map((entry) => ({
    day: entry.day.charAt(0).toUpperCase() + entry.day.slice(1, 3),
    km: Number(entry.km.toFixed(1)),
  }));
}

export function buildDashboardStats(activities: StravaActivity[]) {
  const last7Days = activities.filter((activity) => {
    const diff = Date.now() - new Date(activity.start_date).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  });

  const totalDistance = last7Days.reduce((sum, activity) => sum + activity.distance, 0);
  const totalDuration = last7Days.reduce((sum, activity) => sum + activity.moving_time, 0);
  const totalElevation = last7Days.reduce((sum, activity) => sum + (activity.total_elevation_gain ?? 0), 0);

  const heartRateActivities = last7Days.filter((activity) => activity.average_heartrate);
  const averageHeartRate = heartRateActivities.length
    ? Math.round(
        heartRateActivities.reduce((sum, activity) => sum + (activity.average_heartrate ?? 0), 0) /
          heartRateActivities.length,
      )
    : null;

  return [
    { label: "Distance", value: (totalDistance / 1000).toFixed(1), unit: "km" },
    { label: "Durée", value: formatHoursAndMinutes(totalDuration), unit: "" },
    { label: "Dénivelé", value: Math.round(totalElevation).toString(), unit: "m" },
    { label: "FC moy.", value: averageHeartRate ? averageHeartRate.toString() : "--", unit: "bpm" },
  ];
}

export function getLatestActivity(activities: StravaActivity[]) {
  if (activities.length === 0) return null;

  return [...activities].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  )[0];
}

function getStartOfWeek(input: Date) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function formatShortDate(date: Date) {
  const day = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}

function formatAxisDateLabel(
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
    return formatShortDate(start);
  }

  if (granularity === "month") {
    return monthLabel;
  }

  const quarter = Math.floor(start.getMonth() / 3) + 1;
  return `Q${quarter}`;
}

function buildSeriesMeta(start: Date, label: string, previousYear?: number) {
  const year = start.getFullYear();
  return {
    week: label,
    year: String(year),
    showTick: previousYear === undefined || previousYear !== year,
  };
}

function getAdaptiveTickStep(
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

function annotateAdaptiveTicks<T extends { year?: string }>(
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

export function estimateVo2Max(activity: StravaActivity) {
  if (!activity.distance || !activity.moving_time) return 0;

  const velocity = activity.distance / activity.moving_time * 60;
  const oxygenCost = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
  const timeMinutes = activity.moving_time / 60;
  const percentVo2 =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  const estimate = oxygenCost / Math.max(0.8, percentVo2);
  return Number(Math.min(85, Math.max(25, estimate)).toFixed(1));
}

export function buildVo2Series(
  activities: StravaActivity[],
  granularity: "week" | "month" | "quarter" = "week",
  period: "1m" | "3m" | "1y" | "all" = "3m",
) {
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
    const activityDate = new Date(activity.start_date);
    return activityDate >= startDate && activityDate <= now;
  });

  const points: Array<{ week: string; value: number; year: string; showTick: boolean }> = [];

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

      const estimates = filteredActivities
        .filter((activity) => {
          const activityDate = new Date(activity.start_date);
          return activityDate >= weekStart && activityDate < weekEnd;
        })
        .map((activity) => estimateVo2Max(activity))
        .filter((value) => value > 0);

      const vo2 = estimates.length
        ? Number((estimates.reduce((sum, value) => sum + value, 0) / estimates.length).toFixed(1))
        : 0;

      points.push({
        ...buildSeriesMeta(weekStart, formatAxisDateLabel(weekStart, "week", period), points.length ? Number(points[points.length - 1].year) : undefined),
        value: vo2,
      });
    }
  } else if (granularity === "month") {
    const alignedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCount =
      Math.max(1, (currentMonthStart.getFullYear() - alignedStartDate.getFullYear()) * 12 + currentMonthStart.getMonth() - alignedStartDate.getMonth() + 1);

    for (let i = 0; i < monthCount; i++) {
      const monthStart = new Date(alignedStartDate.getFullYear(), alignedStartDate.getMonth() + i, 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

      const estimates = filteredActivities
        .filter((activity) => {
          const activityDate = new Date(activity.start_date);
          return activityDate >= monthStart && activityDate < monthEnd;
        })
        .map((activity) => estimateVo2Max(activity))
        .filter((value) => value > 0);

      const vo2 = estimates.length
        ? Number((estimates.reduce((sum, value) => sum + value, 0) / estimates.length).toFixed(1))
        : 0;

      points.push({
        ...buildSeriesMeta(
          monthStart,
          formatAxisDateLabel(monthStart, "month", period),
          points.length ? Number(points[points.length - 1].year) : undefined,
        ),
        value: vo2,
      });
    }
  } else {
    const alignedStartDate = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
    const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterCount =
      Math.max(
        1,
        Math.round((currentQuarterStart.getTime() - alignedStartDate.getTime()) / (91 * 24 * 60 * 60 * 1000)) + 1,
      );

    for (let i = 0; i < quarterCount; i++) {
      const quarterStart = new Date(alignedStartDate.getFullYear(), alignedStartDate.getMonth() + i * 3, 1);
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 1);
      const quarterIndex = Math.floor(quarterStart.getMonth() / 3) + 1;

      const estimates = filteredActivities
        .filter((activity) => {
          const activityDate = new Date(activity.start_date);
          return activityDate >= quarterStart && activityDate < quarterEnd;
        })
        .map((activity) => estimateVo2Max(activity))
        .filter((value) => value > 0);

      const vo2 = estimates.length
        ? Number((estimates.reduce((sum, value) => sum + value, 0) / estimates.length).toFixed(1))
        : 0;

      points.push({
        ...buildSeriesMeta(quarterStart, formatAxisDateLabel(quarterStart, "quarter", period), points.length ? Number(points[points.length - 1].year) : undefined),
        value: vo2,
      });
    }
  }

  const annotatedPoints = annotateAdaptiveTicks(points, granularity, period);

  if (period === "all") {
    const firstNonZeroIndex = annotatedPoints.findIndex((point) => point.value > 0);
    return firstNonZeroIndex > 0 ? annotateAdaptiveTicks(annotatedPoints.slice(firstNonZeroIndex), granularity, period) : annotatedPoints;
  }

  return annotatedPoints;
}

function estimateTrainingLoad(activity: StravaActivity) {
  const durationMinutes = activity.moving_time / 60;
  const intensityFactor = activity.average_heartrate
    ? Math.max(0.6, Math.min(1.35, activity.average_heartrate / 150))
    : 1;
  return durationMinutes * intensityFactor;
}

export function buildAcwrSeries(activities: StravaActivity[], periods = 12) {
  const currentWeekStart = getStartOfWeek(new Date());
  const weeklyLoads = Array.from({ length: periods + 4 }, (_, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (periods + 3 - index) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= weekStart && activityDate < weekEnd;
    });

    return {
      week: formatShortDate(weekStart),
      load: weekActivities.reduce((sum, activity) => sum + estimateTrainingLoad(activity), 0),
    };
  });

  return annotateAdaptiveTicks(weeklyLoads.slice(4).map((entry, index) => {
    const periodStart = new Date(currentWeekStart);
    periodStart.setDate(currentWeekStart.getDate() - (periods - 1 - index) * 7);
    const previousPeriodStart =
      index > 0
        ? new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() - (periods - index) * 7)
        : undefined;
    const chronicBlock = weeklyLoads.slice(index, index + 4);
    const chronicAverage = chronicBlock.length
      ? chronicBlock.reduce((sum, item) => sum + item.load, 0) / chronicBlock.length
      : 0;
    const ratio = chronicAverage > 0 ? Number((entry.load / chronicAverage).toFixed(2)) : 0;

    return {
      ...buildSeriesMeta(periodStart, entry.week, previousPeriodStart?.getFullYear()),
      value: ratio,
    };
  }), "week");
}

export function getPersonalRecords(activities: StravaActivity[]) {
  const targets = [
    { event: "5 km", distanceKm: 5, tolerance: 0.12 },
    { event: "10 km", distanceKm: 10, tolerance: 0.12 },
    { event: "Semi-marathon", distanceKm: 21.1, tolerance: 0.08 },
    { event: "Marathon", distanceKm: 42.195, tolerance: 0.06 },
  ];

  return targets.map((target) => {
    const candidates = activities
      .filter((activity) => {
        const distanceKm = activity.distance / 1000;
        return Math.abs(distanceKm - target.distanceKm) / target.distanceKm <= target.tolerance;
      })
      .sort((a, b) => a.moving_time - b.moving_time);

    const best = candidates[0];
    const secondBest = candidates[1];

    if (!best) {
      return {
        event: target.event,
        time: "--",
        date: "Aucune activité",
        improvement: "",
      };
    }

    const improvement = secondBest
      ? `-${formatDuration(Math.max(0, secondBest.moving_time - best.moving_time))}`
      : "PR";

    return {
      event: target.event,
      time: formatDuration(best.moving_time),
      date: new Date(best.start_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      improvement,
    };
  });
}
