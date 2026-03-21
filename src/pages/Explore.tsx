import { ScrollReveal } from "@/components/ScrollReveal";
import { Map, Route, TrendingUp, Users, Star } from "lucide-react";

const routes = [
  { name: "Seine Riverside Loop", city: "Paris", distance: "12.4km", elevation: "+45m", surface: "Paved", rating: 4.8, runners: 2847 },
  { name: "Bois de Boulogne Trail", city: "Paris", distance: "8.2km", elevation: "+82m", surface: "Mixed", rating: 4.6, runners: 1523 },
  { name: "Tuileries to Bastille", city: "Paris", distance: "5.1km", elevation: "+12m", surface: "Paved", rating: 4.9, runners: 4102 },
  { name: "Mont Valérien Hill", city: "Paris", distance: "15.8km", elevation: "+234m", surface: "Trail", rating: 4.4, runners: 892 },
];

const challenges = [
  { name: "March Madness", description: "Run 150km this month", progress: 112, target: 150, participants: 12453 },
  { name: "Elevation Hunter", description: "Climb 2,000m total", progress: 1420, target: 2000, participants: 5621 },
];

const Explore = () => (
  <div className="space-y-6">
    <ScrollReveal>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Explore & Community</h1>
      <p className="text-sm text-muted-foreground">Discover routes, join challenges, connect with runners</p>
    </ScrollReveal>

    {/* Map placeholder */}
    <ScrollReveal>
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
        <div className="text-center text-muted-foreground">
          <Map className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">Interactive Route Map</p>
          <p className="text-xs opacity-60">Mapbox integration ready</p>
        </div>
      </div>
    </ScrollReveal>

    {/* Popular routes */}
    <ScrollReveal>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Route className="h-4 w-4 text-lime" />
          <h2 className="text-sm font-semibold">Popular Routes Near You</h2>
        </div>
        <div className="space-y-2">
          {routes.map((route, i) => (
            <ScrollReveal key={route.name} delay={i * 0.06}>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Route className="h-4 w-4 text-lime" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{route.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {route.distance} · {route.elevation} · {route.surface}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <div className="flex items-center gap-0.5 text-lime">
                    <Star className="h-3 w-3" />
                    <span className="font-semibold tabular-nums">{route.rating}</span>
                  </div>
                  <p className="text-muted-foreground">{route.runners.toLocaleString()} runs</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </ScrollReveal>

    {/* Challenges */}
    <ScrollReveal>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-lime" />
          <h2 className="text-sm font-semibold">Active Challenges</h2>
        </div>
        <div className="space-y-3">
          {challenges.map((ch) => (
            <div key={ch.name} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{ch.name}</h3>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {ch.participants.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{ch.description}</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="tabular-nums font-medium">{ch.progress}/{ch.target}</span>
                  <span className="text-muted-foreground">{Math.round((ch.progress / ch.target) * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-1000"
                    style={{ width: `${(ch.progress / ch.target) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  </div>
);

export default Explore;
