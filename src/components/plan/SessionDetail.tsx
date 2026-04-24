import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Map, Zap, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { saveActiveSession } from "@/lib/activeSession";
import type { Session } from "@/lib/trainingPlans";

const intensityColors: Record<string, string> = {
  easy: "hsl(200, 80%, 55%)",
  moderate: "hsl(200, 100%, 50%)",
  tempo: "hsl(38, 92%, 50%)",
  interval: "hsl(0, 72%, 51%)",
  race: "hsl(270, 100%, 60%)",
};

function getPaceMinutes(pace: string) {
  const normalizedPace = pace.replace("/km", "");
  const [minutes, seconds] = normalizedPace.split(":").map(Number);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return null;
  }

  return minutes + seconds / 60;
}

const sessionGuides: Record<string, { description: string; structure: string; benefits: string[] }> = {
  "Intervalles (allure course)": {
    description: "Travail à allure rapide avec récupération active",
    structure: "5-10 min échauffement • 8-10 x 800m à allure objectif (3-4 min de récup jogging facile) • 5 min retour au calme",
    benefits: ["Améliore la VO2max", "Augmente la vitesse maximale", "Prépare spécifiquement à l'allure cible"],
  },
  "Intervalles courts": {
    description: "Accélération brève avec récupération complète",
    structure: "10 min échauffement • 8-12 x 400m rapide (1-2 min récup) • 10 min retour calme",
    benefits: ["Augmente la puissance anaérobie", "Améliore la cadence", "Renforce les jambes"],
  },
  "Tempo léger": {
    description: "Course soutenue juste en-dessous du seuil",
    structure: "10-15 min échauffement • 20-30 min à allure tempo • 10 min récup",
    benefits: ["Augmente le seuil lactique", "Améliore l'endurance", "Bon compromis intensité/volume"],
  },
  "Seuil / tempo": {
    description: "Travail proche du seuil anaérobie",
    structure: "15 min échauffement • 2x (10-15 min à allure seuil, 3-5 min récup) • 10 min retour calme",
    benefits: ["Élève le seuil lactique", "Prépare à l'effort soutenu", "Améliore la capacité cardiovasculaire"],
  },
  "Sortie longue facile": {
    description: "Endurance aérobie progressive",
    structure: "Courez facile pendant toute la durée à une allure où vous pouvez parler",
    benefits: ["Développe l'endurance", "Renforce le cœur", "Construit la base aérobie"],
  },
  "Sortie longue": {
    description: "Endurance aérobie progressive",
    structure: "Courez facile pendant toute la durée à une allure où vous pouvez parler",
    benefits: ["Développe l'endurance", "Renforce le cœur", "Construit la base aérobie"],
  },
  "Sortie régulière": {
    description: "Endurance à allure modérée",
    structure: "Courez à allure confortable et régulière pendant toute la séance",
    benefits: ["Renforce l'endurance", "Améliore l'efficacité", "Construit la base aérobie"],
  },
  "Footing facile": {
    description: "Récupération et construction de base",
    structure: "Courez à allure très facile, vous devez pouvoir parler normalement",
    benefits: ["Récupération active", "Construit l'aérobie", "Prépare aux séances dures"],
  },
  "Récupération": {
    description: "Récupération active légère",
    structure: "Petit jogging tranquille à allure très facile",
    benefits: ["Améliore la circulation", "Favorise la récupération", "Réduit les courbatures"],
  },
  "Récupération active": {
    description: "Récupération active légère",
    structure: "Petit jogging tranquille à allure très facile",
    benefits: ["Améliore la circulation", "Favorise la récupération", "Réduit les courbatures"],
  },
  "Jog de récupération": {
    description: "Récupération active très légère",
    structure: "Très facile, priorité à la détente",
    benefits: ["Récupération", "Maintien du fitness", "Flexibilité"],
  },
};

