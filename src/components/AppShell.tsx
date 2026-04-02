import { NavLink, useLocation } from "react-router-dom";
import { Home, BarChart3, Calendar, Heart, Settings, Users, Play, ClipboardList } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/social", icon: Users, label: "Actu" },
  { to: "/run", icon: Play, label: "Course" },
  { to: "/plan", icon: ClipboardList, label: "Plan" },
  { to: "/health", icon: Heart, label: "Santé" },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-accent/60 bg-accent text-accent-foreground shadow-[0_10px_30px_hsl(var(--accent)/0.18)] backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--foreground)/0.12)]">
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
                      ? "bg-[hsl(var(--foreground)/0.14)] text-accent-foreground"
                      : "text-accent-foreground/75 hover:bg-[hsl(var(--foreground)/0.08)] hover:text-accent-foreground"
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
            className="rounded-lg p-2 text-accent-foreground/80 transition-colors hover:bg-[hsl(var(--foreground)/0.08)] hover:text-accent-foreground"
          >
            <Settings className="h-5 w-5" />
          </NavLink>
        </div>
      </header>

      {/* Main */}
      <main className="container py-6 pb-24 md:pb-6">{children}</main>

      {/* Mobile bottom nav — 5 tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent/30 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5 items-end gap-1 px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const isRun = item.to === "/run";

            if (isRun) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-0.5 py-1 -mt-5"
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
                className={`flex min-w-0 flex-col items-center gap-0.5 py-1 text-xs transition-colors ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
