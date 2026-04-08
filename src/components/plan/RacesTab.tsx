import { ScrollReveal } from "@/components/ScrollReveal";
import { Calendar, Search, MapPin, Mountain, ArrowUpRight, Trophy } from "lucide-react";
import { useState } from "react";

const races = [
  { name: "Marathon de Paris", date: "5 avr. 2026", location: "Paris, France", distance: "42.2km", terrain: "Route", difficulty: "Moyen", registered: true },
  { name: "UTMB CCC", date: "28 aout 2026", location: "Chamonix, France", distance: "101km", terrain: "Trail", difficulty: "Expert", registered: false },
  { name: "Semi-marathon de Berlin", date: "12 avr. 2026", location: "Berlin, Allemagne", distance: "21.1km", terrain: "Route", difficulty: "Facile", registered: false },
  { name: "Trail des Vosges", date: "14 juin 2026", location: "Alsace, France", distance: "52km", terrain: "Trail", difficulty: "Difficile", registered: false },
  { name: "10K d'Amsterdam", date: "3 mai 2026", location: "Amsterdam, Pays-Bas", distance: "10km", terrain: "Route", difficulty: "Facile", registered: false },
];

const difficultyColor: Record<string, string> = {
  Facile: "text-accent", Moyen: "text-yellow-400", Difficile: "text-orange-400", Expert: "text-red-400",
};

export default function RacesTab() {
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
          placeholder="Rechercher par nom, lieu, distance..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 ring-accent transition"
        />
      </div>
      <div className="space-y-3">
        {filtered.map((race, i) => (
          <ScrollReveal key={race.name} delay={i === 0 ? 0 : i < 3 ? 0.05 : 0}>
            <div className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{race.name}</h3>
                    {race.registered && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">INSCRIT</span>}
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
                <button className="flex items-center gap-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-transform active:scale-[0.97]">
                  <Trophy className="h-3 w-3" /> Suis-je pret ?
                </button>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
