import { ScrollReveal } from "@/components/ScrollReveal";
import { Calendar, ChevronRight } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const plan = [
  { day: "Mon", type: "Easy Run", distance: "6km", pace: "5:30", color: "hsl(200, 80%, 55%)" },
  { day: "Tue", type: "Intervals", distance: "10km", pace: "4:15", color: "hsl(0, 72%, 51%)" },
  { day: "Wed", type: "Rest", distance: "—", pace: "—", color: "hsl(var(--muted-foreground))" },
  { day: "Thu", type: "Tempo", distance: "8km", pace: "4:45", color: "hsl(38, 92%, 50%)" },
  { day: "Fri", type: "Easy Run", distance: "5km", pace: "5:30", color: "hsl(200, 80%, 55%)" },
  { day: "Sat", type: "Long Run", distance: "22km", pace: "5:15", color: "hsl(72, 89%, 58%)" },
  { day: "Sun", type: "Recovery", distance: "4km", pace: "6:00", color: "hsl(270, 60%, 60%)" },
];

const Training = () => (
  <div className="space-y-6">
    <ScrollReveal>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Training Planner</h1>
      <p className="text-sm text-muted-foreground">Week 12 · Marathon Prep · 18 days to race</p>
    </ScrollReveal>

    <ScrollReveal>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-lime" />
          <h2 className="text-sm font-semibold">This Week</h2>
        </div>
        <div className="space-y-2">
          {plan.map((session, i) => (
            <ScrollReveal key={session.day} delay={i * 0.05}>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: session.color }} />
                <div className="w-10 text-xs font-semibold text-muted-foreground">{session.day}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{session.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.distance} · {session.pace}/km
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-accent/10 p-3 text-center text-xs text-lime font-medium">
          Weekly total: 55km · 4h 48m estimated
        </div>
      </div>
    </ScrollReveal>

    <ScrollReveal>
      <button className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.97]">
        Generate AI Training Plan
      </button>
    </ScrollReveal>
  </div>
);

export default Training;
