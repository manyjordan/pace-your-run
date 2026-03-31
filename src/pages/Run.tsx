import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, Square, MapPin, Zap, Heart, ChevronUp,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

const COMMUNITY_POSTS_KEY = "pace-community-posts";

type CommunityPost = {
  id: number;
  user: string;
  initials: string;
  time: string;
  type: "run" | "race";
  title: string;
  description: string;
  stats: { distance: string; pace: string; duration: string; elevation: string };
  gpsTrace?: Array<{ lat: number; lng: number; time: number }>;
  likes: number;
  comments: number;
  liked: boolean;
};

/* ── Run component ── */
export default function Run() {
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [gpsTrace, setGpsTrace] = useState<Array<{ lat: number; lng: number; time: number }>>([]);
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
    setGpsTrace((t) => [...t, {
      lat: 48.8566 + (Math.random() - 0.5) * 0.01,
      lng: 2.3522 + (Math.random() - 0.5) * 0.01,
      time: Date.now(),
    }]);
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
  const publishRunToCommunity = () => {
    if (elapsed <= 0 || distance <= 0) return;
    const post: CommunityPost = {
      id: Date.now(),
      user: "Moi",
      initials: "MOI",
      time: "A l'instant",
      type: "run",
      title: "Nouvelle course enregistree",
      description: `Je viens de terminer ${distance.toFixed(2)} km en ${formatTime(elapsed)}.`,
      stats: {
        distance: `${distance.toFixed(2)} km`,
        pace: `${formatPace(pace)} /km`,
        duration: formatTime(elapsed),
        elevation: `+${Math.max(8, Math.round(distance * 7))} m`,
      },
      gpsTrace: gpsTrace,
      likes: 0,
      comments: 0,
      liked: false,
    };
    const raw = window.localStorage.getItem(COMMUNITY_POSTS_KEY);
    const existing = raw ? JSON.parse(raw) as CommunityPost[] : [];
    window.localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify([post, ...existing]));
    window.dispatchEvent(new Event("pace-community-updated"));
  };

  const stop = () => {
    if (status !== "idle" && elapsed > 0 && distance > 0) {
      publishRunToCommunity();
    }
    setStatus("idle");
    setElapsed(0);
    setDistance(0);
    setHeartRate(0);
    setGpsTrace([]);
  };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course</h1>
          <p className="text-sm text-muted-foreground">Enregistrez votre course en temps réel</p>
        </div>
      </ScrollReveal>

      <div className="space-y-6">
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
                <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Intervalles</h3><ChevronUp className="h-4 w-4 text-muted-foreground" /></div>
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
      </div>
    </div>
  );
}
