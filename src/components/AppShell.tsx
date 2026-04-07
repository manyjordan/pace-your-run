import { NavLink, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Heart, Home, ClipboardList, Play, Settings, User, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createPost, getUnreadNotificationsCount, saveRun, type RunInput } from "@/lib/database";

const OFFLINE_RUNS_KEY = "pace-offline-runs";

type OfflinePostAudience = "private" | "friends" | "public";

function normalizeOfflineAudience(value: unknown): OfflinePostAudience {
  if (value === "private" || value === "friends" || value === "public") return value;
  return "public";
}

function formatDurationForOfflinePost(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

type OfflinePostOnlyQueueItem = {
  syncPostOnly: true;
  runId: string;
  title: string;
  description: string;
  audience: OfflinePostAudience;
};

function isOfflinePostOnlyItem(item: unknown): item is OfflinePostOnlyQueueItem {
  if (!item || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  return o.syncPostOnly === true && typeof o.runId === "string";
}

const desktopNavItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/social", icon: Users, label: "Actu" },
  { to: "/run", icon: Play, label: "Course" },
  { to: "/plan", icon: ClipboardList, label: "Plan" },
  { to: "/health", icon: Heart, label: "Santé" },
];

const mobileNavItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/social", icon: Users, label: "Social" },
  { to: "/run", icon: Play, label: "Course", isPrimary: true },
  { to: "/plan", icon: ClipboardList, label: "Plan" },
  { to: "/profile", icon: User, label: "Profil" },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [socialUnread, setSocialUnread] = useState(0);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const syncOfflineRuns = useCallback(async () => {
    if (!user?.id) return;
    let offline: unknown[];
    try {
      offline = JSON.parse(localStorage.getItem(OFFLINE_RUNS_KEY) ?? "[]") as unknown[];
    } catch {
      return;
    }
    if (!Array.isArray(offline) || offline.length === 0) return;

    const remaining: unknown[] = [];
    let synced = 0;
    for (const item of offline) {
      if (isOfflinePostOnlyItem(item)) {
        try {
          await createPost(user.id, item.runId, item.title, item.description, item.audience);
          synced += 1;
          window.dispatchEvent(new Event("pace-community-updated"));
        } catch {
          remaining.push(item);
        }
        continue;
      }

      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const {
        savedOfflineAt: _savedAt,
        id: _offlineId,
        offlinePostDescription,
        offlinePostAudience,
        ...runPayload
      } = record;

      const postTitle =
        typeof runPayload.title === "string" && runPayload.title.trim()
          ? runPayload.title
          : "Nouvelle course enregistrée";
      const audience = normalizeOfflineAudience(offlinePostAudience);
      const postDescription =
        typeof offlinePostDescription === "string"
          ? offlinePostDescription
          : typeof runPayload.distance_km === "number" && typeof runPayload.duration_seconds === "number"
            ? `Je viens de terminer ${runPayload.distance_km.toFixed(2)} km en ${formatDurationForOfflinePost(runPayload.duration_seconds)}.`
            : "Activité synchronisée";

      let savedRun;
      try {
        savedRun = await saveRun(user.id, runPayload as RunInput);
      } catch {
        remaining.push(item);
        continue;
      }

      try {
        await createPost(user.id, savedRun.id, postTitle, postDescription, audience);
        synced += 1;
        window.dispatchEvent(new Event("pace-community-updated"));
      } catch {
        remaining.push({
          syncPostOnly: true,
          runId: savedRun.id,
          title: postTitle,
          description: postDescription,
          audience,
        } satisfies OfflinePostOnlyQueueItem);
      }
    }

    if (remaining.length === 0) {
      localStorage.removeItem(OFFLINE_RUNS_KEY);
    } else {
      localStorage.setItem(OFFLINE_RUNS_KEY, JSON.stringify(remaining));
    }
    if (synced > 0) {
      toast({
        title: `${synced} course(s) synchronisée(s) ✅`,
      });
    }
  }, [user?.id, toast]);

  const refreshSocialUnread = useCallback(async () => {
    if (!user?.id) {
      setSocialUnread(0);
      return;
    }
    try {
      const n = await getUnreadNotificationsCount(user.id);
      setSocialUnread(n);
    } catch {
      setSocialUnread(0);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshSocialUnread();
    const t = window.setInterval(() => {
      void refreshSocialUnread();
    }, 60_000);
    const onNotif = () => {
      void refreshSocialUnread();
    };
    window.addEventListener("pace-notifications-updated", onNotif);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("pace-notifications-updated", onNotif);
    };
  }, [refreshSocialUnread]);

  useEffect(() => {
    const handleOffline = () => setIsOnline(false);
    const handleOnline = () => {
      setIsOnline(true);
      void syncOfflineRuns();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncOfflineRuns]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-accent/60 bg-accent text-accent-foreground shadow-[0_10px_30px_hsl(var(--accent)/0.18)] backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo-icon.png"
              alt="Pace"
              className="h-8 w-8 rounded-lg object-cover header-logo"
            />
            <span className="text-lg font-bold tracking-tight">PACE</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {desktopNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[hsl(var(--foreground)/0.14)] text-accent-foreground"
                      : "text-accent-foreground/75 hover:bg-[hsl(var(--foreground)/0.08)] hover:text-accent-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle className="text-accent-foreground/80 hover:bg-[hsl(var(--foreground)/0.08)] hover:text-accent-foreground" />
            <NavLink
              to="/settings"
              className="rounded-lg p-2 text-accent-foreground/80 transition-colors hover:bg-[hsl(var(--foreground)/0.08)] hover:text-accent-foreground"
            >
              <Settings className="h-5 w-5" />
            </NavLink>
          </div>
        </div>
      </header>

      {!isOnline ? (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center">
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
            📡 Mode hors ligne — certaines fonctionnalités peuvent être limitées
          </p>
        </div>
      ) : null}

      {/* Main */}
      <main className="container py-6 pb-24 md:pb-6">{children}</main>

      {/* Mobile bottom nav — 5 tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent/30 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5 items-end gap-1 px-2 py-2">
          {mobileNavItems.map((item) => {
            const isActive =
              item.to === "/profile"
                ? location.pathname.startsWith("/profile") || location.pathname.startsWith("/settings")
                : item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);
            const isRun = item.isPrimary;

            if (isRun) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-0.5 py-1 -mt-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold text-accent">{item.label}</span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex min-w-0 flex-col items-center gap-0.5 py-1 text-xs transition-colors ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <span className="relative inline-flex">
                  <item.icon className="h-5 w-5" />
                  {item.to === "/social" && socialUnread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                  ) : null}
                </span>
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

