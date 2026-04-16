import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as Sentry from "@sentry/react";
import { User, Session } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";

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
        Sentry.setUser(null);
      }
      if (event === "SIGNED_IN" && session?.user) {
        Sentry.setUser({ id: session.user.id });
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
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
