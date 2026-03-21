import { ScrollReveal } from "@/components/ScrollReveal";
import { RecoveryRing } from "@/components/RecoveryRing";
import {
  ArrowUpRight,
  Clock,
  Flame,
  Heart,
  Mountain,
  Route,
  TrendingUp,
  Zap,
  Calendar,
  Play,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const weeklyData = [
  { day: "Mon", km: 8.2 },
  { day: "Tue", km: 0 },
  { day: "Wed", km: 12.5 },
  { day: "Thu", km: 6.1 },
  { day: "Fri", km: 0 },
  { day: "Sat", km: 18.3 },
  { day: "Sun", km: 5.0 },
];

const statCards = [
  { label: "Distance", value: "50.1", unit: "km", icon: Route, change: "+12%" },
  { label: "Duration", value: "4h 23m", unit: "", icon: Clock, change: "+8%" },
  { label: "Elevation", value: "482", unit: "m", icon: Mountain, change: "+5%" },
  { label: "Avg HR", value: "148", unit: "bpm", icon: Heart, change: "-3%" },
];

const upcomingSessions = [
  { type: "Tempo Run", distance: "8km", pace: "4:45/km", day: "Tomorrow", color: "hsl(var(--lime))" },
  { type: "Easy Recovery", distance: "5km", pace: "5:30/km", day: "Wednesday", color: "hsl(38, 92%, 50%)" },
  { type: "Interval Training", distance: "10km", pace: "4:15/km", day: "Friday", color: "hsl(0, 72%, 51%)" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Good morning, <span className="text-lime">Alex</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Week 12 of Marathon Training · 18 days to race day
          </p>
        </div>
      </ScrollReveal>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 0.08}>
            <div className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg">
              <div className="flex items-center justify-between">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex items-center gap-0.5 text-xs font-medium text-lime">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tabular-nums">{stat.value}</span>
                <span className="ml-1 text-sm text-muted-foreground">{stat.unit}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label} this week</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Weekly volume chart */}
        <ScrollReveal className="md:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Weekly Volume</h2>
                <p className="text-xs text-muted-foreground">Distance per day</p>
              </div>
              <div className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-semibold text-lime">
                50.1 km total
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(72, 89%, 58%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(72, 89%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="km"
                    stroke="hsl(72, 89%, 58%)"
                    strokeWidth={2.5}
                    fill="url(#limeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        {/* Recovery ring */}
        <ScrollReveal delay={0.1}>
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Recovery Status</h2>
            <RecoveryRing
              value={72}
              max={100}
              color="hsl(72, 89%, 58%)"
              label="Ready to Train"
              sublabel="/ 100"
            />
            <div className="mt-4 flex gap-4 text-center text-xs">
              <div>
                <p className="font-semibold tabular-nums">62ms</p>
                <p className="text-muted-foreground">HRV</p>
              </div>
              <div>
                <p className="font-semibold tabular-nums">48bpm</p>
                <p className="text-muted-foreground">RHR</p>
              </div>
              <div>
                <p className="font-semibold tabular-nums">7h 24m</p>
                <p className="text-muted-foreground">Sleep</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Today's session + upcoming */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's recommended */}
        <ScrollReveal>
          <div className="overflow-hidden rounded-xl border-2 border-accent bg-card">
            <div className="bg-accent/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-lime" />
                <span className="text-sm font-semibold">Today's Session</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold">Long Run</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                18km at 5:15/km · Easy effort with last 3km at marathon pace
              </p>
              <div className="mt-4 flex gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="tabular-nums">18.0 km</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="tabular-nums">~1h 35m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="tabular-nums">~1,050 kcal</span>
                </div>
              </div>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.97]">
                <Play className="h-4 w-4" />
                Start Run
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Upcoming sessions */}
        <ScrollReveal delay={0.08}>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Upcoming Sessions</h2>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.type}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className="h-10 w-1 rounded-full"
                    style={{ backgroundColor: session.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{session.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.distance} · {session.pace}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{session.day}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Race countdown */}
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-xl bg-accent p-6 text-accent-foreground">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Next Race
            </p>
            <h3 className="mt-1 text-xl font-bold">Paris Marathon 2026</h3>
            <p className="mt-1 text-sm opacity-80">April 5, 2026 · Paris, France</p>
            <div className="mt-4 flex gap-6">
              {[
                { n: 18, l: "days" },
                { n: 7, l: "hours" },
                { n: 42, l: "min" },
              ].map((t) => (
                <div key={t.l} className="text-center">
                  <p className="text-2xl font-black tabular-nums">{t.n}</p>
                  <p className="text-xs font-medium uppercase opacity-60">{t.l}</p>
                </div>
              ))}
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-5 w-5 opacity-40" />
        </div>
      </ScrollReveal>
    </div>
  );
};

export default Dashboard;
