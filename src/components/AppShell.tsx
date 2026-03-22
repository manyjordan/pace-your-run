import { NavLink, useLocation } from "react-router-dom";
import { Home, BarChart3, Calendar, Search, Heart, Map, CreditCard, Settings, Users, ShoppingBag, Play, Radio } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/performance", icon: BarChart3, label: "Performance" },
  { to: "/training", icon: Calendar, label: "Training" },
  { to: "/races", icon: Search, label: "Races" },
  { to: "/health", icon: Heart, label: "Health" },
  { to: "/social", icon: Users, label: "Social" },
  { to: "/equipment", icon: ShoppingBag, label: "Équipement" },
  { to: "/explore", icon: Map, label: "Explore" },
  { to: "/pricing", icon: CreditCard, label: "Pricing" },
  { to: "/run", icon: Play, label: "Run" },
  { to: "/live", icon: Radio, label: "Live" },
];

const mobileNav = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/social", icon: Users, label: "Social" },
  { to: "/run", icon: Play, label: "Run", highlight: true },
  { to: "/live", icon: Radio, label: "Live" },
  { to: "/equipment", icon: ShoppingBag, label: "Équip." },
  { to: "/performance", icon: BarChart3, label: "Stats" },
  { to: "/training", icon: Calendar, label: "Plan" },
  { to: "/races", icon: Search, label: "Courses" },
  { to: "/health", icon: Heart, label: "Santé" },
  { to: "/explore", icon: Map, label: "Explore" },
  { to: "/pricing", icon: CreditCard, label: "Pricing" },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-sm font-black tracking-tighter text-accent-foreground">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight">PACE</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/settings"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </NavLink>
        </div>
      </header>

      {/* Main */}
      <main className="container py-6 pb-24 md:pb-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around py-2">
          {mobileNav.map((item) => {
            const isActive = location.pathname === item.to;
            const isHighlight = item.highlight;

            if (isHighlight) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 -mt-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold text-accent">{item.label}</span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
