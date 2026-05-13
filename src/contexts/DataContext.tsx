import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getProfile, getRuns, type ProfileRow, type RunRow } from "@/lib/database";
import { cache } from "@/lib/cache";
import { useAuth } from "@/contexts/AuthContext";

export interface DataContextValue {
  runs: RunRow[];
  profile: ProfileRow | null;
  isLoading: boolean;
  refresh: () => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (userId: string) => {
    const cachedRuns = cache.get<RunRow[]>(`runs_${userId}`);
    const cachedProfile = cache.get<ProfileRow>(`profile_${userId}`);
    if (cachedRuns?.length) {
      setRuns(cachedRuns);
      cache.set(`runsStats_${userId}`, cachedRuns);
    }
    if (cachedProfile) setProfile(cachedProfile);
    if (cachedRuns?.length && cachedProfile) setIsLoading(false);

    try {
      const [freshRuns, freshProfile] = await Promise.all([getRuns(userId), getProfile(userId)]);
      setRuns(freshRuns ?? []);
      cache.set(`runs_${userId}`, freshRuns ?? []);
      if ((freshRuns ?? []).length) cache.set(`runsStats_${userId}`, freshRuns ?? []);
      if (freshProfile) {
        setProfile(freshProfile);
        cache.set(`profile_${userId}`, freshProfile);
      } else {
        setProfile(null);
      }
    } catch {
      // keep cached UI if network fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    const userId = session?.user?.id;
    if (userId) void load(userId);
  }, [session?.user?.id, load]);

  useEffect(() => {
    if (!session?.user?.id) {
      setRuns([]);
      setProfile(null);
      setIsLoading(false);
      return;
    }
    localStorage.setItem("pace_user_id", session.user.id);
    void load(session.user.id);
  }, [session?.user?.id, load]);

  useEffect(() => {
    const onRefresh = () => refresh();
    window.addEventListener("pace-goal-updated", onRefresh);
    window.addEventListener("pace-runs-updated", onRefresh);
    return () => {
      window.removeEventListener("pace-goal-updated", onRefresh);
      window.removeEventListener("pace-runs-updated", onRefresh);
    };
  }, [refresh]);

  return (
    <DataContext.Provider value={{ runs, profile, isLoading, refresh }}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
