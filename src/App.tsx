import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { SplashScreen } from "@/components/SplashScreen";
import { useState, useEffect, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import Auth from "./pages/Auth.tsx";
import EmailConfirmation from "./pages/EmailConfirmation.tsx";
import Index from "./pages/Index.tsx";
import Run from "./pages/Run.tsx";
import Plan from "./pages/Plan.tsx";
import Profile from "./pages/Profile.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfUse from "./pages/TermsOfUse.tsx";
import SettingsPage from "./pages/Settings.tsx";
import StravaCallback from "./pages/StravaCallback.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy load heavy pages
const Social = lazy(() => import("./pages/Social.tsx"));
const Health = lazy(() => import("./pages/Health.tsx"));
const ImportPage = lazy(() => import("./pages/Import.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const HealthKitSync = lazy(() => import("./pages/HealthKitSync.tsx"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="animate-spin h-6 w-6 text-accent" />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/confirm" element={<EmailConfirmation />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Suspense fallback={<LazyFallback />}>
                <Routes>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/run" element={<Run />} />
                  <Route path="/plan" element={<Plan />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/healthkit" element={<HealthKitSync />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/auth/strava/callback" element={<StravaCallback />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if splash screen has been shown before (use sessionStorage to show only on first load)
    const hasShownSplash = sessionStorage.getItem("splashShown");
    if (hasShownSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          {showSplash ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          )}
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
