import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile } from "@/lib/database";

export function useOnboarding() {
  const { session, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        if (!session?.user?.id) {
          setLoading(false);
          setNeedsOnboarding(false);
          return;
        }

        const profile = await getProfile(session.user.id);

        if (!profile || !profile.onboarding_completed) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      void checkOnboarding();
    }
  }, [session, authLoading, refreshTrigger]);

  // Function to force a refresh (call this after updating onboarding status)
  const refresh = () => setRefreshTrigger(prev => prev + 1);

  return { needsOnboarding, loading, refresh };
}
