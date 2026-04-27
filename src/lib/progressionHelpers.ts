import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

export interface MonthlyPace {
  label: string;
  value: number;
  runs: number;
}

export function buildPaceProgression(
  runs: Array<{ started_at: string; distance_km: number; duration_seconds: number }>,
  months: number = 6,
): MonthlyPace[] {
  const result: MonthlyPace[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const base = subMonths(new Date(), i);
    const monthStart = startOfMonth(base);
    const monthEnd = endOfMonth(base);
    const label = format(monthStart, "MMM", { locale: fr });

    const monthRuns = runs.filter((r) => {
      const d = new Date(r.started_at);
      return d >= monthStart && d <= monthEnd && r.distance_km >= 3 && r.duration_seconds > 0;
    });

    if (monthRuns.length === 0) {
      result.push({ label, value: 0, runs: 0 });
      continue;
    }

    const totalDist = monthRuns.reduce((sum, r) => sum + r.distance_km, 0);
    const totalSec = monthRuns.reduce((sum, r) => sum + r.duration_seconds, 0);
    const avgPaceSecPerKm = totalSec / totalDist;

    result.push({ label, value: avgPaceSecPerKm, runs: monthRuns.length });
  }

  return result.filter((m) => m.value > 0);
}

export function formatPaceSecPerKm(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0) return "--:--";
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  const safeSec = sec === 60 ? 59 : sec;
  return `${min}:${String(safeSec).padStart(2, "0")}`;
}
