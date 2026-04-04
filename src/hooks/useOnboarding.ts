import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile } from "@/lib/database";

export function useOnboarding() {
  const { session, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isCheckingRef = useRef(false);
  const skippedOnboardingKey = session?.user?.id ? `pace-onboarding-skipped:${session.user.id}` : null;

  useEffect(() => {
    const checkOnboarding = async () => {
      // Prevent multiple simultaneous fetches
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        if (!session?.user?.id) {
          setLoading(false);
          setNeedsOnboarding(false);
          return;
        }

        if (skippedOnboardingKey && localStorage.getItem(skippedOnboardingKey) === "true") {
          setNeedsOnboarding(false);
          setLoading(false);
          return;
        }

        const profile = await getProfile(session.user.id);

        if (!profile || !profile.onboarding_completed) {
          setNeedsOnboarding(true);
        } else {
          if (skippedOnboardingKey) {
            localStorage.setItem(skippedOnboardingKey, "true");
          }
          setNeedsOnboarding(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Do not force onboarding again for existing users if the profile check temporarily fails.
        setNeedsOnboarding(false);
      } finally {
        setLoading(false);
        isCheckingRef.current = false;
      }
    };

    if (!authLoading) {
      checkOnboarding();
    }
  }, [session?.user?.id, authLoading, refreshTrigger, skippedOnboardingKey]);

  // Function to force a refresh (call this after updating onboarding status)
  const refresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  return { needsOnboarding, loading, refresh };
}
