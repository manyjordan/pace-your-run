import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as Sentry from "@sentry/react";
import { User, Session } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import { cache } from "@/lib/cache";
import { getProfile, getRuns } from "@/lib/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session on mount
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        logger.error("Error checking session", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes (including email confirmation)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "SIGNED_OUT") {
        cache.invalidateAll();
        localStorage.removeItem("pace_user_id");
        Sentry.setUser(null);
      }
      if (event === "SIGNED_IN" && session?.user) {
        Sentry.setUser({ id: session.user.id });
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    localStorage.setItem("pace_user_id", userId);

    if (cache.get(`runs_${userId}`)) return;

    void Promise.all([getProfile(userId), getRuns(userId)])
      .then(([profile, runs]) => {
        if (profile) cache.set(`profile_${userId}`, profile);
        if (runs?.length) {
          cache.set(`runs_${userId}`, runs);
          cache.set(`runsStats_${userId}`, runs);
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      cache.invalidateAll();
      localStorage.removeItem("pace_user_id");
      setUser(null);
      setSession(null);
    } catch (error) {
      logger.error("Error signing out", error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