export default function SessionDetail({
  session,
  planName,
  weekNumber,
  onClose,
}: {
  session: Session;
  planName?: string;
  weekNumber?: number;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const guide = sessionGuides[session.type] || sessionGuides["Footing facile"];
  const sessionColor = intensityColors[session.intensity] || intensityColors.easy;

  const handleLaunchRun = () => {
    saveActiveSession({
      session,
      planName: planName ?? "Plan d'entraînement",
      weekNumber: weekNumber ?? 1,
    });
    navigate("/run");
    onClose();
  };

  const pacePerMinute = getPaceMinutes(session.pace);
  const estimatedTime = pacePerMinute ? session.distance * pacePerMinute : session.duration;
  const hours = Math.floor(estimatedTime / 60);
  const mins = Math.round(estimatedTime % 60);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full rounded-t-2xl rounded-b-none max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3 pb-4 border-b">
            <div className="rounded-lg p-2" style={{ backgroundColor: `${sessionColor}30` }}>
              <Zap className="h-5 w-5" style={{ color: sessionColor }} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{session.type}</h2>
              <p className="text-xs text-muted-foreground">{session.day}</p>
            </div>
            <Badge>{session.distance.toFixed(1)} km</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Map className="h-4 w-4" />
              </div>
              <p className="font-bold">{session.distance.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">km</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
              </div>
              <p className="font-bold">{session.pace}</p>
              <p className="text-xs text-muted-foreground">/km</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
              </div>
              <p className="font-bold">{hours}h {String(mins).padStart(2, "0")}</p>
              <p className="text-xs text-muted-foreground">estimé</p>
            </div>
          </div>

          {session.intervals && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Structure de la séance</p>

              {session.warmupMinutes && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="h-8 w-1 rounded-full bg-blue-400" />
                  <div>
                    <p className="text-sm font-medium">Échauffement</p>
                    <p className="text-xs text-muted-foreground">{session.warmupMinutes} min footing léger</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/10 p-3">
                <div className="h-8 w-1 rounded-full bg-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {session.intervals.reps} ×{" "}
                    {session.intervals.distanceM
                      ? `${session.intervals.distanceM}m`
                      : `${session.intervals.durationSeconds}s`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Allure cible : {session.intervals.pace} /km
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="h-8 w-1 rounded-full bg-yellow-400" />
                <div>
                  <p className="text-sm font-medium">
                    Récupération entre chaque
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.intervals.recoverySeconds >= 60
                      ? `${Math.floor(session.intervals.recoverySeconds / 60)}min`
                      : `${session.intervals.recoverySeconds}s`}{" "}
                    {session.intervals.recoveryType === "jog" ? "trot" :
                      session.intervals.recoveryType === "walk" ? "marche" : "repos"}
                    {session.intervals.recoveryPace && ` · ${session.intervals.recoveryPace} /km`}
                  </p>
                </div>
              </div>

              {session.cooldownMinutes && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="h-8 w-1 rounded-full bg-blue-400" />
                  <div>
                    <p className="text-sm font-medium">Retour au calme</p>
                    <p className="text-xs text-muted-foreground">{session.cooldownMinutes} min footing très léger</p>
                  </div>
                </div>
              )}

              <p className="pt-1 text-center text-xs text-muted-foreground">
                Durée totale estimée : {session.warmupMinutes ?? 0} + {session.intervals.reps} × effort + récup + {session.cooldownMinutes ?? 0} min
              </p>
            </div>
          )}

          {/* Guide détaillé */}
          <div className="space-y-3 bg-accent/5 rounded-lg p-4">
            <div>
              <p className="text-sm font-semibold mb-1">📋 Type de séance</p>
              <p className="text-xs text-muted-foreground">{guide.description}</p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-1">Structure recommandée</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{guide.structure}</p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Bénéfices</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {guide.benefits.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 bg-blue-50/50 border border-blue-200/50 p-2 rounded">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Écoutez votre corps. Si trop facile, augmentez légèrement. Si trop dur, c'est normal les premiers jours.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              className="w-full bg-accent text-accent-foreground"
              onClick={handleLaunchRun}
            >
              <Play className="h-4 w-4 mr-2" />
              Lancer cette séance
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
