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
};

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
