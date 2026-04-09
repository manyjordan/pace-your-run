import type { TrainingPlan } from "./types";

export const semiPlans: TrainingPlan[] = [
  {
    id: "semi_beginner_3days_16weeks",
    name: "Semi-marathon — Débutant (3 j, 16 sem.)",
    goal: "race",
    targetDistance: "semi",
    level: "beginner",
    daysPerWeek: 3,
    durationWeeks: 16,
    summary: "Le fartlek du jeudi apporte de la variété sans complexifier la séance, tandis que la longue du dimanche progresse lentement vers des durées semi-réalistes. Quatre cycles de quatre semaines rythment la montée en charge et les relâchements.",
    equipmentTips: ["Ceinture porte-flasque pour les longues > 100′ en fin de plan.","Crème solaire même par ciel couvert sur les sorties longues.","Chaussettes double épaisseur si ampoules sur le gros orteil."],
    nutritionTips: ["Tous les trois dimanches, testez un gel sur la longue pour l’habituer.","Repas de récupération avec protéines dans l’heure qui suit la longue.","Limitez les excès de caféine hors séances qualité."],
    shoeTips: ["Chaussure avec amorti généreux pour les dimanches longs.","Prévoyez une paire plus large si le pied gonfle sur les 2 h."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.6, pace: "7:00/km", duration: 67, description: "Travail d’économie, semaine 1.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.6, pace: "6:15/km", duration: 60, description: "1′ rapide / 2′ facile ×10, semaine 1.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.8, pace: "7:30/km", duration: 96, description: "Derniers km à allure semi si prévu, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 32,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.2, pace: "7:00/km", duration: 71, description: "Travail d’économie, semaine 2.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 10.2, pace: "6:15/km", duration: 64, description: "1′ rapide / 2′ facile ×10, semaine 2.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.6, pace: "7:30/km", duration: 102, description: "Derniers km à allure semi si prévu, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 34,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.8, pace: "7:00/km", duration: 76, description: "Travail d’économie, semaine 3.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 10.8, pace: "6:15/km", duration: 68, description: "1′ rapide / 2′ facile ×10, semaine 3.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.4, pace: "7:30/km", duration: 108, description: "Derniers km à allure semi si prévu, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 36,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.6, pace: "7:00/km", duration: 60, description: "Travail d’économie, semaine 4.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.6, pace: "6:15/km", duration: 54, description: "1′ rapide / 2′ facile ×10, semaine 4.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.5, pace: "7:30/km", duration: 86, description: "Derniers km à allure semi si prévu, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 28.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.1, pace: "7:00/km", duration: 64, description: "Travail d’économie, semaine 5.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.1, pace: "6:15/km", duration: 57, description: "1′ rapide / 2′ facile ×10, semaine 5.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.2, pace: "7:30/km", duration: 92, description: "Derniers km à allure semi si prévu, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 30.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.7, pace: "7:00/km", duration: 68, description: "Travail d’économie, semaine 6.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.7, pace: "6:15/km", duration: 61, description: "1′ rapide / 2′ facile ×10, semaine 6.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.9, pace: "7:30/km", duration: 97, description: "Derniers km à allure semi si prévu, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 32.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.2, pace: "7:00/km", duration: 71, description: "Travail d’économie, semaine 7.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 10.2, pace: "6:15/km", duration: 64, description: "1′ rapide / 2′ facile ×10, semaine 7.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.6, pace: "7:30/km", duration: 102, description: "Derniers km à allure semi si prévu, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 34,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.2, pace: "7:00/km", duration: 57, description: "Travail d’économie, semaine 8.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.2, pace: "6:15/km", duration: 51, description: "1′ rapide / 2′ facile ×10, semaine 8.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11, pace: "7:30/km", duration: 83, description: "Derniers km à allure semi si prévu, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 27.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.7, pace: "7:00/km", duration: 61, description: "Travail d’économie, semaine 9.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.7, pace: "6:15/km", duration: 54, description: "1′ rapide / 2′ facile ×10, semaine 9.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.6, pace: "7:30/km", duration: 87, description: "Derniers km à allure semi si prévu, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 29,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.2, pace: "7:00/km", duration: 64, description: "Travail d’économie, semaine 10.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.2, pace: "6:15/km", duration: 57, description: "1′ rapide / 2′ facile ×10, semaine 10.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.2, pace: "7:30/km", duration: 92, description: "Derniers km à allure semi si prévu, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 30.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.8, pace: "7:00/km", duration: 69, description: "Travail d’économie, semaine 11.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 9.8, pace: "6:15/km", duration: 61, description: "1′ rapide / 2′ facile ×10, semaine 11.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 13, pace: "7:30/km", duration: 98, description: "Derniers km à allure semi si prévu, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 32.6,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.8, pace: "7:00/km", duration: 55, description: "Travail d’économie, semaine 12.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 7.8, pace: "6:15/km", duration: 49, description: "1′ rapide / 2′ facile ×10, semaine 12.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "7:30/km", duration: 78, description: "Derniers km à allure semi si prévu, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 26,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.3, pace: "7:00/km", duration: 58, description: "Travail d’économie, semaine 13.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.3, pace: "6:15/km", duration: 52, description: "1′ rapide / 2′ facile ×10, semaine 13.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11, pace: "7:30/km", duration: 83, description: "Derniers km à allure semi si prévu, semaine 13.", intensity: "easy" }
      ],
      totalDistance: 27.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.8, pace: "7:00/km", duration: 62, description: "Travail d’économie, semaine 14.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 8.8, pace: "6:15/km", duration: 55, description: "1′ rapide / 2′ facile ×10, semaine 14.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.7, pace: "7:30/km", duration: 88, description: "Derniers km à allure semi si prévu, semaine 14.", intensity: "easy" }
      ],
      totalDistance: 29.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "7:00/km", duration: 53, description: "Travail d’économie, semaine 15.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 7.6, pace: "6:15/km", duration: 48, description: "1′ rapide / 2′ facile ×10, semaine 15.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.1, pace: "7:30/km", duration: 76, description: "Derniers km à allure semi si prévu, semaine 15.", intensity: "easy" }
      ],
      totalDistance: 25.3,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.5, pace: "7:00/km", duration: 46, description: "Travail d’économie, semaine 16.", intensity: "easy" },
      { day: "Jeudi", type: "Fartlek", distance: 6.5, pace: "6:15/km", duration: 41, description: "1′ rapide / 2′ facile ×10, semaine 16.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.6, pace: "7:30/km", duration: 65, description: "Derniers km à allure semi si prévu, semaine 16.", intensity: "easy" }
      ],
      totalDistance: 21.6,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "semi_intermediate_4days_12weeks",
    name: "Semi-marathon — Intermédiaire (4 j, 12 sem.)",
    goal: "race",
    targetDistance: "semi",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 12,
    summary: "Ce plan transpose la logique 10 km intermédiaire vers la tenue d’allure sur la longue du week-end. Le tempo fractionné du mercredi prépare le rythme demi sans enchaîner deux séances dures consécutives.",
    equipmentTips: ["Gel attaché à la ceinture pour les longues avec blocs au seuil.","Montre avec autonomie > 10 h pour les sorties longues GPS.","T-shirt sans couture pour réduire les frottements sur 18–22 km."],
    nutritionTips: ["Plan hydrique : petite gorgée toutes les 10′ au-delà de 90′.","Cycle glucides 48 h avant une longue importante.","Omega-3 via poisson gras 1–2× par semaine pour l’inflammation."],
    shoeTips: ["Modèle légèrement plus ferme pour les blocs marathon sur longue.","Ne changez pas de drop à moins de 6 semaines de l’objectif."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.5, pace: "5:45/km", duration: 78, description: "Socle aérobie, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 9, pace: "5:00/km", duration: 45, description: "3×6′ à allure 10 km avec 2′ facile, semaine 1.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9, pace: "6:00/km", duration: 54, description: "Jog très lent après le tempo, semaine 1.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 13.5, pace: "6:15/km", duration: 84, description: "Tenue d’allure sur le dernier tiers, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 45,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.6, pace: "5:45/km", duration: 84, description: "Socle aérobie, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 9.7, pace: "5:00/km", duration: 49, description: "3×6′ à allure 10 km avec 2′ facile, semaine 2.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 9.7, pace: "6:00/km", duration: 58, description: "Marche active + très léger footing, semaine 2.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 14.6, pace: "6:15/km", duration: 91, description: "Tenue d’allure sur le dernier tiers, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 48.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.6, pace: "5:45/km", duration: 90, description: "Socle aérobie, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 10.4, pace: "5:00/km", duration: 52, description: "3×6′ à allure 10 km avec 2′ facile, semaine 3.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.4, pace: "6:00/km", duration: 62, description: "Jog très lent après le tempo, semaine 3.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 15.6, pace: "6:15/km", duration: 98, description: "Tenue d’allure sur le dernier tiers, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 52,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.8, pace: "5:45/km", duration: 74, description: "Socle aérobie, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 8.6, pace: "5:00/km", duration: 43, description: "3×6′ à allure 10 km avec 2′ facile, semaine 4.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 8.6, pace: "6:00/km", duration: 52, description: "Marche active + très léger footing, semaine 4.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 12.8, pace: "6:15/km", duration: 80, description: "Tenue d’allure sur le dernier tiers, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 42.8,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.2, pace: "5:45/km", duration: 70, description: "Socle aérobie, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 8.1, pace: "5:00/km", duration: 41, description: "3×6′ à allure 10 km avec 2′ facile, semaine 5.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.1, pace: "6:00/km", duration: 49, description: "Jog très lent après le tempo, semaine 5.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 12.2, pace: "6:15/km", duration: 76, description: "Tenue d’allure sur le dernier tiers, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 40.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.2, pace: "5:45/km", duration: 76, description: "Socle aérobie, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 8.8, pace: "5:00/km", duration: 44, description: "3×6′ à allure 10 km avec 2′ facile, semaine 6.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 8.8, pace: "6:00/km", duration: 53, description: "Marche active + très léger footing, semaine 6.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 13.2, pace: "6:15/km", duration: 83, description: "Tenue d’allure sur le dernier tiers, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 44,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.1, pace: "5:45/km", duration: 81, description: "Socle aérobie, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 9.4, pace: "5:00/km", duration: 47, description: "3×6′ à allure 10 km avec 2′ facile, semaine 7.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.4, pace: "6:00/km", duration: 56, description: "Jog très lent après le tempo, semaine 7.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 14.1, pace: "6:15/km", duration: 88, description: "Tenue d’allure sur le dernier tiers, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 47,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.5, pace: "5:45/km", duration: 66, description: "Socle aérobie, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 7.7, pace: "5:00/km", duration: 39, description: "3×6′ à allure 10 km avec 2′ facile, semaine 8.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 7.7, pace: "6:00/km", duration: 46, description: "Marche active + très léger footing, semaine 8.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 11.5, pace: "6:15/km", duration: 72, description: "Tenue d’allure sur le dernier tiers, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 38.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11, pace: "5:45/km", duration: 63, description: "Socle aérobie, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 7.3, pace: "5:00/km", duration: 37, description: "3×6′ à allure 10 km avec 2′ facile, semaine 9.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.3, pace: "6:00/km", duration: 44, description: "Jog très lent après le tempo, semaine 9.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 11, pace: "6:15/km", duration: 69, description: "Tenue d’allure sur le dernier tiers, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 36.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.9, pace: "5:45/km", duration: 68, description: "Socle aérobie, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 7.9, pace: "5:00/km", duration: 40, description: "3×6′ à allure 10 km avec 2′ facile, semaine 10.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 7.9, pace: "6:00/km", duration: 47, description: "Marche active + très léger footing, semaine 10.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 11.9, pace: "6:15/km", duration: 74, description: "Tenue d’allure sur le dernier tiers, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 39.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.9, pace: "5:45/km", duration: 63, description: "Socle aérobie, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 7.3, pace: "5:00/km", duration: 37, description: "3×6′ à allure 10 km avec 2′ facile, semaine 11.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.3, pace: "6:00/km", duration: 44, description: "Jog très lent après le tempo, semaine 11.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 10.9, pace: "6:15/km", duration: 68, description: "Tenue d’allure sur le dernier tiers, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 36.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.4, pace: "5:45/km", duration: 54, description: "Socle aérobie, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie tempo", distance: 6.2, pace: "5:00/km", duration: 31, description: "3×6′ à allure 10 km avec 2′ facile, semaine 12.", intensity: "tempo" },
      { day: "Jeudi", type: "Repos actif", distance: 6.2, pace: "6:00/km", duration: 37, description: "Marche active + très léger footing, semaine 12.", intensity: "easy" },
      { day: "Samedi", type: "Sortie longue", distance: 9.4, pace: "6:15/km", duration: 59, description: "Tenue d’allure sur le dernier tiers, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 31.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "semi_advanced_5days_12weeks",
    name: "Semi-marathon — Avancé (5 j, 12 sem.)",
    goal: "race",
    targetDistance: "semi",
    level: "advanced",
    daysPerWeek: 5,
    durationWeeks: 12,
    summary: "Cinq sorties par semaine permettent d’alterner vitesse pure, seuil et endurance spécifique sans enchaîner deux stimulations maximales. La longue du dimanche intègre progressivement des portions proches de l’allure objectif demi.",
    equipmentTips: ["Haltères légers pour gainage dynamique les jours de seuil.","Piste ou chemin régulier pour cadencer les 400 m.","Montre avec zones cardiaques pour calibrer le seuil du vendredi."],
    nutritionTips: ["Boisson avec sodium si transpiration importante sur seuil 35′.","Repas protéiné le soir du mercredi après intervalles.","Jeûne partiel évité la veille des doubles séances facile + qualité (ici espacées)."],
    shoeTips: ["Paire plume pour mercredis, chaussure stable pour seuil et longue.","Contrôle visuel du pairage usure / kilométrage toutes les 3 semaines."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.8, pace: "5:00/km", duration: 49, description: "Base, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 9.8, pace: "3:45/km", duration: 37, description: "12×400 m, semaine 1.", intensity: "interval", warmupMinutes: 15, cooldownMinutes: 10, intervals: { reps: 12, distanceM: 400, pace: "3:45", recoverySeconds: 60, recoveryType: "jog", recoveryPace: "5:45" } },
      { day: "Jeudi", type: "Récupération active", distance: 9.8, pace: "5:15/km", duration: 51, description: "Récup, semaine 1.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 9.8, pace: "4:15/km", duration: 42, description: "35′ continus, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.6, pace: "5:30/km", duration: 80, description: "Spécifique demi, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 53.8,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.5, pace: "5:00/km", duration: 53, description: "Base, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 10.5, pace: "3:45/km", duration: 39, description: "12×400 m, semaine 2.", intensity: "interval", warmupMinutes: 15, cooldownMinutes: 10, intervals: { reps: 12, distanceM: 400, pace: "3:45", recoverySeconds: 60, recoveryType: "jog", recoveryPace: "5:45" } },
      { day: "Jeudi", type: "Récupération active", distance: 10.5, pace: "5:15/km", duration: 55, description: "Récup, semaine 2.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 10.5, pace: "4:15/km", duration: 45, description: "35′ continus, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.8, pace: "5:30/km", duration: 87, description: "Spécifique demi, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 57.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.3, pace: "5:00/km", duration: 57, description: "Base, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 11.3, pace: "3:45/km", duration: 42, description: "12×400 m, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.3, pace: "5:15/km", duration: 59, description: "Récup, semaine 3.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 11.3, pace: "4:15/km", duration: 48, description: "35′ continus, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.9, pace: "5:30/km", duration: 93, description: "Spécifique demi, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 62.1,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.2, pace: "5:00/km", duration: 46, description: "Base, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 9.2, pace: "3:45/km", duration: 35, description: "12×400 m, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 9.2, pace: "5:15/km", duration: 48, description: "Récup, semaine 4.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 9.2, pace: "4:15/km", duration: 39, description: "35′ continus, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.9, pace: "5:30/km", duration: 76, description: "Spécifique demi, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 50.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.8, pace: "5:00/km", duration: 44, description: "Base, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 8.8, pace: "3:45/km", duration: 33, description: "12×400 m, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.8, pace: "5:15/km", duration: 46, description: "Récup, semaine 5.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 8.8, pace: "4:15/km", duration: 37, description: "35′ continus, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.2, pace: "5:30/km", duration: 73, description: "Spécifique demi, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 48.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:00/km", duration: 48, description: "Base, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 9.5, pace: "3:45/km", duration: 36, description: "12×400 m, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 9.5, pace: "5:15/km", duration: 50, description: "Récup, semaine 6.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 9.5, pace: "4:15/km", duration: 40, description: "35′ continus, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.2, pace: "5:30/km", duration: 78, description: "Spécifique demi, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 52.2,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.1, pace: "5:00/km", duration: 51, description: "Base, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 10.1, pace: "3:45/km", duration: 38, description: "12×400 m, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 10.1, pace: "5:15/km", duration: 53, description: "Récup, semaine 7.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 10.1, pace: "4:15/km", duration: 43, description: "35′ continus, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.2, pace: "5:30/km", duration: 84, description: "Spécifique demi, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 55.6,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.3, pace: "5:00/km", duration: 42, description: "Base, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 8.3, pace: "3:45/km", duration: 31, description: "12×400 m, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.3, pace: "5:15/km", duration: 44, description: "Récup, semaine 8.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 8.3, pace: "4:15/km", duration: 35, description: "35′ continus, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.5, pace: "5:30/km", duration: 69, description: "Spécifique demi, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 45.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.9, pace: "5:00/km", duration: 40, description: "Base, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 7.9, pace: "3:45/km", duration: 30, description: "12×400 m, semaine 9.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.9, pace: "5:15/km", duration: 41, description: "Récup, semaine 9.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 7.9, pace: "4:15/km", duration: 34, description: "35′ continus, semaine 9.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.9, pace: "5:30/km", duration: 65, description: "Spécifique demi, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 43.5,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.5, pace: "5:00/km", duration: 43, description: "Base, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 8.5, pace: "3:45/km", duration: 32, description: "12×400 m, semaine 10.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.5, pace: "5:15/km", duration: 45, description: "Récup, semaine 10.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 8.5, pace: "4:15/km", duration: 36, description: "35′ continus, semaine 10.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.8, pace: "5:30/km", duration: 70, description: "Spécifique demi, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 46.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.9, pace: "5:00/km", duration: 40, description: "Base, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 7.9, pace: "3:45/km", duration: 30, description: "12×400 m, semaine 11.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.9, pace: "5:15/km", duration: 41, description: "Récup, semaine 11.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 7.9, pace: "4:15/km", duration: 34, description: "35′ continus, semaine 11.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.8, pace: "5:30/km", duration: 65, description: "Spécifique demi, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 43.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.8, pace: "5:00/km", duration: 34, description: "Base, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 6.8, pace: "3:45/km", duration: 26, description: "12×400 m, semaine 12.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.8, pace: "5:15/km", duration: 36, description: "Récup, semaine 12.", intensity: "easy" },
      { day: "Vendredi", type: "Séance seuil", distance: 6.8, pace: "4:15/km", duration: 29, description: "35′ continus, semaine 12.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.1, pace: "5:30/km", duration: 56, description: "Spécifique demi, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 37.3,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
];
