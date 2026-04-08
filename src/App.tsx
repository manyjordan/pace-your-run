import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { SplashScreen } from "@/components/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import Auth from "./pages/Auth.tsx";
import EmailConfirmation from "./pages/EmailConfirmation.tsx";
import Index from "./pages/Index.tsx";
import Run from "./pages/Run.tsx";
import Plan from "./pages/Plan.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfUse from "./pages/TermsOfUse.tsx";
import SettingsPage from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy load heavy pages
const Social = lazy(() => import("./pages/Social.tsx"));
const Health = lazy(() => import("./pages/Health.tsx"));
const ImportPage = lazy(() => import("./pages/Import.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const HealthKitSync = lazy(() => import("./pages/HealthKitSync.tsx"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="animate-spin">
          <div className="h-8 w-8 rounded-full border-4 border-accent/20 border-t-accent" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Chargement...</p>
    </div>
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
                  <Route path="/profile" element={<Navigate to="/settings" replace />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/healthkit" element={<HealthKitSync />} />
                  <Route path="/settings" element={<SettingsPage />} />
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

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
