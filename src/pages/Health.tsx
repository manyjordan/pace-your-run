import { ScrollReveal } from "@/components/ScrollReveal";
import { useState } from "react";
import { Heart, Activity, Moon, Clock } from "lucide-react";

const bodyParts = [
  { id: "knee", label: "Knee", x: 48, y: 62, issues: ["Runner's Knee", "IT Band Syndrome", "Meniscus"] },
  { id: "shin", label: "Shin", x: 45, y: 72, issues: ["Shin Splints", "Stress Fracture"] },
  { id: "ankle", label: "Ankle", x: 42, y: 82, issues: ["Ankle Sprain", "Peroneal Tendinitis"] },
  { id: "foot", label: "Foot", x: 42, y: 90, issues: ["Plantar Fasciitis", "Metatarsal Stress Fracture"] },
  { id: "hip", label: "Hip", x: 42, y: 48, issues: ["Hip Flexor Strain", "Bursitis"] },
  { id: "calf", label: "Calf", x: 55, y: 72, issues: ["Calf Strain", "Achilles Tendinitis"] },
  { id: "hamstring", label: "Hamstring", x: 55, y: 55, issues: ["Hamstring Strain", "Proximal Tendinopathy"] },
];

const Health = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedPart = bodyParts.find((p) => p.id === selected);

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Health & Injury Center</h1>
        <p className="text-sm text-muted-foreground">Monitor recovery and manage injuries</p>
      </ScrollReveal>

      {/* Quick health stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Resting HR", value: "48 bpm", icon: Heart, color: "text-red-400" },
          { label: "HRV", value: "62 ms", icon: Activity, color: "text-lime" },
          { label: "Sleep", value: "7h 24m", icon: Moon, color: "text-blue-400" },
          { label: "Recovery", value: "72%", icon: Clock, color: "text-yellow-400" },
        ].map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 0.06}>
            <div className="rounded-xl border border-border bg-card p-4">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <p className="mt-2 text-xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Body map */}
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Injury Symptom Checker</h2>
          <p className="mb-4 text-xs text-muted-foreground">Tap a body area to check common issues</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative mx-auto h-80 w-48">
              {/* Simplified body outline */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-full w-full">
                  {/* Head */}
                  <div className="absolute left-1/2 top-[4%] h-8 w-8 -translate-x-1/2 rounded-full border-2 border-muted-foreground/30" />
                  {/* Torso */}
                  <div className="absolute left-1/2 top-[16%] h-24 w-16 -translate-x-1/2 rounded-lg border-2 border-muted-foreground/30" />
                  {/* Legs */}
                  <div className="absolute left-[32%] top-[48%] h-40 w-6 rounded-lg border-2 border-muted-foreground/30" />
                  <div className="absolute right-[32%] top-[48%] h-40 w-6 rounded-lg border-2 border-muted-foreground/30" />

                  {/* Tap points */}
                  {bodyParts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => setSelected(selected === part.id ? null : part.id)}
                      className={`absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${
                        selected === part.id
                          ? "border-accent bg-accent/30 scale-125"
                          : "border-muted-foreground/40 bg-muted-foreground/10 hover:bg-accent/20 hover:border-accent"
                      }`}
                      style={{ left: `${part.x}%`, top: `${part.y}%` }}
                      title={part.label}
                    >
                      <span className="sr-only">{part.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {selectedPart ? (
                <div className="animate-count-up">
                  <h3 className="text-sm font-bold">{selectedPart.label} Issues</h3>
                  <div className="mt-3 space-y-2">
                    {selectedPart.issues.map((issue) => (
                      <div
                        key={issue}
                        className="rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted/50"
                      >
                        <p className="font-medium">{issue}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tap to learn more about symptoms, treatment, and return-to-run protocol
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  ← Select a body area to check for common injuries
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default Health;
