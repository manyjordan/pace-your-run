import { ScrollReveal } from "@/components/ScrollReveal";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { Award, TrendingUp, Footprints, AlertTriangle } from "lucide-react";

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

const Performance = () => {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Performance Hub</h1>
        <p className="text-sm text-muted-foreground">Track your long-term progress and records</p>
      </ScrollReveal>

      {/* VO2max + Weekly volume */}
      <div className="grid gap-6 md:grid-cols-2">
        <ScrollReveal>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">VO2max Trend</h2>
                <p className="text-xs text-muted-foreground">Estimated from pace & HR</p>
              </div>
              <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-lime tabular-nums">
                52.8 ml/kg
              </span>
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
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Weekly Volume</h2>
              <p className="text-xs text-muted-foreground">Kilometers per week</p>
            </div>
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

      {/* PRs */}
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold">Personal Records</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {prs.map((pr, i) => (
              <ScrollReveal key={pr.event} delay={i * 0.06}>
                <div className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
                  <p className="text-xs font-medium text-muted-foreground">{pr.event}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{pr.time}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{pr.date}</span>
                    <span className="flex items-center gap-0.5 font-semibold text-lime">
                      <TrendingUp className="h-3 w-3" />
                      {pr.improvement}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ACWR */}
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-lime" />
              <div>
                <h2 className="text-sm font-semibold">Acute:Chronic Workload Ratio</h2>
                <p className="text-xs text-muted-foreground">Sweet spot: 0.8 – 1.3</p>
              </div>
            </div>
            <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-lime tabular-nums">
              1.12
            </span>
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
                {/* Danger zone reference */}
                <Area type="monotone" dataKey="ratio" stroke="hsl(72, 89%, 58%)" strokeWidth={2.5} fill="url(#acwrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ScrollReveal>

      {/* Shoe tracker */}
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Footprints className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold">Shoe Mileage</h2>
          </div>
          <div className="space-y-4">
            {shoes.map((shoe) => (
              <div key={shoe.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{shoe.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {shoe.km}/{shoe.max} km
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(shoe.km / shoe.max) * 100}%`,
                      backgroundColor: shoe.km > 700 ? "hsl(0, 72%, 51%)" : shoe.color,
                    }}
                  />
                </div>
                {shoe.km > 700 && (
                  <p className="mt-1 text-xs text-destructive">⚠ Consider replacing soon</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default Performance;
