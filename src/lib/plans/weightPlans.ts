import type { TrainingPlan } from "./types";

export const weightPlans: TrainingPlan[] = [
  {
    id: "weight_beginner_3days_8weeks",
    name: "Perte de poids — Débutant (3 j, 8 sem.)",
    goal: "weight",
    level: "beginner",
    daysPerWeek: 3,
    durationWeeks: 8,
    summary: "Ce bloc privilégie des sorties faciles et un tempo court pour brûler des calories sans saturer le système nerveux. Des semaines de relâchement et un affûtage final sécurisent la régularité.",
    equipmentTips: ["Lampe frontale légère pour les sorties du soir après le travail.","Ceinture minimaliste ou gilet pour téléphone et clés.","Bouteille souple 500 ml pour les sorties longues du week-end."],
    nutritionTips: ["Après chaque séance, associez protéines et glucides dans l’heure.","Réduisez les grignotages liquides (sodas) en semaine pour voir l’effet sur la forme.","Buvez un grand verre d’eau au réveil les jours de course."],
    shoeTips: ["Chaussure amortie neutre pour les sorties longues dominicales.","Alternez deux modèles si vous courez 3 fois par semaine régulièrement."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.7, pace: "7:00/km", duration: 40, description: "Endurance douce, semaine 1 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 4.3, pace: "6:15/km", duration: 27, description: "Bloc continu modéré, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.7, pace: "7:30/km", duration: 43, description: "Volume dominical calme, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 15.7,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "7:00/km", duration: 44, description: "Endurance douce, semaine 2 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 4.7, pace: "6:15/km", duration: 29, description: "Bloc continu modéré, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.3, pace: "7:30/km", duration: 47, description: "Volume dominical calme, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 17.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7, pace: "7:00/km", duration: 49, description: "Endurance douce, semaine 3 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 5.2, pace: "6:15/km", duration: 33, description: "Bloc continu modéré, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7, pace: "7:30/km", duration: 53, description: "Volume dominical calme, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 19.2,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.6, pace: "7:00/km", duration: 39, description: "Endurance douce, semaine 4 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 4.2, pace: "6:15/km", duration: 26, description: "Bloc continu modéré, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.6, pace: "7:30/km", duration: 42, description: "Volume dominical calme, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 15.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.3, pace: "7:00/km", duration: 51, description: "Endurance douce, semaine 5 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 5.5, pace: "6:15/km", duration: 34, description: "Bloc continu modéré, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.3, pace: "7:30/km", duration: 55, description: "Volume dominical calme, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 20.1,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.9, pace: "7:00/km", duration: 55, description: "Endurance douce, semaine 6 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 5.9, pace: "6:15/km", duration: 37, description: "Bloc continu modéré, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.9, pace: "7:30/km", duration: 59, description: "Volume dominical calme, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 21.7,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.6, pace: "7:00/km", duration: 39, description: "Endurance douce, semaine 7 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 4.2, pace: "6:15/km", duration: 26, description: "Bloc continu modéré, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.6, pace: "7:30/km", duration: 42, description: "Volume dominical calme, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 15.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 4.8, pace: "7:00/km", duration: 34, description: "Endurance douce, semaine 8 — conversation possible.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 3.6, pace: "6:15/km", duration: 23, description: "Bloc continu modéré, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 4.8, pace: "7:30/km", duration: 36, description: "Volume dominical calme, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 13.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "weight_intermediate_4days_12weeks",
    name: "Perte de poids — Intermédiaire (4 j, 12 sem.)",
    goal: "weight",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 12,
    summary: "Quatre sorties hebdo alternent endurance, seuil léger et longue du dimanche pour maximiser la dépense tout en gérant la fatigue. La structure en microcycles évite les semaines plates ou excessives.",
    equipmentTips: ["Montre simple avec chronomètre pour cadencer les blocs au seuil.","Textile technique même par temps frais pour éviter la surchauffe.","Tapis de gainage 10′ après deux séances pour le core."],
    nutritionTips: ["Repas du midi riche en légumes et protéines maigres les jours de seuil.","Évitez l’alcool la veille de la sortie longue du dimanche.","Collation banane + eau 90′ avant la séance du mercredi."],
    shoeTips: ["Modèle polyvalent légèrement plus ferme pour le tempo du mercredi.","Changez de semelle intérieure tous les 6 mois si usage quotidien."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.8, pace: "5:45/km", duration: 56, description: "Sortie relâchée, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 6.6, pace: "5:00/km", duration: 33, description: "2×10′ tempo avec 2′ récup, semaine 1.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 6.6, pace: "6:00/km", duration: 40, description: "Très facile au lendemain du seuil, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.8, pace: "6:15/km", duration: 61, description: "Volume stable, respiration nasale possible, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 32.8,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.7, pace: "5:45/km", duration: 62, description: "Sortie relâchée, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 7.1, pace: "5:00/km", duration: 36, description: "2×10′ tempo avec 2′ récup, semaine 2.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.1, pace: "6:00/km", duration: 43, description: "Très facile au lendemain du seuil, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.7, pace: "6:15/km", duration: 67, description: "Volume stable, respiration nasale possible, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 35.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.4, pace: "5:45/km", duration: 66, description: "Sortie relâchée, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 7.6, pace: "5:00/km", duration: 38, description: "2×10′ tempo avec 2′ récup, semaine 3.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.6, pace: "6:00/km", duration: 46, description: "Très facile au lendemain du seuil, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.4, pace: "6:15/km", duration: 71, description: "Volume stable, respiration nasale possible, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 38,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.3, pace: "5:45/km", duration: 53, description: "Sortie relâchée, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 6.2, pace: "5:00/km", duration: 31, description: "2×10′ tempo avec 2′ récup, semaine 4.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 6.2, pace: "6:00/km", duration: 37, description: "Très facile au lendemain du seuil, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.3, pace: "6:15/km", duration: 58, description: "Volume stable, respiration nasale possible, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 31,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.9, pace: "5:45/km", duration: 51, description: "Sortie relâchée, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.9, pace: "5:00/km", duration: 30, description: "2×10′ tempo avec 2′ récup, semaine 5.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.9, pace: "6:00/km", duration: 35, description: "Très facile au lendemain du seuil, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.9, pace: "6:15/km", duration: 56, description: "Volume stable, respiration nasale possible, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 29.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.6, pace: "5:45/km", duration: 55, description: "Sortie relâchée, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 6.4, pace: "5:00/km", duration: 32, description: "2×10′ tempo avec 2′ récup, semaine 6.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 6.4, pace: "6:00/km", duration: 38, description: "Très facile au lendemain du seuil, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.6, pace: "6:15/km", duration: 60, description: "Volume stable, respiration nasale possible, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 32,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.3, pace: "5:45/km", duration: 59, description: "Sortie relâchée, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 6.8, pace: "5:00/km", duration: 34, description: "2×10′ tempo avec 2′ récup, semaine 7.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 6.8, pace: "6:00/km", duration: 41, description: "Très facile au lendemain du seuil, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.3, pace: "6:15/km", duration: 64, description: "Volume stable, respiration nasale possible, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 34.2,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.4, pace: "5:45/km", duration: 48, description: "Sortie relâchée, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.6, pace: "5:00/km", duration: 28, description: "2×10′ tempo avec 2′ récup, semaine 8.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.6, pace: "6:00/km", duration: 34, description: "Très facile au lendemain du seuil, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "6:15/km", duration: 53, description: "Volume stable, respiration nasale possible, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 28,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8, pace: "5:45/km", duration: 46, description: "Sortie relâchée, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.3, pace: "5:00/km", duration: 27, description: "2×10′ tempo avec 2′ récup, semaine 9.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.3, pace: "6:00/km", duration: 32, description: "Très facile au lendemain du seuil, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8, pace: "6:15/km", duration: 50, description: "Volume stable, respiration nasale possible, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 26.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.6, pace: "5:45/km", duration: 49, description: "Sortie relâchée, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.8, pace: "5:00/km", duration: 29, description: "2×10′ tempo avec 2′ récup, semaine 10.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.8, pace: "6:00/km", duration: 35, description: "Très facile au lendemain du seuil, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.6, pace: "6:15/km", duration: 54, description: "Volume stable, respiration nasale possible, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 28.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8, pace: "5:45/km", duration: 46, description: "Sortie relâchée, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 5.3, pace: "5:00/km", duration: 27, description: "2×10′ tempo avec 2′ récup, semaine 11.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 5.3, pace: "6:00/km", duration: 32, description: "Très facile au lendemain du seuil, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8, pace: "6:15/km", duration: 50, description: "Volume stable, respiration nasale possible, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 26.6,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.8, pace: "5:45/km", duration: 39, description: "Sortie relâchée, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 4.6, pace: "5:00/km", duration: 23, description: "2×10′ tempo avec 2′ récup, semaine 12.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 4.6, pace: "6:00/km", duration: 28, description: "Très facile au lendemain du seuil, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.8, pace: "6:15/km", duration: 43, description: "Volume stable, respiration nasale possible, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 22.8,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
];
