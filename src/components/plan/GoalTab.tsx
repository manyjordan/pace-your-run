import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Scale, Route, Trophy, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";

type GoalType = "weight" | "race" | "distance";
type RaceType = "marathon" | "semi" | "20k" | "10k" | "5k" | "other";

type ProfileGoalData = {
  weightKg: string;
  goalType: GoalType;
  availableDaysPerWeek: string;
  targetWeightKg: string;
  weightTargetDate: string;
  raceType: RaceType;
  raceDistanceKm: string;
  raceTargetTime: string;
  raceTargetDate: string;
  distanceKm: string;
  distanceTargetDate: string;
};

const STORAGE_KEY = "pace-user-profile-goal";

const defaultData: ProfileGoalData = {
  weightKg: "",
  goalType: "weight",
  availableDaysPerWeek: "",
  targetWeightKg: "",
  weightTargetDate: "",
  raceType: "marathon",
  raceDistanceKm: "42.195",
  raceTargetTime: "",
  raceTargetDate: "",
  distanceKm: "",
  distanceTargetDate: "",
};

const racePresetDistance: Record<RaceType, string> = {
  marathon: "42.195",
  semi: "21.097",
  "20k": "20",
  "10k": "10",
  "5k": "5",
  other: "",
};

const goalOptions = [
  { type: "weight" as const, icon: Scale, title: "Poids", description: "Définissez un poids cible.", color: "text-blue-500", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/50" },
  { type: "race" as const, icon: Trophy, title: "Course", description: "Choisissez votre format de course et un temps cible.", color: "text-purple-500", bgColor: "bg-purple-500/20", borderColor: "border-purple-500/50" },
  { type: "distance" as const, icon: Route, title: "Distance", description: "Fixez une distance et une date objectif.", color: "text-green-500", bgColor: "bg-green-500/20", borderColor: "border-green-500/50" },
];

export default function GoalTab() {
  const [formData, setFormData] = useState<ProfileGoalData>(() => {
    if (typeof window === "undefined") return defaultData;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    try {
      return { ...defaultData, ...JSON.parse(raw) as ProfileGoalData };
    } catch {
      return defaultData;
    }
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [changeWarning, setChangeWarning] = useState<boolean>(false);
  const [isDefining, setIsDefining] = useState<boolean>(!savedAt);
  const [isChanging, setIsChanging] = useState<boolean>(false);

  const activeGoalSummary = useMemo(() => {
    if (formData.goalType === "weight" && formData.targetWeightKg) {
      return `Objectif poids: ${formData.targetWeightKg} kg`;
    }
    if (formData.goalType === "race" && formData.raceDistanceKm) {
      return `Course: ${formData.raceDistanceKm} km${formData.raceTargetTime ? ` (${formData.raceTargetTime})` : ""}${formData.raceTargetDate ? ` le ${formData.raceTargetDate}` : ""}`;
    }
    if (formData.goalType === "distance" && formData.distanceKm) {
      return `Distance: ${formData.distanceKm} km${formData.distanceTargetDate ? ` avant ${formData.distanceTargetDate}` : ""}`;
    }
    return "Complétez votre objectif pour afficher un résumé.";
  }, [formData]);

  const updateField = <K extends keyof ProfileGoalData>(key: K, value: ProfileGoalData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setWarnings([]);
    validateGoal({ ...formData, [key]: value });
  };

  const handleGoalChange = (newGoalType: GoalType) => {
    if (formData.goalType && formData.goalType !== newGoalType && savedAt) {
      setChangeWarning(true);
      setTimeout(() => setChangeWarning(false), 5000);
    }
    updateField("goalType", newGoalType);
  };

  const updateRaceType = (value: RaceType) => {
    setFormData((prev) => {
      const presetKm = racePresetDistance[value];
      return {
        ...prev,
        raceType: value,
        raceDistanceKm: presetKm || prev.raceDistanceKm,
      };
    });
    setWarnings([]);
  };

  const validateGoal = (data: ProfileGoalData) => {
    const warns: string[] = [];

    if (data.goalType === "weight") {
      const currentKg = Number(data.weightKg);
      const targetKg = Number(data.targetWeightKg);
      const daysToTarget = data.weightTargetDate ? Math.ceil((new Date(data.weightTargetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      const weekToTarget = Math.max(1, Math.ceil(daysToTarget / 7));

      if (currentKg && targetKg && currentKg > targetKg) {
        const diffKg = currentKg - targetKg;
        const weeklyLoss = weekToTarget > 0 ? diffKg / weekToTarget : 0;

        if (weeklyLoss > 1) {
          warns.push(`⚠️ Perte de ${weeklyLoss.toFixed(1)} kg/semaine est trop rapide. Maximum recommandé : 0.5-1 kg/semaine`);
        }
        if (weekToTarget < 2) {
          warns.push("⚠️ Délai trop court pour une perte de poids saine. Minimum recommandé : 2 semaines");
        }
      }
    }

    if (data.goalType === "race") {
      const daysToRace = data.raceTargetDate ? Math.ceil((new Date(data.raceTargetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      const weeksToRace = Math.max(1, Math.ceil(daysToRace / 7));
      const raceKm = Number(data.raceDistanceKm) || 0;

      if (raceKm >= 42 && weeksToRace < 8) {
        warns.push("⚠️ Un marathon en moins de 8 semaines n'est pas recommandé. Minimum 10-12 semaines de préparation.");
      }
      if (raceKm >= 21 && weeksToRace < 6) {
        warns.push("⚠️ Un semi-marathon en moins de 6 semaines n'est pas recommandé. Minimum 8-10 semaines.");
      }
      if (raceKm >= 10 && weeksToRace < 4) {
        warns.push("⚠️ Un 10 km en moins de 4 semaines laisse peu de temps. Minimum 5-6 semaines recommandées.");
      }
    }

    setWarnings(warns);
  };

  const saveProfileGoal = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    window.dispatchEvent(new Event("pace-goal-updated"));
    setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    setIsDefining(false);
    setIsChanging(false);
  };

  return (
    <div className="space-y-4">
      {changeWarning && (
        <ScrollReveal>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">Votre objectif a changé ? Le plan généré pour cet objectif écrasera celui en cours.</p>
          </div>
        </ScrollReveal>
      )}

      {/* État initial : Aucun objectif défini */}
      {!savedAt && !isDefining && (
        <ScrollReveal>
          <button
            onClick={() => setIsDefining(true)}
            className="w-full rounded-xl border-2 border-dashed border-accent bg-accent/5 p-6 transition-all hover:bg-accent/10 text-center"
          >
            <Target className="h-8 w-8 mx-auto mb-2 text-accent" />
            <p className="text-sm font-bold text-accent">Définir un objectif</p>
            <p className="text-xs text-muted-foreground mt-1">Commençons par créer votre premier objectif</p>
          </button>
        </ScrollReveal>
      )}

      {/* État : Objectif en cours */}
      {savedAt && !isDefining && !isChanging && (
        <ScrollReveal>
          <Card className={`border-2 ${goalOptions.find(g => g.type === formData.goalType)?.borderColor || "border-border"}`}>
            <CardContent className={`p-4 space-y-3 ${goalOptions.find(g => g.type === formData.goalType)?.bgColor || ""}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-lg ${goalOptions.find(g => g.type === formData.goalType)?.bgColor || "bg-accent/20"} p-2`}>
                  {formData.goalType === "weight" && <Scale className="h-5 w-5 text-blue-500" />}
                  {formData.goalType === "race" && <Trophy className="h-5 w-5 text-purple-500" />}
                  {formData.goalType === "distance" && <Route className="h-5 w-5 text-green-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Objectif en cours</p>
                  <p className="text-xs text-muted-foreground">{activeGoalSummary}</p>
                </div>
                {savedAt && <Badge className="text-[10px] shrink-0" style={{
                  backgroundColor: formData.goalType === "weight" ? "rgb(59, 130, 246, 0.2)" : formData.goalType === "race" ? "rgb(168, 85, 247, 0.2)" : "rgb(34, 197, 94, 0.2)",
                  color: formData.goalType === "weight" ? "rgb(59, 130, 246)" : formData.goalType === "race" ? "rgb(168, 85, 247)" : "rgb(34, 197, 94)"
                }}>Sauvé {savedAt}</Badge>}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsChanging(true)}
              >
                Changer d'objectif
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {/* Bloc de sélection d'objectif */}
      {(isDefining || isChanging) && (
        <>
          <ScrollReveal>
            <p className="text-sm font-semibold">{isChanging ? "Choisir un nouvel objectif" : "Choisir votre objectif"}</p>
          </ScrollReveal>
          <div className="space-y-3">
            {goalOptions.map((goal, i) => {
              const Icon = goal.icon;
              const isSelected = formData.goalType === goal.type;
              return (
                <ScrollReveal key={goal.type} delay={i * 0.06}>
                  <button
                    onClick={() => handleGoalChange(goal.type)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? `${goal.borderColor} ${goal.bgColor} shadow-md`
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 ${isSelected ? goal.bgColor : "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${isSelected ? goal.color : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isSelected ? goal.color : ""}`}>{goal.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        </>
      )}

      {/* Goal-specific info messages - seulement si en train de définir/changer */}
      {(isDefining || isChanging) && formData.goalType === "weight" && (
        <ScrollReveal delay={0.06}>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">💡 Conseils pour une perte de poids saine</p>
              <ul className="space-y-1 ml-2">
                <li>• Objectif : <strong>0.5-1 kg par semaine</strong> maximum</li>
                <li>• Durée minimale : <strong>2 semaines</strong> pour voir des résultats durables</li>
                <li>• Exemple réaliste : passer de 75 kg à 70 kg en <strong>5-10 semaines</strong></li>
              </ul>
            </div>
          </div>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "race" && (
        <ScrollReveal delay={0.06}>
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
            <div className="text-xs text-purple-700 dark:text-purple-300">
              <p className="font-semibold mb-1">💡 Durée minimale de préparation recommandée</p>
              <ul className="space-y-1 ml-2">
                <li>• <strong>Marathon</strong> (42.195 km) : 10-12 semaines minimum</li>
                <li>• <strong>Semi-marathon</strong> (21 km) : 8-10 semaines minimum</li>
                <li>• <strong>10 km</strong> : 5-6 semaines minimum</li>
                <li>• <strong>5 km</strong> : 4 semaines minimum</li>
              </ul>
            </div>
          </div>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "distance" && (
        <ScrollReveal delay={0.06}>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div className="text-xs text-green-700 dark:text-green-300">
              <p className="font-semibold mb-1">💡 Progression de distance</p>
              <ul className="space-y-1 ml-2">
                <li>• Augmentez votre distance de <strong>10% par semaine</strong> maximum</li>
                <li>• Minimum 4 semaines pour atteindre un nouvel objectif</li>
                <li>• Prenez du repos tous les 3 semaines de progression</li>
              </ul>
            </div>
          </div>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "weight" && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {warnings.length > 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2.5 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0 flex-shrink-0" />
                  <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
                    {warnings.map((w, idx) => <p key={idx}>{w}</p>)}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="weightKg">Poids actuel (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  min="25"
                  max="250"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={(e) => updateField("weightKg", e.target.value)}
                  placeholder="Ex: 72.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetWeightKg">Poids cible (kg)</Label>
                <Input
                  id="targetWeightKg"
                  type="number"
                  min="25"
                  max="250"
                  step="0.1"
                  value={formData.targetWeightKg}
                  onChange={(e) => updateField("targetWeightKg", e.target.value)}
                  placeholder="Ex: 68"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightTargetDate">Date cible pour atteindre votre poids</Label>
                <Input
                  id="weightTargetDate"
                  type="date"
                  value={formData.weightTargetDate}
                  onChange={(e) => updateField("weightTargetDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableDaysWeight">Nombre de jours disponibles par semaine pour aller courir</Label>
                <Input
                  id="availableDaysWeight"
                  type="number"
                  min="1"
                  max="7"
                  step="1"
                  value={formData.availableDaysPerWeek}
                  onChange={(e) => updateField("availableDaysPerWeek", e.target.value)}
                  placeholder="Ex: 4"
                />
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "race" && (
        <ScrollReveal delay={0.08}>
          <Card>
            <CardContent className="p-4 space-y-3">
              {warnings.length > 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2.5 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0 flex-shrink-0" />
                  <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
                    {warnings.map((w, idx) => <p key={idx}>{w}</p>)}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Type de course</Label>
                <Select value={formData.raceType} onValueChange={(value) => updateRaceType(value as RaceType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un type de course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marathon">Marathon</SelectItem>
                    <SelectItem value="semi">Semi-marathon</SelectItem>
                    <SelectItem value="20k">20 km</SelectItem>
                    <SelectItem value="10k">10 km</SelectItem>
                    <SelectItem value="5k">5 km</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="raceDistanceKm">Distance (km)</Label>
                <Input
                  id="raceDistanceKm"
                  type="number"
                  min="1"
                  max="300"
                  step="0.1"
                  value={formData.raceDistanceKm}
                  onChange={(e) => updateField("raceDistanceKm", e.target.value)}
                  placeholder="Ex: 21.097"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="raceTargetTime">Temps cible (hh:mm)</Label>
                <Input
                  id="raceTargetTime"
                  value={formData.raceTargetTime}
                  onChange={(e) => updateField("raceTargetTime", e.target.value)}
                  placeholder="Ex: 03:45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="raceTargetDate">Date de la course</Label>
                <Input
                  id="raceTargetDate"
                  type="date"
                  value={formData.raceTargetDate}
                  onChange={(e) => updateField("raceTargetDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableDaysRace">Nombre de jours disponibles par semaine pour aller courir</Label>
                <Input
                  id="availableDaysRace"
                  type="number"
                  min="1"
                  max="7"
                  step="1"
                  value={formData.availableDaysPerWeek}
                  onChange={(e) => updateField("availableDaysPerWeek", e.target.value)}
                  placeholder="Ex: 4"
                />
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      {(isDefining || isChanging) && formData.goalType === "distance" && (
        <ScrollReveal delay={0.08}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="distanceKm">Distance cible (km)</Label>
                <Input
                  id="distanceKm"
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={formData.distanceKm}
                  onChange={(e) => updateField("distanceKm", e.target.value)}
                  placeholder="Ex: 42"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distanceTargetDate">Date cible</Label>
                <Input
                  id="distanceTargetDate"
                  type="date"
                  value={formData.distanceTargetDate}
                  onChange={(e) => updateField("distanceTargetDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableDaysDistance">Nombre de jours disponibles par semaine pour aller courir</Label>
                <Input
                  id="availableDaysDistance"
                  type="number"
                  min="1"
                  max="7"
                  step="1"
                  value={formData.availableDaysPerWeek}
                  onChange={(e) => updateField("availableDaysPerWeek", e.target.value)}
                  placeholder="Ex: 4"
                />
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}

      <Button className="w-full bg-accent text-accent-foreground" onClick={saveProfileGoal}>
        <Target className="h-4 w-4 mr-2" />
        Sauvegarder profil et objectif
      </Button>
    </div>
  );
}
