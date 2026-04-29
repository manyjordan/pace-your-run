import { Capacitor } from "@capacitor/core";
import { logger } from "./logger";

const STREAK_MILESTONES = [4, 8, 12, 16, 20, 26, 52];

const MESSAGES: Record<number, string> = {
  4: "🔥 4 semaines consécutives ! Vous prenez de bonnes habitudes.",
  8: "🔥🔥 8 semaines ! Votre régularité paie, continuez !",
  12: "⚡ 3 mois consécutifs ! Vous êtes sur une lancée incroyable.",
  16: "🏆 4 mois sans interruption ! Vous êtes un vrai athlète.",
  20: "🌟 5 mois consécutifs ! Performance d'élite.",
  26: "🎯 6 mois ! Un semestre complet de running.",
  52: "👑 1 an sans interruption ! Légende.",
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === "granted";
  } catch (e) {
    logger.error("Notification permission failed", e);
    return false;
  }
}

export async function scheduleStreakNotification(streak: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!STREAK_MILESTONES.includes(streak)) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1000 + streak,
          title: "Pace 🏃",
          body: MESSAGES[streak] ?? `🔥 ${streak} semaines consécutives !`,
          schedule: { at: new Date(Date.now() + 1000) },
          sound: "default",
          actionTypeId: "",
          extra: { type: "streak_milestone", streak },
        },
      ],
    });
  } catch (e) {
    logger.error("Schedule notification failed", e);
  }
}

export const getLastNotifiedStreak = () => parseInt(localStorage.getItem("pace_last_notified_streak") ?? "0", 10);

export const setLastNotifiedStreak = (streak: number) =>
  localStorage.setItem("pace_last_notified_streak", String(streak));
