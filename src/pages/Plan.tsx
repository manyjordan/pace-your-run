import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar, ChevronRight, Search, MapPin, Mountain, ArrowUpRight, Trophy,
  ShoppingCart, ExternalLink, Star, AlertTriangle, Footprints, Utensils, Droplets, Pill,
} from "lucide-react";
import { useState } from "react";

/* ── Training data ── */
const plan = [
  { day: "Mon", type: "Easy Run", distance: "6km", pace: "5:30", color: "hsl(200, 80%, 55%)" },
  { day: "Tue", type: "Intervals", distance: "10km", pace: "4:15", color: "hsl(0, 72%, 51%)" },
  { day: "Wed", type: "Rest", distance: "—", pace: "—", color: "hsl(var(--muted-foreground))" },
  { day: "Thu", type: "Tempo", distance: "8km", pace: "4:45", color: "hsl(38, 92%, 50%)" },
  { day: "Fri", type: "Easy Run", distance: "5km", pace: "5:30", color: "hsl(200, 80%, 55%)" },
  { day: "Sat", type: "Long Run", distance: "22km", pace: "5:15", color: "hsl(72, 89%, 58%)" },
  { day: "Sun", type: "Recovery", distance: "4km", pace: "6:00", color: "hsl(270, 60%, 60%)" },
];

/* ── Races data ── */
const races = [
  { name: "Paris Marathon", date: "Apr 5, 2026", location: "Paris, France", distance: "42.2km", terrain: "Road", difficulty: "Medium", registered: true },
  { name: "UTMB CCC", date: "Aug 28, 2026", location: "Chamonix, France", distance: "101km", terrain: "Trail", difficulty: "Expert", registered: false },
  { name: "Berlin Half Marathon", date: "Apr 12, 2026", location: "Berlin, Germany", distance: "21.1km", terrain: "Road", difficulty: "Easy", registered: false },
  { name: "Trail des Vosges", date: "Jun 14, 2026", location: "Alsace, France", distance: "52km", terrain: "Trail", difficulty: "Hard", registered: false },
  { name: "Amsterdam 10K", date: "May 3, 2026", location: "Amsterdam, Netherlands", distance: "10km", terrain: "Road", difficulty: "Easy", registered: false },
];

const difficultyColor: Record<string, string> = {
  Easy: "text-lime", Medium: "text-yellow-400", Hard: "text-orange-400", Expert: "text-red-400",
};

/* ── Equipment data ── */
const shoes = [
  { name: "Nike Vaporfly 3", category: "Compétition route", rating: 4.8, price: "259 €", mileage: 342, maxMileage: 600, status: "active" as const, tags: ["Carbone", "Légère", "Route"], recommendation: "Idéale pour vos courses et tempos rapides." },
  { name: "ASICS Gel Nimbus 26", category: "Entraînement quotidien", rating: 4.5, price: "189 €", mileage: 687, maxMileage: 800, status: "warning" as const, tags: ["Amorti", "Confort", "Route"], recommendation: "Bientôt en fin de vie (687/800 km). Pensez à la remplacer." },
  { name: "Salomon Speedcross 6", category: "Trail", rating: 4.6, price: "139 €", mileage: 0, maxMileage: 700, status: "recommended" as const, tags: ["Trail", "Accroche", "Boue"], recommendation: "Recommandée pour vos sorties trail mensuelles." },
];

const nutrition = [
  { name: "Maurten Gel 100", category: "Gel énergie", rating: 4.7, price: "3.50 € /unité", icon: Droplets, description: "Gel hydrogel, tolérance digestive supérieure.", tags: ["Hydrogel", "25g glucides"], partner: true },
  { name: "SIS GO Isotonic", category: "Boisson isotonique", rating: 4.3, price: "1.80 € /sachet", icon: Droplets, description: "Facile à digérer pour intervalles et tempos.", tags: ["Isotonique", "22g glucides"], partner: true },
  { name: "Näak Ultra Energy Bars", category: "Barre énergie", rating: 4.2, price: "2.90 € /barre", icon: Utensils, description: "Protéines de grillon, idéale pour l'ultra.", tags: ["Protéines", "Endurance"], partner: false },
];

const gear = [
  { name: "Leki Micro Trail Pro", category: "Bâtons de trail", rating: 4.7, price: "129 €", description: "Ultra-légers (196g), pliables.", tags: ["Carbone", "Pliable"] },
  { name: "Salomon ADV Skin 12", category: "Sac à dos trail", rating: 4.8, price: "155 €", description: "12L avec flasques avant.", tags: ["12L", "Flasques"] },
  { name: "Garmin Forerunner 265", category: "Montre GPS", rating: 4.6, price: "399 €", description: "AMOLED, HRV, puissance.", tags: ["AMOLED", "HRV"] },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}</span>
    </div>
  );
}

