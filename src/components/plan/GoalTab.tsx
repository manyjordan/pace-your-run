import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Scale, Route, Timer, ChevronRight, Check, Flame } from "lucide-react";
import { useState } from "react";

type GoalType = "weight" | "distance" | "time" | null;

const goalOptions = [
  {
    type: "weight" as const,
    icon: Scale,
    title: "Perdre du poids",
    description: "Brûler des calories et améliorer votre composition corporelle grâce à un plan adapté.",
    example: "Ex : perdre 5 kg en 12 semaines",
  },
  {
    type: "distance" as const,
    icon: Route,
    title: "Objectif de distance",
    description: "Préparez-vous pour une distance cible : 10K, semi, marathon, ultra…",
    example: "Ex : finir mon premier marathon",
  },
  {
    type: "time" as const,
    icon: Timer,
    title: "Objectif de temps",
    description: "Améliorez votre chrono sur une distance donnée avec un plan de vitesse ciblé.",
    example: "Ex : passer sous les 1h45 au semi",
  },
];

/* Mock active goal */
const activeGoal = {
  type: "time" as const,
  label: "Semi-marathon en moins de 1h45",
  targetDate: "12 avril 2026",
  weeksLeft: 3,
  totalWeeks: 12,
  milestones: [
    { label: "Base aérobie (6 sem.)", done: true },
    { label: "Phase tempo (3 sem.)", done: true },
    { label: "Phase vitesse (2 sem.)", done: false, current: true },
    { label: "Affûtage (1 sem.)", done: false },
  ],
  adaptations: [
    { area: "Plan", detail: "Séances de fractionné court (200m/400m) ajoutées" },
    { area: "Courses", detail: "Berlin Half Marathon recommandé comme objectif" },
    { area: "Équipement", detail: "Nike Vaporfly 3 recommandée pour la course" },
    { area: "Nutrition", detail: "Stratégie gel toutes les 30 min en course" },
  ],
};

export default function GoalTab() {
  const [selected, setSelected] = useState<GoalType>(activeGoal.type);
  const [hasGoal] = useState(true); // mock: user already has a goal

  const progressPct = Math.round(((activeGoal.totalWeeks - activeGoal.weeksLeft) / activeGoal.totalWeeks) * 100);

  return (
    <div className="space-y-4">
      {/* Active Goal Summary */}
      {hasGoal && (
        <ScrollReveal>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-accent/20 p-2">
                  <Target className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{activeGoal.label}</p>
                  <p className="text-xs text-muted-foreground">Échéance : {activeGoal.targetDate} · {activeGoal.weeksLeft} semaines restantes</p>
                </div>
                <Badge className="bg-accent text-accent-foreground text-[10px] shrink-0">{progressPct}%</Badge>
              </div>

              <Progress value={progressPct} className="h-2" />

              {/* Milestones */}
              <div className="space-y-1.5">
                {activeGoal.milestones.map((m, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${m.current ? "text-accent font-semibold" : m.done ? "text-muted-foreground line-through" : "text-muted-foreground/60"}`}>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${m.done ? "bg-accent border-accent" : m.current ? "border-accent" : "border-muted-foreground/30"}`}>
                      {m.done && <Check className="h-2.5 w-2.5 text-accent-foreground" />}
                      {m.current && <Flame className="h-2.5 w-2.5 text-accent" />}
                    </div>
                    {m.label}
                  </div>
                ))}
              </div>

              {/* How goal adapts the rest */}
              <div className="rounded-lg bg-card border border-border p-3 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Adapté à votre objectif</p>
                {activeGoal.adaptations.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{a.area}</Badge>
                    <span className="text-muted-foreground">{a.detail}</span>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs">
                Modifier mon objectif
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {/* Goal Type Selection */}
      <ScrollReveal delay={0.05}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {hasGoal ? "Changer de type d'objectif" : "Choisir votre objectif"}
        </p>
      </ScrollReveal>

      <div className="space-y-3">
        {goalOptions.map((goal, i) => {
          const Icon = goal.icon;
          const isSelected = selected === goal.type;
          return (
            <ScrollReveal key={goal.type} delay={i * 0.06}>
              <button
                onClick={() => setSelected(goal.type)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-accent bg-accent/10 shadow-md"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${isSelected ? "bg-accent/20" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${isSelected ? "text-accent" : ""}`}>{goal.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1 italic">{goal.example}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 mt-1 shrink-0 ${isSelected ? "text-accent" : "text-muted-foreground/40"}`} />
                </div>
              </button>
            </ScrollReveal>
          );
        })}
      </div>

      {!hasGoal && (
        <Button className="w-full bg-accent text-accent-foreground" disabled={!selected}>
          <Target className="h-4 w-4 mr-2" />
          Définir cet objectif
        </Button>
      )}
    </div>
  );
}
