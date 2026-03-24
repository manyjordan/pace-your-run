import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, Square, MapPin, Clock, Zap, Heart, ChevronUp,
  Map, Route, Star, TrendingUp, Users,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

/* ── Explore data ── */
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

/* ── Run component ── */
export default function Run() {
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const pace = distance > 0 ? elapsed / 60 / distance : 0;
  const formatPace = (p: number) =>
    p > 0 ? `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, "0")}` : "--:--";

  const tick = useCallback(() => {
    setElapsed((e) => e + 1);
    setDistance((d) => d + 0.002 + Math.random() * 0.001);
    setHeartRate(145 + Math.floor(Math.random() * 20));
  }, []);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status, tick]);

  const start = () => setStatus("running");
  const pause = () => setStatus("paused");
  const resume = () => setStatus("running");
  const stop = () => { setStatus("idle"); setElapsed(0); setDistance(0); setHeartRate(0); };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course & Explore</h1>
          <p className="text-sm text-muted-foreground">Enregistrez votre course ou découvrez des parcours</p>
        </div>
      </ScrollReveal>

      <Tabs defaultValue="run" className="space-y-4">
        <ScrollReveal delay={0.05}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="run"><Play className="h-4 w-4 mr-1.5" /> Course</TabsTrigger>
            <TabsTrigger value="explore"><Map className="h-4 w-4 mr-1.5" /> Explorer</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        {/* RUN TAB */}
        <TabsContent value="run" className="space-y-6">
          <ScrollReveal delay={0.05}>
            <Card className="border-accent/30">
              <CardContent className="p-6 flex flex-col items-center space-y-6">
                <div className="text-6xl font-black tracking-tighter tabular-nums text-foreground" style={{ lineHeight: 1.1 }}>
                  {formatTime(elapsed)}
                </div>
                <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> Distance</div>
                    <div className="text-xl font-bold tabular-nums">{distance.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">km</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Zap className="h-3 w-3" /> Allure</div>
                    <div className="text-xl font-bold tabular-nums">{formatPace(pace)}</div>
                    <div className="text-[10px] text-muted-foreground">/km</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Heart className="h-3 w-3" /> FC</div>
                    <div className="text-xl font-bold tabular-nums">{heartRate || "--"}</div>
                    <div className="text-[10px] text-muted-foreground">bpm</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {status === "idle" && (
                    <Button size="lg" onClick={start} className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25">
                      <Play className="h-7 w-7 ml-0.5" />
                    </Button>
                  )}
                  {status === "running" && (
                    <>
                      <Button size="lg" variant="outline" onClick={stop} className="h-14 w-14 rounded-full border-destructive text-destructive hover:bg-destructive/10"><Square className="h-5 w-5" /></Button>
                      <Button size="lg" onClick={pause} className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"><Pause className="h-7 w-7" /></Button>
                    </>
                  )}
                  {status === "paused" && (
                    <>
                      <Button size="lg" variant="outline" onClick={stop} className="h-14 w-14 rounded-full border-destructive text-destructive hover:bg-destructive/10"><Square className="h-5 w-5" /></Button>
                      <Button size="lg" onClick={resume} className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"><Play className="h-7 w-7 ml-0.5" /></Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {elapsed > 0 && (
            <ScrollReveal delay={0.1}>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Splits</h3><ChevronUp className="h-4 w-4 text-muted-foreground" /></div>
                  {Array.from({ length: Math.floor(distance) }, (_, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <span className="text-muted-foreground">Km {i + 1}</span>
                      <span className="font-bold tabular-nums">{Math.floor(4 + Math.random() * 2)}:{String(Math.floor(Math.random() * 60)).padStart(2, "0")} /km</span>
                    </div>
                  ))}
                  {Math.floor(distance) === 0 && <p className="text-xs text-muted-foreground text-center py-2">Le premier split apparaîtra à 1 km</p>}
                </CardContent>
              </Card>
            </ScrollReveal>
          )}

          {status === "idle" && elapsed === 0 && (
            <ScrollReveal delay={0.1}>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Prêt à courir ?</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>📍 GPS connecté — précision élevée</p>
                    <p>⌚ Aucun appareil connecté</p>
                    <p>🌤️ 14°C — conditions idéales</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">Connecter un appareil</Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          )}
        </TabsContent>

        {/* EXPLORE TAB */}
        <TabsContent value="explore" className="space-y-6">
          <ScrollReveal>
            <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
              <div className="text-center text-muted-foreground">
                <Map className="mx-auto h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">Interactive Route Map</p>
                <p className="text-xs opacity-60">Mapbox integration ready</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2"><Route className="h-4 w-4 text-lime" /><h2 className="text-sm font-semibold">Popular Routes Near You</h2></div>
              <div className="space-y-2">
                {routes.map((route, i) => (
                  <ScrollReveal key={route.name} delay={i * 0.06}>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"><Route className="h-4 w-4 text-lime" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{route.name}</p>
                        <p className="text-xs text-muted-foreground">{route.distance} · {route.elevation} · {route.surface}</p>
                      </div>
                      <div className="text-right text-xs">
                        <div className="flex items-center gap-0.5 text-lime"><Star className="h-3 w-3" /><span className="font-semibold tabular-nums">{route.rating}</span></div>
                        <p className="text-muted-foreground">{route.runners.toLocaleString()} runs</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-lime" /><h2 className="text-sm font-semibold">Active Challenges</h2></div>
              <div className="space-y-3">
                {challenges.map((ch) => (
                  <div key={ch.name} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold">{ch.name}</h3>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{ch.participants.toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{ch.description}</p>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="tabular-nums font-medium">{ch.progress}/{ch.target}</span>
                        <span className="text-muted-foreground">{Math.round((ch.progress / ch.target) * 100)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent transition-all duration-1000" style={{ width: `${(ch.progress / ch.target) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </TabsContent>
      </Tabs>
    </div>
  );
}