/* ── Training Sub-Tab ── */
function TrainingTab() {
  return (
    <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">{session.distance} · {session.pace}/km</p>
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
      <button className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.97]">
        Generate AI Training Plan
      </button>
    </div>
  );
}

/* ── Races Sub-Tab ── */
function RacesTab() {
  const [search, setSearch] = useState("");
  const filtered = races.filter((r) =>
    `${r.name} ${r.location} ${r.distance} ${r.terrain}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, location, distance..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 ring-lime transition"
        />
      </div>
      <div className="space-y-3">
        {filtered.map((race, i) => (
          <ScrollReveal key={race.name} delay={i * 0.06}>
            <div className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{race.name}</h3>
                    {race.registered && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-lime">REGISTERED</span>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{race.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{race.location}</span>
                    <span className="flex items-center gap-1"><Mountain className="h-3 w-3" />{race.terrain}</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold tabular-nums">{race.distance}</span>
                  <span className={`font-semibold ${difficultyColor[race.difficulty]}`}>{race.difficulty}</span>
                </div>
                <button className="flex items-center gap-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-lime transition-transform active:scale-[0.97]">
                  <Trophy className="h-3 w-3" /> Am I Ready?
                </button>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

/* ── Equipment Sub-Tab ── */
function EquipmentTab() {
  return (
    <Tabs defaultValue="shoes" className="space-y-4">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="shoes"><Footprints className="h-4 w-4 mr-1" /> Chaussures</TabsTrigger>
        <TabsTrigger value="nutrition"><Utensils className="h-4 w-4 mr-1" /> Nutrition</TabsTrigger>
        <TabsTrigger value="gear">Accessoires</TabsTrigger>
      </TabsList>

      <TabsContent value="shoes" className="space-y-3">
        {shoes.map((shoe, i) => {
          const mileagePct = Math.round((shoe.mileage / shoe.maxMileage) * 100);
          return (
            <ScrollReveal key={shoe.name} delay={i * 0.06}>
              <Card className={shoe.status === "warning" ? "border-destructive/40" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{shoe.name}</h3>
                        {shoe.status === "warning" && <Badge variant="destructive" className="text-[10px] px-1.5 py-0"><AlertTriangle className="h-3 w-3 mr-0.5" /> Usure</Badge>}
                        {shoe.status === "recommended" && <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground">Recommandé</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{shoe.category}</div>
                      <StarRating rating={shoe.rating} />
                    </div>
                    <span className="text-sm font-bold whitespace-nowrap">{shoe.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{shoe.recommendation}</p>
                  {shoe.mileage > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Kilométrage</span>
                        <span className={mileagePct > 80 ? "text-destructive font-medium" : ""}>{shoe.mileage} / {shoe.maxMileage} km</span>
                      </div>
                      <Progress value={mileagePct} className="h-1.5" />
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1 flex-wrap">
                      {shoe.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                    </div>
                    {(shoe.status === "recommended" || shoe.status === "warning") && (
                      <Button size="sm" variant="outline" className="text-xs"><ShoppingCart className="h-3 w-3 mr-1" /> Acheter</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          );
        })}
      </TabsContent>

      <TabsContent value="nutrition" className="space-y-3">
        {nutrition.map((item, i) => (
          <ScrollReveal key={item.name} delay={i * 0.06}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      {item.partner && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Partenaire</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                    <StarRating rating={item.rating} />
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">{item.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs"><ExternalLink className="h-3 w-3 mr-1" /> Voir</Button>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </TabsContent>

      <TabsContent value="gear" className="space-y-3">
        {gear.map((item, i) => (
          <ScrollReveal key={item.name} delay={i * 0.06}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                    <StarRating rating={item.rating} />
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">{item.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs"><ShoppingCart className="h-3 w-3 mr-1" /> Acheter</Button>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </TabsContent>
    </Tabs>
  );
}

/* ── Main Plan Page ── */
export default function PlanPage() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
          <p className="text-sm text-muted-foreground">Entraînement, courses et équipement</p>
        </div>
      </ScrollReveal>

      <Tabs defaultValue="training" className="space-y-4">
        <ScrollReveal delay={0.05}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="training"><Calendar className="h-4 w-4 mr-1" /> Plan</TabsTrigger>
            <TabsTrigger value="races"><Trophy className="h-4 w-4 mr-1" /> Courses</TabsTrigger>
            <TabsTrigger value="equipment"><Footprints className="h-4 w-4 mr-1" /> Équipement</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="training"><TrainingTab /></TabsContent>
        <TabsContent value="races"><RacesTab /></TabsContent>
        <TabsContent value="equipment"><EquipmentTab /></TabsContent>
      </Tabs>
    </div>
  );
}
