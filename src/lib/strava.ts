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
