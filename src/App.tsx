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
import { DeepLinkAuthHandler } from "@/components/DeepLinkAuthHandler";
import { useState, useEffect, lazy, Suspense, useCallback } from "react";

const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Run = lazy(() => import("@/pages/Run"));
const Social = lazy(() => import("@/pages/Social"));
const Plan = lazy(() => import("@/pages/Plan"));
const RoutesPage = lazy(() => import("@/pages/Routes"));
const Health = lazy(() => import("@/pages/Health"));
const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));
const Import = lazy(() => import("@/pages/Import"));
const HealthKitSync = lazy(() => import("@/pages/HealthKitSync"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("@/pages/TermsOfUse"));
const LegalNotice = lazy(() => import("@/pages/LegalNotice"));
const EmailConfirmation = lazy(() => import("@/pages/EmailConfirmation"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/confirm" element={<EmailConfirmation />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/legal" element={<LegalNotice />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/run" element={<Run />} />
                  <Route path="/plan" element={<Plan />} />
                  <Route path="/routes" element={<RoutesPage />} />
                  <Route path="/profile" element={<Navigate to="/settings" replace />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="/health/issue/:issueKey" element={<Health />} />
                  <Route path="/import" element={<Import />} />
                  <Route path="/healthkit" element={<HealthKitSync />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
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
                  <DeepLinkAuthHandler />
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
