import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading, refresh } = useOnboarding();
  const location = useLocation();
  const onboardingSkipped =
    typeof window !== "undefined" && user
      ? localStorage.getItem(`pace-onboarding-skipped:${user.id}`) === "true"
      : false;

  useEffect(() => {
    if (!authLoading) {
      refresh();
    }
  }, [location.pathname, authLoading, refresh]);

  if (authLoading || onboardingLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user needs onboarding and is not already on the onboarding page or settings page
  if (
    !onboardingSkipped &&
    needsOnboarding &&
    location.pathname !== "/onboarding" &&
    location.pathname !== "/settings" &&
    location.pathname !== "/import"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
