import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index.tsx";
import Performance from "./pages/Performance.tsx";
import Training from "./pages/Training.tsx";
import Races from "./pages/Races.tsx";
import Health from "./pages/Health.tsx";
import Explore from "./pages/Explore.tsx";
import Social from "./pages/Social.tsx";
import Equipment from "./pages/Equipment.tsx";
import Pricing from "./pages/Pricing.tsx";
import SettingsPage from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/training" element={<Training />} />
            <Route path="/races" element={<Races />} />
            <Route path="/health" element={<Health />} />
            <Route path="/social" element={<Social />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
