import type { Session } from "@/lib/plans/types";

const ACTIVE_SESSION_KEY = "pace-active-session";

export type ActiveSession = {
  session: Session;
  planName: string;
  weekNumber: number;
};

export function saveActiveSession(data: ActiveSession): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function loadActiveSession(): ActiveSession | null {
  try {
    const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ActiveSession;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // ignore
  }
}
