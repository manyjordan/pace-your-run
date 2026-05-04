import { getWeek, subWeeks } from "date-fns";

export interface AchievementStats {
  totalKm: number;
  totalRuns: number;
  longestRun: number;
  weeklyStreak: number;
  bestPaceSecPerKm: number;
  totalHours: number;
}

/** Consecutive ISO weeks (Mon→Sun) with at least one run, counting backward from today (same logic as the dashboard). */
export function computeWeeklyStreakFromRuns(runs: Array<{ started_at?: string | null }>): number {
  const weekKeys = new Set(
    runs
      .filter((run) => Boolean(run.started_at))
      .map((run) => {
        const d = new Date(run.started_at as string);
        const year = d.getFullYear();
        const week = getWeek(d, { weekStartsOn: 1 });
        return `${year}-W${String(week).padStart(2, "0")}`;
      }),
  );
  let streak = 0;
  let checkDate = new Date();
  for (let i = 0; i < 104; i++) {
    const year = checkDate.getFullYear();
    const week = getWeek(checkDate, { weekStartsOn: 1 });
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    if (weekKeys.has(key)) {
      streak += 1;
      checkDate = subWeeks(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
  check: (stats: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_run",
    emoji: "🎉",
    title: "Premier pas",
    description: "Première course enregistrée",
    color: "#1DB954",
    check: (s) => s.totalRuns >= 1,
  },
  {
    id: "first_10k",
    emoji: "🔟",
    title: "10km",
    description: "Première course de 10km",
    color: "#1DB954",
    check: (s) => s.longestRun >= 10,
  },
  {
    id: "first_half",
    emoji: "🥈",
    title: "Semi-marathon",
    description: "Première course de 21km",
    color: "#60a5fa",
    check: (s) => s.longestRun >= 21,
  },
  {
    id: "first_marathon",
    emoji: "🏅",
    title: "Marathonien",
    description: "Première course de 42km",
    color: "#f59e0b",
    check: (s) => s.longestRun >= 42,
  },
  {
    id: "100km",
    emoji: "💯",
    title: "100km au compteur",
    description: "100km cumulés",
    color: "#1DB954",
    check: (s) => s.totalKm >= 100,
  },
  {
    id: "500km",
    emoji: "🚀",
    title: "500km",
    description: "500km cumulés",
    color: "#f59e0b",
    check: (s) => s.totalKm >= 500,
  },
  {
    id: "1000km",
    emoji: "🌟",
    title: "1000km",
    description: "1000km cumulés — légende !",
    color: "#ef4444",
    check: (s) => s.totalKm >= 1000,
  },
  {
    id: "streak_4",
    emoji: "🔥",
    title: "4 semaines",
    description: "4 semaines consécutives",
    color: "#fb923c",
    check: (s) => s.weeklyStreak >= 4,
  },
  {
    id: "streak_10",
    emoji: "🔥🔥",
    title: "10 semaines",
    description: "10 semaines consécutives",
    color: "#ef4444",
    check: (s) => s.weeklyStreak >= 10,
  },
  {
    id: "sub5_pace",
    emoji: "⚡",
    title: "Fusée",
    description: "Allure inférieure à 5:00/km",
    color: "#1DB954",
    check: (s) => s.bestPaceSecPerKm > 0 && s.bestPaceSecPerKm < 300,
  },
  {
    id: "sub430_pace",
    emoji: "🏆",
    title: "Elite",
    description: "Allure inférieure à 4:30/km",
    color: "#f59e0b",
    check: (s) => s.bestPaceSecPerKm > 0 && s.bestPaceSecPerKm < 270,
  },
  {
    id: "50h",
    emoji: "⏱️",
    title: "50 heures",
    description: "50 heures de course cumulées",
    color: "#60a5fa",
    check: (s) => s.totalHours >= 50,
  },
];

export function getEarnedAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.check(stats));
}

export function getNextAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !a.check(stats)).slice(0, 3);
}
