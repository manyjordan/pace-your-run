import { ScrollReveal } from "@/components/ScrollReveal";
import { RecoveryRing } from "@/components/RecoveryRing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight, Clock, Flame, Heart, Mountain, Route, TrendingUp, Zap,
  Calendar, Play, Award, Footprints, AlertTriangle, Activity,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

/* ── Dashboard data ── */
const weeklyData = [
  { day: "Mon", km: 8.2 }, { day: "Tue", km: 0 }, { day: "Wed", km: 12.5 },
  { day: "Thu", km: 6.1 }, { day: "Fri", km: 0 }, { day: "Sat", km: 18.3 }, { day: "Sun", km: 5.0 },
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

/* ── Performance data ── */
const vo2Data = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  vo2: 48 + Math.sin(i * 0.5) * 3 + i * 0.4,
}));

const weeklyVolume = Array.from({ length: 16 }, (_, i) => ({
  week: `W${i + 1}`,
  km: 30 + Math.random() * 25 + (i > 10 ? -i * 0.8 : i * 1.2),
}));

const acwrData = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  ratio: 0.8 + Math.sin(i * 0.7) * 0.4 + Math.random() * 0.2,
}));

const prs = [
  { event: "5K", time: "19:42", date: "Oct 12, 2025", improvement: "-0:38" },
  { event: "10K", time: "41:15", date: "Nov 3, 2025", improvement: "-1:12" },
  { event: "Half Marathon", time: "1:32:08", date: "Jan 18, 2026", improvement: "-2:45" },
  { event: "Marathon", time: "3:18:22", date: "Mar 8, 2025", improvement: "First!" },
];

const shoes = [
  { name: "Nike Vaporfly 3", km: 642, max: 800, color: "hsl(72, 89%, 58%)" },
  { name: "Asics Novablast 4", km: 387, max: 800, color: "hsl(200, 80%, 55%)" },
  { name: "Hoka Mach 6", km: 198, max: 800, color: "hsl(38, 92%, 50%)" },
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: 12,
};

/* ── Dashboard Section ── */
function DashboardSection() {
  return (
    <div className="space-y-6">
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

      <div className="grid gap-6 md:grid-cols-3">
        <ScrollReveal className="md:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Weekly Volume</h2>
                <p className="text-xs text-muted-foreground">Distance per day</p>
              </div>
              <div className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-semibold text-lime">50.1 km total</div>
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
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Area type="monotone" dataKey="km" stroke="hsl(72, 89%, 58%)" strokeWidth={2.5} fill="url(#limeGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Recovery Status</h2>
            <RecoveryRing value={72} max={100} color="hsl(72, 89%, 58%)" label="Ready to Train" sublabel="/ 100" />
            <div className="mt-4 flex gap-4 text-center text-xs">
              <div><p className="font-semibold tabular-nums">62ms</p><p className="text-muted-foreground">HRV</p></div>
              <div><p className="font-semibold tabular-nums">48bpm</p><p className="text-muted-foreground">RHR</p></div>
              <div><p className="font-semibold tabular-nums">7h 24m</p><p className="text-muted-foreground">Sleep</p></div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
              <p className="mt-1 text-sm text-muted-foreground">18km at 5:15/km · Easy effort with last 3km at marathon pace</p>
              <div className="mt-4 flex gap-6 text-xs">
                <div className="flex items-center gap-1.5"><Route className="h-3.5 w-3.5 text-muted-foreground" /><span className="tabular-nums">18.0 km</span></div>
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="tabular-nums">~1h 35m</span></div>
                <div className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-muted-foreground" /><span className="tabular-nums">~1,050 kcal</span></div>
              </div>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.97]">
                <Play className="h-4 w-4" /> Start Run
              </button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Upcoming Sessions</h2>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.type} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                  <div className="h-10 w-1 rounded-full" style={{ backgroundColor: session.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{session.type}</p>
                    <p className="text-xs text-muted-foreground">{session.distance} · {session.pace}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{session.day}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div className="relative overflow-hidden rounded-xl bg-accent p-6 text-accent-foreground">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Next Race</p>
            <h3 className="mt-1 text-xl font-bold">Paris Marathon 2026</h3>
            <p className="mt-1 text-sm opacity-80">April 5, 2026 · Paris, France</p>
            <div className="mt-4 flex gap-6">
              {[{ n: 18, l: "days" }, { n: 7, l: "hours" }, { n: 42, l: "min" }].map((t) => (
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
}

/* ── Performance Section ── */
function PerformanceSection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ScrollReveal>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-sm font-semibold">VO2max Trend</h2><p className="text-xs text-muted-foreground">Estimated from pace & HR</p></div>
              <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-lime tabular-nums">52.8 ml/kg</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vo2Data}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="vo2" stroke="hsl(72, 89%, 58%)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4"><h2 className="text-sm font-semibold">Weekly Volume</h2><p className="text-xs text-muted-foreground">Kilometers per week</p></div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyVolume}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={1} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="km" fill="hsl(72, 89%, 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-lime" /><h2 className="text-sm font-semibold">Personal Records</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {prs.map((pr, i) => (
              <ScrollReveal key={pr.event} delay={i * 0.06}>
                <div className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
                  <p className="text-xs font-medium text-muted-foreground">{pr.event}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{pr.time}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{pr.date}</span>
                    <span className="flex items-center gap-0.5 font-semibold text-lime"><TrendingUp className="h-3 w-3" />{pr.improvement}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-lime" />
              <div><h2 className="text-sm font-semibold">Acute:Chronic Workload Ratio</h2><p className="text-xs text-muted-foreground">Sweet spot: 0.8 – 1.3</p></div>
            </div>
            <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-lime tabular-nums">1.12</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acwrData}>
                <defs>
                  <linearGradient id="acwrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(72, 89%, 58%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(72, 89%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0.4, 1.8]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="ratio" stroke="hsl(72, 89%, 58%)" strokeWidth={2.5} fill="url(#acwrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><Footprints className="h-4 w-4 text-lime" /><h2 className="text-sm font-semibold">Shoe Mileage</h2></div>
          <div className="space-y-4">
            {shoes.map((shoe) => (
              <div key={shoe.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{shoe.name}</span>
                  <span className="tabular-nums text-muted-foreground">{shoe.km}/{shoe.max} km</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(shoe.km / shoe.max) * 100}%`, backgroundColor: shoe.km > 700 ? "hsl(0, 72%, 51%)" : shoe.color }} />
                </div>
                {shoe.km > 700 && <p className="mt-1 text-xs text-destructive">⚠ Consider replacing soon</p>}
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

/* ── Main Page ── */
const Dashboard = () => {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Good morning, <span className="text-lime">Alex</span>
          </h1>
          <p className="text-sm text-muted-foreground">Week 12 of Marathon Training · 18 days to race day</p>
        </div>
      </ScrollReveal>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <ScrollReveal delay={0.05}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="dashboard"><Activity className="h-4 w-4 mr-1.5" /> Tableau de bord</TabsTrigger>
            <TabsTrigger value="performance"><TrendingUp className="h-4 w-4 mr-1.5" /> Performance</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="dashboard">
          <DashboardSection />
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
