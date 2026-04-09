import type { TrainingPlan } from "./types";

export const racePlans: TrainingPlan[] = [
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
  {
    id: "marathon_beginner_4days_16weeks",
    name: "Marathon — Débutant (4 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "beginner",
    daysPerWeek: 4,
    durationWeeks: 16,
    summary: "Quatre sorties hebdomadaires privilégient la régularité : trois footings gérables en semaine et une sortie longue du dimanche qui monte en douceur. Les progressions du mercredi restent modérées pour limiter les pics de fatigue.",
    equipmentTips: ["Sac à dos 5 l pour tester l’hydratation sur les longues > 2 h.","Bodyglide ou vaseline sur points de friction dès 15 km.","Casquette pour le soleil et la pluie fine."],
    nutritionTips: ["Tous les 15 jours, mangez un repas test la veille de la sortie longue dominicale.","Sel de l’Himalaya ou bouillon léger si crampes en fin de sortie longue.","Dormir une heure de plus la semaine du pic de volume."],
    shoeTips: ["Chaussure daily trainer amortie pour 80 % du kilométrage.","Semelle orthopédique fixée avant 200 km sur la paire marathon."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.8, pace: "7:00/km", duration: 90, description: "Aérobie pur, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.5, pace: "7:00/km", duration: 60, description: "Progression sur 25–35′, semaine 1.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.5, pace: "7:15/km", duration: 62, description: "Courte et fluide, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.8, pace: "7:30/km", duration: 96, description: "Marchez 1–2′ si besoin, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 42.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.6, pace: "7:00/km", duration: 95, description: "Aérobie pur, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 9, pace: "7:00/km", duration: 63, description: "Progression sur 25–35′, semaine 2.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 9, pace: "7:15/km", duration: 65, description: "Courte et fluide, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.6, pace: "7:30/km", duration: 102, description: "Marchez 1–2′ si besoin, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 45.2,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.4, pace: "7:00/km", duration: 101, description: "Aérobie pur, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 9.6, pace: "7:00/km", duration: 67, description: "Progression sur 25–35′, semaine 3.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 9.6, pace: "7:15/km", duration: 70, description: "Courte et fluide, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.4, pace: "7:30/km", duration: 108, description: "Marchez 1–2′ si besoin, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 48,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.5, pace: "7:00/km", duration: 81, description: "Aérobie pur, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.7, pace: "7:00/km", duration: 54, description: "Progression sur 25–35′, semaine 4.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.7, pace: "7:15/km", duration: 56, description: "Courte et fluide, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.5, pace: "7:30/km", duration: 86, description: "Marchez 1–2′ si besoin, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 38.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.2, pace: "7:00/km", duration: 85, description: "Aérobie pur, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.1, pace: "7:00/km", duration: 57, description: "Progression sur 25–35′, semaine 5.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.1, pace: "7:15/km", duration: 59, description: "Courte et fluide, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.2, pace: "7:30/km", duration: 92, description: "Marchez 1–2′ si besoin, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 40.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.9, pace: "7:00/km", duration: 90, description: "Aérobie pur, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.6, pace: "7:00/km", duration: 60, description: "Progression sur 25–35′, semaine 6.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.6, pace: "7:15/km", duration: 62, description: "Courte et fluide, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.9, pace: "7:30/km", duration: 97, description: "Marchez 1–2′ si besoin, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 43,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.7, pace: "7:00/km", duration: 96, description: "Aérobie pur, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 9.1, pace: "7:00/km", duration: 64, description: "Progression sur 25–35′, semaine 7.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 9.1, pace: "7:15/km", duration: 66, description: "Courte et fluide, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.7, pace: "7:30/km", duration: 103, description: "Marchez 1–2′ si besoin, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 45.6,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11, pace: "7:00/km", duration: 77, description: "Aérobie pur, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.3, pace: "7:00/km", duration: 51, description: "Progression sur 25–35′, semaine 8.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.3, pace: "7:15/km", duration: 53, description: "Courte et fluide, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11, pace: "7:30/km", duration: 83, description: "Marchez 1–2′ si besoin, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 36.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.6, pace: "7:00/km", duration: 81, description: "Aérobie pur, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.7, pace: "7:00/km", duration: 54, description: "Progression sur 25–35′, semaine 9.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.7, pace: "7:15/km", duration: 56, description: "Courte et fluide, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.6, pace: "7:30/km", duration: 87, description: "Marchez 1–2′ si besoin, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 38.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.3, pace: "7:00/km", duration: 86, description: "Aérobie pur, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.2, pace: "7:00/km", duration: 57, description: "Progression sur 25–35′, semaine 10.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.2, pace: "7:15/km", duration: 59, description: "Courte et fluide, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.3, pace: "7:30/km", duration: 92, description: "Marchez 1–2′ si besoin, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 41,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.1, pace: "7:00/km", duration: 92, description: "Aérobie pur, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 8.7, pace: "7:00/km", duration: 61, description: "Progression sur 25–35′, semaine 11.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 8.7, pace: "7:15/km", duration: 63, description: "Courte et fluide, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.1, pace: "7:30/km", duration: 98, description: "Marchez 1–2′ si besoin, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 43.6,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.5, pace: "7:00/km", duration: 74, description: "Aérobie pur, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7, pace: "7:00/km", duration: 49, description: "Progression sur 25–35′, semaine 12.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7, pace: "7:15/km", duration: 51, description: "Courte et fluide, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.5, pace: "7:30/km", duration: 79, description: "Marchez 1–2′ si besoin, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 35,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.1, pace: "7:00/km", duration: 78, description: "Aérobie pur, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.4, pace: "7:00/km", duration: 52, description: "Progression sur 25–35′, semaine 13.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.4, pace: "7:15/km", duration: 54, description: "Courte et fluide, semaine 13.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.1, pace: "7:30/km", duration: 83, description: "Marchez 1–2′ si besoin, semaine 13.", intensity: "easy" }
      ],
      totalDistance: 37,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.7, pace: "7:00/km", duration: 82, description: "Aérobie pur, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 7.8, pace: "7:00/km", duration: 55, description: "Progression sur 25–35′, semaine 14.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 7.8, pace: "7:15/km", duration: 57, description: "Courte et fluide, semaine 14.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.7, pace: "7:30/km", duration: 88, description: "Marchez 1–2′ si besoin, semaine 14.", intensity: "easy" }
      ],
      totalDistance: 39,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.1, pace: "7:00/km", duration: 71, description: "Aérobie pur, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 6.7, pace: "7:00/km", duration: 47, description: "Progression sur 25–35′, semaine 15.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 6.7, pace: "7:15/km", duration: 49, description: "Courte et fluide, semaine 15.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.1, pace: "7:30/km", duration: 76, description: "Marchez 1–2′ si besoin, semaine 15.", intensity: "easy" }
      ],
      totalDistance: 33.6,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.6, pace: "7:00/km", duration: 60, description: "Aérobie pur, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Sortie progressive", distance: 5.8, pace: "7:00/km", duration: 41, description: "Progression sur 25–35′, semaine 16.", intensity: "moderate" },
      { day: "Jeudi", type: "Récupération active", distance: 5.8, pace: "7:15/km", duration: 42, description: "Courte et fluide, semaine 16.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.6, pace: "7:30/km", duration: 65, description: "Marchez 1–2′ si besoin, semaine 16.", intensity: "easy" }
      ],
      totalDistance: 28.8,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_intermediate_4days_16weeks",
    name: "Marathon — Intermédiaire (4 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 16,
    summary: "Le seuil du mercredi et les blocs marathon en fin de sortie longue du dimanche préparent l’effort prolongé sans saturer les jambes chaque jour. Les semaines 4, 8 et 12 coupent le volume pour mieux absorber les pics.",
    equipmentTips: ["Flasques 250 ml pour répéter la stratégie boisson du marathon.","Ceinture porte-gels pour les longues > 24 km.","Lunettes polarisantes si parcours en milieu ouvert."],
    nutritionTips: ["1 gel toutes les 45′ sur la sortie longue > 2 h 15.","Petit-déjeuner identique chaque dimanche de sortie longue.","Réduire les fibres 36 h avant le test long ou la course."],
    shoeTips: ["Modèle avec bon retour d’énergie pour les blocs marathon.","Gardez une deuxième paire identique en secours si humidité."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.5, pace: "5:45/km", duration: 89, description: "Endurance, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10.3, pace: "5:00/km", duration: 52, description: "3×8′ au seuil, semaine 1.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.3, pace: "6:00/km", duration: 62, description: "Récup, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.5, pace: "6:15/km", duration: 97, description: "Derniers 30′ allure marathon, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 51.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 16.4, pace: "5:45/km", duration: 94, description: "Endurance, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10.9, pace: "5:00/km", duration: 55, description: "3×8′ au seuil, semaine 2.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.9, pace: "6:00/km", duration: 65, description: "Récup, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.4, pace: "6:15/km", duration: 102, description: "Derniers 30′ allure marathon, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 54.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 17.4, pace: "5:45/km", duration: 100, description: "Endurance, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 11.6, pace: "5:00/km", duration: 58, description: "3×8′ au seuil, semaine 3.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.6, pace: "6:00/km", duration: 70, description: "Récup, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.4, pace: "6:15/km", duration: 109, description: "Derniers 30′ allure marathon, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 58,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14, pace: "5:45/km", duration: 81, description: "Endurance, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9.3, pace: "5:00/km", duration: 47, description: "3×8′ au seuil, semaine 4.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.3, pace: "6:00/km", duration: 56, description: "Récup, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14, pace: "6:15/km", duration: 88, description: "Derniers 30′ allure marathon, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 46.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.8, pace: "5:45/km", duration: 85, description: "Endurance, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9.9, pace: "5:00/km", duration: 50, description: "3×8′ au seuil, semaine 5.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.9, pace: "6:00/km", duration: 59, description: "Récup, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.8, pace: "6:15/km", duration: 93, description: "Derniers 30′ allure marathon, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 49.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.7, pace: "5:45/km", duration: 90, description: "Endurance, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10.5, pace: "5:00/km", duration: 53, description: "3×8′ au seuil, semaine 6.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.5, pace: "6:00/km", duration: 63, description: "Récup, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.7, pace: "6:15/km", duration: 98, description: "Derniers 30′ allure marathon, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 52.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 16.6, pace: "5:45/km", duration: 95, description: "Endurance, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 11.1, pace: "5:00/km", duration: 56, description: "3×8′ au seuil, semaine 7.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.1, pace: "6:00/km", duration: 67, description: "Récup, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.6, pace: "6:15/km", duration: 104, description: "Derniers 30′ allure marathon, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 55.4,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.3, pace: "5:45/km", duration: 76, description: "Endurance, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 8.9, pace: "5:00/km", duration: 45, description: "3×8′ au seuil, semaine 8.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.9, pace: "6:00/km", duration: 53, description: "Récup, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.3, pace: "6:15/km", duration: 83, description: "Derniers 30′ allure marathon, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 44.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.1, pace: "5:45/km", duration: 81, description: "Endurance, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9.4, pace: "5:00/km", duration: 47, description: "3×8′ au seuil, semaine 9.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.4, pace: "6:00/km", duration: 56, description: "Récup, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.1, pace: "6:15/km", duration: 88, description: "Derniers 30′ allure marathon, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 47,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.9, pace: "5:45/km", duration: 86, description: "Endurance, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10, pace: "5:00/km", duration: 50, description: "3×8′ au seuil, semaine 10.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10, pace: "6:00/km", duration: 60, description: "Récup, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.9, pace: "6:15/km", duration: 93, description: "Derniers 30′ allure marathon, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 49.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.8, pace: "5:45/km", duration: 91, description: "Endurance, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 10.6, pace: "5:00/km", duration: 53, description: "3×8′ au seuil, semaine 11.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.6, pace: "6:00/km", duration: 64, description: "Récup, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.8, pace: "6:15/km", duration: 99, description: "Derniers 30′ allure marathon, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 52.8,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.7, pace: "5:45/km", duration: 73, description: "Endurance, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 8.5, pace: "5:00/km", duration: 43, description: "3×8′ au seuil, semaine 12.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.5, pace: "6:00/km", duration: 51, description: "Récup, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.7, pace: "6:15/km", duration: 79, description: "Derniers 30′ allure marathon, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 42.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.5, pace: "5:45/km", duration: 78, description: "Endurance, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9, pace: "5:00/km", duration: 45, description: "3×8′ au seuil, semaine 13.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9, pace: "6:00/km", duration: 54, description: "Récup, semaine 13.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.5, pace: "6:15/km", duration: 84, description: "Derniers 30′ allure marathon, semaine 13.", intensity: "moderate" }
      ],
      totalDistance: 45,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.2, pace: "5:45/km", duration: 82, description: "Endurance, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 9.5, pace: "5:00/km", duration: 48, description: "3×8′ au seuil, semaine 14.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.5, pace: "6:00/km", duration: 57, description: "Récup, semaine 14.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.2, pace: "6:15/km", duration: 89, description: "Derniers 30′ allure marathon, semaine 14.", intensity: "moderate" }
      ],
      totalDistance: 47.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.2, pace: "5:45/km", duration: 70, description: "Endurance, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 8.1, pace: "5:00/km", duration: 41, description: "3×8′ au seuil, semaine 15.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.1, pace: "6:00/km", duration: 49, description: "Récup, semaine 15.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.2, pace: "6:15/km", duration: 76, description: "Derniers 30′ allure marathon, semaine 15.", intensity: "moderate" }
      ],
      totalDistance: 40.6,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.4, pace: "5:45/km", duration: 60, description: "Endurance, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Séance seuil", distance: 7, pace: "5:00/km", duration: 35, description: "3×8′ au seuil, semaine 16.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7, pace: "6:00/km", duration: 42, description: "Récup, semaine 16.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "6:15/km", duration: 65, description: "Derniers 30′ allure marathon, semaine 16.", intensity: "moderate" }
      ],
      totalDistance: 34.8,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_intermediate_5days_16weeks",
    name: "Marathon — Intermédiaire (5 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "intermediate",
    daysPerWeek: 5,
    durationWeeks: 16,
    summary: "La cinquième séance ajoute du rythme marathon encadré par des récupérations actives et des joggings faciles. Le tempo du vendredi reste distinct du mercredi allure marathon pour ne pas cumuler deux sollicitations identiques.",
    equipmentTips: ["Gilet d’hydratation pour simuler le poids du équipement course.","Montre avec segments pour enchaîner 2 × 20′ marathon.","Tapis noir ou escaliers pour le prévention chevilles légères."],
    nutritionTips: ["Repas glucides modérés le jeudi soir avant le vendredi tempo.","Barre céréales 90′ avant la sortie du mercredi si matinale.","Électrolytes en poudre dans une gourde pour les longues chaudes."],
    shoeTips: ["Deux modèles : entraînement amorti + modèle plus nerveux pour tempo.","Surveillez la compression du coup de pied après 600 km."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11, pace: "5:45/km", duration: 63, description: "Volume facile, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11, pace: "5:00/km", duration: 55, description: "3×15′ allure marathon, semaine 1.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11, pace: "6:00/km", duration: 66, description: "Récup, semaine 1.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11, pace: "5:00/km", duration: 55, description: "20′ + 10′ rapide, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.6, pace: "6:15/km", duration: 104, description: "Longue avec 2 dernières allure objectif, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 60.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.7, pace: "5:45/km", duration: 67, description: "Volume facile, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11.7, pace: "5:00/km", duration: 59, description: "3×15′ allure marathon, semaine 2.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.7, pace: "6:00/km", duration: 70, description: "Récup, semaine 2.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11.7, pace: "5:00/km", duration: 59, description: "20′ + 10′ rapide, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.5, pace: "6:15/km", duration: 109, description: "Longue avec 2 dernières allure objectif, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 64.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.4, pace: "5:45/km", duration: 71, description: "Volume facile, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 12.4, pace: "5:00/km", duration: 62, description: "3×15′ allure marathon, semaine 3.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 12.4, pace: "6:00/km", duration: 74, description: "Récup, semaine 3.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 12.4, pace: "5:00/km", duration: 62, description: "20′ + 10′ rapide, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.5, pace: "6:15/km", duration: 116, description: "Longue avec 2 dernières allure objectif, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 68.1,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.9, pace: "5:45/km", duration: 57, description: "Volume facile, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 9.9, pace: "5:00/km", duration: 50, description: "3×15′ allure marathon, semaine 4.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.9, pace: "6:00/km", duration: 59, description: "Récup, semaine 4.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 9.9, pace: "5:00/km", duration: 50, description: "20′ + 10′ rapide, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.8, pace: "6:15/km", duration: 93, description: "Longue avec 2 dernières allure objectif, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 54.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.5, pace: "5:45/km", duration: 60, description: "Volume facile, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 10.5, pace: "5:00/km", duration: 53, description: "3×15′ allure marathon, semaine 5.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.5, pace: "6:00/km", duration: 63, description: "Récup, semaine 5.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 10.5, pace: "5:00/km", duration: 53, description: "20′ + 10′ rapide, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.7, pace: "6:15/km", duration: 98, description: "Longue avec 2 dernières allure objectif, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 57.7,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.1, pace: "5:45/km", duration: 64, description: "Volume facile, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11.1, pace: "5:00/km", duration: 56, description: "3×15′ allure marathon, semaine 6.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.1, pace: "6:00/km", duration: 67, description: "Récup, semaine 6.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11.1, pace: "5:00/km", duration: 56, description: "20′ + 10′ rapide, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.7, pace: "6:15/km", duration: 104, description: "Longue avec 2 dernières allure objectif, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 61.1,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.8, pace: "5:45/km", duration: 68, description: "Volume facile, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11.8, pace: "5:00/km", duration: 59, description: "3×15′ allure marathon, semaine 7.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.8, pace: "6:00/km", duration: 71, description: "Récup, semaine 7.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11.8, pace: "5:00/km", duration: 59, description: "20′ + 10′ rapide, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.7, pace: "6:15/km", duration: 111, description: "Longue avec 2 dernières allure objectif, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 64.9,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:45/km", duration: 55, description: "Volume facile, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 9.5, pace: "5:00/km", duration: 48, description: "3×15′ allure marathon, semaine 8.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.5, pace: "6:00/km", duration: 57, description: "Récup, semaine 8.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 9.5, pace: "5:00/km", duration: 48, description: "20′ + 10′ rapide, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.2, pace: "6:15/km", duration: 89, description: "Longue avec 2 dernières allure objectif, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 52.2,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10, pace: "5:45/km", duration: 58, description: "Volume facile, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 10, pace: "5:00/km", duration: 50, description: "3×15′ allure marathon, semaine 9.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10, pace: "6:00/km", duration: 60, description: "Récup, semaine 9.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 10, pace: "5:00/km", duration: 50, description: "20′ + 10′ rapide, semaine 9.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15, pace: "6:15/km", duration: 94, description: "Longue avec 2 dernières allure objectif, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 55,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.6, pace: "5:45/km", duration: 61, description: "Volume facile, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 10.6, pace: "5:00/km", duration: 53, description: "3×15′ allure marathon, semaine 10.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.6, pace: "6:00/km", duration: 64, description: "Récup, semaine 10.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 10.6, pace: "5:00/km", duration: 53, description: "20′ + 10′ rapide, semaine 10.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.9, pace: "6:15/km", duration: 99, description: "Longue avec 2 dernières allure objectif, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 58.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.3, pace: "5:45/km", duration: 65, description: "Volume facile, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 11.3, pace: "5:00/km", duration: 57, description: "3×15′ allure marathon, semaine 11.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 11.3, pace: "6:00/km", duration: 68, description: "Récup, semaine 11.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 11.3, pace: "5:00/km", duration: 57, description: "20′ + 10′ rapide, semaine 11.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.9, pace: "6:15/km", duration: 106, description: "Longue avec 2 dernières allure objectif, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 62.1,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9, pace: "5:45/km", duration: 52, description: "Volume facile, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 9, pace: "5:00/km", duration: 45, description: "3×15′ allure marathon, semaine 12.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9, pace: "6:00/km", duration: 54, description: "Récup, semaine 12.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 9, pace: "5:00/km", duration: 45, description: "20′ + 10′ rapide, semaine 12.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.5, pace: "6:15/km", duration: 84, description: "Longue avec 2 dernières allure objectif, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 49.5,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:45/km", duration: 55, description: "Volume facile, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 9.5, pace: "5:00/km", duration: 48, description: "3×15′ allure marathon, semaine 13.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 9.5, pace: "6:00/km", duration: 57, description: "Récup, semaine 13.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 9.5, pace: "5:00/km", duration: 48, description: "20′ + 10′ rapide, semaine 13.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.3, pace: "6:15/km", duration: 89, description: "Longue avec 2 dernières allure objectif, semaine 13.", intensity: "moderate" }
      ],
      totalDistance: 52.3,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.1, pace: "5:45/km", duration: 58, description: "Volume facile, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 10.1, pace: "5:00/km", duration: 51, description: "3×15′ allure marathon, semaine 14.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 10.1, pace: "6:00/km", duration: 61, description: "Récup, semaine 14.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 10.1, pace: "5:00/km", duration: 51, description: "20′ + 10′ rapide, semaine 14.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.1, pace: "6:15/km", duration: 94, description: "Longue avec 2 dernières allure objectif, semaine 14.", intensity: "moderate" }
      ],
      totalDistance: 55.5,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.7, pace: "5:45/km", duration: 50, description: "Volume facile, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 8.7, pace: "5:00/km", duration: 44, description: "3×15′ allure marathon, semaine 15.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 8.7, pace: "6:00/km", duration: 52, description: "Récup, semaine 15.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 8.7, pace: "5:00/km", duration: 44, description: "20′ + 10′ rapide, semaine 15.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13, pace: "6:15/km", duration: 81, description: "Longue avec 2 dernières allure objectif, semaine 15.", intensity: "moderate" }
      ],
      totalDistance: 47.8,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.4, pace: "5:45/km", duration: 43, description: "Volume facile, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Allure spécifique marathon", distance: 7.4, pace: "5:00/km", duration: 37, description: "3×15′ allure marathon, semaine 16.", intensity: "tempo" },
      { day: "Jeudi", type: "Récupération active", distance: 7.4, pace: "6:00/km", duration: 44, description: "Récup, semaine 16.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 7.4, pace: "5:00/km", duration: 37, description: "20′ + 10′ rapide, semaine 16.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.1, pace: "6:15/km", duration: 69, description: "Longue avec 2 dernières allure objectif, semaine 16.", intensity: "moderate" }
      ],
      totalDistance: 40.7,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_advanced_4days_16weeks",
    name: "Marathon — Avancé (4 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "advanced",
    daysPerWeek: 4,
    durationWeeks: 16,
    summary: "Les 1000 m au seuil VO2 entretiennent la vitesse pendant que la sortie longue intègre des blocs marathon exigeants. La structure respecte un jour de récupération active après chaque séance nerveuse.",
    equipmentTips: ["Podomètre ou capteur de cadence pour analyser la fin de sortie longue.","Rouleau dense pour quadriceps post-seuil.","GPS multi-segments pour les 40′ à allure marathon."],
    nutritionTips: ["Gels avec caféine seulement si testés sur longue, jamais en première.","Repas fer + vitamine C pour l’hémoglobine sur gros volume.","Hydratation planifiée dès J-3 sur la semaine du marathon."],
    shoeTips: ["Paire compétition réservée aux blocs rapides et au marathon.","Évitez toute nouvelle chaussette le mois de la course."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.3, pace: "5:00/km", duration: 72, description: "Volume modéré, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.3, pace: "3:45/km", duration: 54, description: "5×1000 m cible 10 km, semaine 1.", intensity: "interval", warmupMinutes: 15, cooldownMinutes: 15, intervals: { reps: 5, distanceM: 1000, pace: "3:45", recoverySeconds: 120, recoveryType: "jog", recoveryPace: "5:45" } },
      { day: "Jeudi", type: "Récupération active", distance: 14.3, pace: "5:15/km", duration: 75, description: "Très lent, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.4, pace: "5:30/km", duration: 118, description: "Inclure 40′ allure marathon, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 64.3,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.1, pace: "5:00/km", duration: 76, description: "Volume modéré, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 15.1, pace: "3:45/km", duration: 57, description: "5×1000 m cible 10 km, semaine 2.", intensity: "interval", warmupMinutes: 15, cooldownMinutes: 15, intervals: { reps: 5, distanceM: 1000, pace: "3:45", recoverySeconds: 120, recoveryType: "jog", recoveryPace: "5:45" } },
      { day: "Jeudi", type: "Récupération active", distance: 15.1, pace: "5:15/km", duration: 79, description: "Très lent, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 22.7, pace: "5:30/km", duration: 125, description: "Inclure 40′ allure marathon, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 68,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 16, pace: "5:00/km", duration: 80, description: "Volume modéré, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 16, pace: "3:45/km", duration: 60, description: "5×1000 m cible 10 km, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 16, pace: "5:15/km", duration: 84, description: "Très lent, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 24, pace: "5:30/km", duration: 132, description: "Inclure 40′ allure marathon, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 72,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.8, pace: "5:00/km", duration: 64, description: "Volume modéré, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.8, pace: "3:45/km", duration: 48, description: "5×1000 m cible 10 km, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.8, pace: "5:15/km", duration: 67, description: "Très lent, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.2, pace: "5:30/km", duration: 106, description: "Inclure 40′ allure marathon, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 57.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.6, pace: "5:00/km", duration: 68, description: "Volume modéré, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.6, pace: "3:45/km", duration: 51, description: "5×1000 m cible 10 km, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.6, pace: "5:15/km", duration: 71, description: "Très lent, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 20.4, pace: "5:30/km", duration: 112, description: "Inclure 40′ allure marathon, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 61.2,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.4, pace: "5:00/km", duration: 72, description: "Volume modéré, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.4, pace: "3:45/km", duration: 54, description: "5×1000 m cible 10 km, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.4, pace: "5:15/km", duration: 76, description: "Très lent, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.7, pace: "5:30/km", duration: 119, description: "Inclure 40′ allure marathon, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 64.9,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 15.3, pace: "5:00/km", duration: 77, description: "Volume modéré, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 15.3, pace: "3:45/km", duration: 57, description: "5×1000 m cible 10 km, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 15.3, pace: "5:15/km", duration: 80, description: "Très lent, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 23, pace: "5:30/km", duration: 127, description: "Inclure 40′ allure marathon, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 68.9,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.2, pace: "5:00/km", duration: 61, description: "Volume modéré, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.2, pace: "3:45/km", duration: 46, description: "5×1000 m cible 10 km, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.2, pace: "5:15/km", duration: 64, description: "Très lent, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.4, pace: "5:30/km", duration: 101, description: "Inclure 40′ allure marathon, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 55,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13, pace: "5:00/km", duration: 65, description: "Volume modéré, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13, pace: "3:45/km", duration: 49, description: "5×1000 m cible 10 km, semaine 9.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13, pace: "5:15/km", duration: 68, description: "Très lent, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.5, pace: "5:30/km", duration: 107, description: "Inclure 40′ allure marathon, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 58.5,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.8, pace: "5:00/km", duration: 69, description: "Volume modéré, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.8, pace: "3:45/km", duration: 52, description: "5×1000 m cible 10 km, semaine 10.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.8, pace: "5:15/km", duration: 72, description: "Très lent, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 20.6, pace: "5:30/km", duration: 113, description: "Inclure 40′ allure marathon, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 62,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.6, pace: "5:00/km", duration: 73, description: "Volume modéré, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.6, pace: "3:45/km", duration: 55, description: "5×1000 m cible 10 km, semaine 11.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.6, pace: "5:15/km", duration: 77, description: "Très lent, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.9, pace: "5:30/km", duration: 120, description: "Inclure 40′ allure marathon, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 65.7,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.7, pace: "5:00/km", duration: 59, description: "Volume modéré, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.7, pace: "3:45/km", duration: 44, description: "5×1000 m cible 10 km, semaine 12.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.7, pace: "5:15/km", duration: 61, description: "Très lent, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.5, pace: "5:30/km", duration: 96, description: "Inclure 40′ allure marathon, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 52.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.4, pace: "5:00/km", duration: 62, description: "Volume modéré, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.4, pace: "3:45/km", duration: 47, description: "5×1000 m cible 10 km, semaine 13.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.4, pace: "5:15/km", duration: 65, description: "Très lent, semaine 13.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.5, pace: "5:30/km", duration: 102, description: "Inclure 40′ allure marathon, semaine 13.", intensity: "moderate" }
      ],
      totalDistance: 55.7,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.1, pace: "5:00/km", duration: 66, description: "Volume modéré, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.1, pace: "3:45/km", duration: 49, description: "5×1000 m cible 10 km, semaine 14.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.1, pace: "5:15/km", duration: 69, description: "Très lent, semaine 14.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.6, pace: "5:30/km", duration: 108, description: "Inclure 40′ allure marathon, semaine 14.", intensity: "moderate" }
      ],
      totalDistance: 58.9,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.2, pace: "5:00/km", duration: 56, description: "Volume modéré, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.2, pace: "3:45/km", duration: 42, description: "5×1000 m cible 10 km, semaine 15.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.2, pace: "5:15/km", duration: 59, description: "Très lent, semaine 15.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.8, pace: "5:30/km", duration: 92, description: "Inclure 40′ allure marathon, semaine 15.", intensity: "moderate" }
      ],
      totalDistance: 50.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.6, pace: "5:00/km", duration: 48, description: "Volume modéré, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 9.6, pace: "3:45/km", duration: 36, description: "5×1000 m cible 10 km, semaine 16.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 9.6, pace: "5:15/km", duration: 50, description: "Très lent, semaine 16.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 14.4, pace: "5:30/km", duration: 79, description: "Inclure 40′ allure marathon, semaine 16.", intensity: "moderate" }
      ],
      totalDistance: 43.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "marathon_advanced_5days_16weeks",
    name: "Marathon — Avancé (5 j, 16 sem.)",
    goal: "race",
    targetDistance: "marathon",
    level: "advanced",
    daysPerWeek: 5,
    durationWeeks: 16,
    summary: "Ce plan haut volume alterne stimulation aérobie maximale (longue) et travail de seuil marathon sans enchaînement de jours durs consécutifs. L’affûtage final allège fortement la charge pour maximiser la performance le jour J.",
    equipmentTips: ["Straps cheville légères si terrain instable sur longues.","Bain froid 10′ optionnel après la séance du mercredi lourde.","Chargeur portable pour longues sorties GPS > 3 h."],
    nutritionTips: ["90 g glucides / h testés sur la longue du dimanche en phase spécifique.","Dîner pauvre en fibres J-2, riche en glucides J-1.","Plan de rehydratation post-sortie double eau + jus."],
    shoeTips: ["Rotation 3 paires si volume > 80 km/semaine en pic.","Compétition avec 40–60 km d’usure contrôlée avant le marathon."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.3, pace: "5:00/km", duration: 67, description: "Endurance, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.3, pace: "3:45/km", duration: 50, description: "6×1000 m, semaine 1.", intensity: "interval", warmupMinutes: 15, cooldownMinutes: 15, intervals: { reps: 6, distanceM: 1000, pace: "3:45", recoverySeconds: 120, recoveryType: "jog", recoveryPace: "5:45" } },
      { day: "Jeudi", type: "Récupération active", distance: 13.3, pace: "5:15/km", duration: 70, description: "Récup, semaine 1.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 13.3, pace: "4:15/km", duration: 57, description: "2×20′ marathon, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.9, pace: "5:30/km", duration: 109, description: "Spécifique, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 73.1,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.1, pace: "5:00/km", duration: 71, description: "Endurance, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.1, pace: "3:45/km", duration: 53, description: "6×1000 m, semaine 2.", intensity: "interval", warmupMinutes: 15, cooldownMinutes: 15, intervals: { reps: 6, distanceM: 1000, pace: "3:45", recoverySeconds: 120, recoveryType: "jog", recoveryPace: "5:45" } },
      { day: "Jeudi", type: "Récupération active", distance: 14.1, pace: "5:15/km", duration: 74, description: "Récup, semaine 2.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 14.1, pace: "4:15/km", duration: 60, description: "2×20′ marathon, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.1, pace: "5:30/km", duration: 116, description: "Spécifique, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 77.5,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.9, pace: "5:00/km", duration: 75, description: "Endurance, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.9, pace: "3:45/km", duration: 56, description: "6×1000 m, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.9, pace: "5:15/km", duration: 78, description: "Récup, semaine 3.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 14.9, pace: "4:15/km", duration: 63, description: "2×20′ marathon, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 22.4, pace: "5:30/km", duration: 123, description: "Spécifique, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 82,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.9, pace: "5:00/km", duration: 60, description: "Endurance, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.9, pace: "3:45/km", duration: 45, description: "6×1000 m, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.9, pace: "5:15/km", duration: 62, description: "Récup, semaine 4.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 11.9, pace: "4:15/km", duration: 51, description: "2×20′ marathon, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.9, pace: "5:30/km", duration: 98, description: "Spécifique, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 65.5,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.7, pace: "5:00/km", duration: 64, description: "Endurance, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.7, pace: "3:45/km", duration: 48, description: "6×1000 m, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.7, pace: "5:15/km", duration: 67, description: "Récup, semaine 5.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 12.7, pace: "4:15/km", duration: 54, description: "2×20′ marathon, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 19, pace: "5:30/km", duration: 105, description: "Spécifique, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 69.8,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.4, pace: "5:00/km", duration: 67, description: "Endurance, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.4, pace: "3:45/km", duration: 50, description: "6×1000 m, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.4, pace: "5:15/km", duration: 70, description: "Récup, semaine 6.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 13.4, pace: "4:15/km", duration: 57, description: "2×20′ marathon, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 20.1, pace: "5:30/km", duration: 111, description: "Spécifique, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 73.7,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 14.2, pace: "5:00/km", duration: 71, description: "Endurance, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 14.2, pace: "3:45/km", duration: 53, description: "6×1000 m, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 14.2, pace: "5:15/km", duration: 75, description: "Récup, semaine 7.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 14.2, pace: "4:15/km", duration: 60, description: "2×20′ marathon, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 21.4, pace: "5:30/km", duration: 118, description: "Spécifique, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 78.2,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.4, pace: "5:00/km", duration: 57, description: "Endurance, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.4, pace: "3:45/km", duration: 43, description: "6×1000 m, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.4, pace: "5:15/km", duration: 60, description: "Récup, semaine 8.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 11.4, pace: "4:15/km", duration: 48, description: "2×20′ marathon, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.1, pace: "5:30/km", duration: 94, description: "Spécifique, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 62.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.1, pace: "5:00/km", duration: 61, description: "Endurance, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.1, pace: "3:45/km", duration: 45, description: "6×1000 m, semaine 9.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.1, pace: "5:15/km", duration: 64, description: "Récup, semaine 9.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 12.1, pace: "4:15/km", duration: 51, description: "2×20′ marathon, semaine 9.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.1, pace: "5:30/km", duration: 100, description: "Spécifique, semaine 9.", intensity: "moderate" }
      ],
      totalDistance: 66.5,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.8, pace: "5:00/km", duration: 64, description: "Endurance, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.8, pace: "3:45/km", duration: 48, description: "6×1000 m, semaine 10.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.8, pace: "5:15/km", duration: 67, description: "Récup, semaine 10.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 12.8, pace: "4:15/km", duration: 54, description: "2×20′ marathon, semaine 10.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 19.2, pace: "5:30/km", duration: 106, description: "Spécifique, semaine 10.", intensity: "moderate" }
      ],
      totalDistance: 70.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 13.5, pace: "5:00/km", duration: 68, description: "Endurance, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 13.5, pace: "3:45/km", duration: 51, description: "6×1000 m, semaine 11.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 13.5, pace: "5:15/km", duration: 71, description: "Récup, semaine 11.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 13.5, pace: "4:15/km", duration: 57, description: "2×20′ marathon, semaine 11.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 20.3, pace: "5:30/km", duration: 112, description: "Spécifique, semaine 11.", intensity: "moderate" }
      ],
      totalDistance: 74.3,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.8, pace: "5:00/km", duration: 54, description: "Endurance, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 10.8, pace: "3:45/km", duration: 41, description: "6×1000 m, semaine 12.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 10.8, pace: "5:15/km", duration: 57, description: "Récup, semaine 12.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 10.8, pace: "4:15/km", duration: 46, description: "2×20′ marathon, semaine 12.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 16.3, pace: "5:30/km", duration: 90, description: "Spécifique, semaine 12.", intensity: "moderate" }
      ],
      totalDistance: 59.5,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 13,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.5, pace: "5:00/km", duration: 58, description: "Endurance, semaine 13.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 11.5, pace: "3:45/km", duration: 43, description: "6×1000 m, semaine 13.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 11.5, pace: "5:15/km", duration: 60, description: "Récup, semaine 13.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 11.5, pace: "4:15/km", duration: 49, description: "2×20′ marathon, semaine 13.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 17.2, pace: "5:30/km", duration: 95, description: "Spécifique, semaine 13.", intensity: "moderate" }
      ],
      totalDistance: 63.2,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 14,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.1, pace: "5:00/km", duration: 61, description: "Endurance, semaine 14.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 12.1, pace: "3:45/km", duration: 45, description: "6×1000 m, semaine 14.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 12.1, pace: "5:15/km", duration: 64, description: "Récup, semaine 14.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 12.1, pace: "4:15/km", duration: 51, description: "2×20′ marathon, semaine 14.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 18.2, pace: "5:30/km", duration: 100, description: "Spécifique, semaine 14.", intensity: "moderate" }
      ],
      totalDistance: 66.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 15,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.4, pace: "5:00/km", duration: 52, description: "Endurance, semaine 15.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 10.4, pace: "3:45/km", duration: 39, description: "6×1000 m, semaine 15.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 10.4, pace: "5:15/km", duration: 55, description: "Récup, semaine 15.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 10.4, pace: "4:15/km", duration: 44, description: "2×20′ marathon, semaine 15.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 15.7, pace: "5:30/km", duration: 86, description: "Spécifique, semaine 15.", intensity: "moderate" }
      ],
      totalDistance: 57.3,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 16,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.9, pace: "5:00/km", duration: 45, description: "Endurance, semaine 16.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 8.9, pace: "3:45/km", duration: 33, description: "6×1000 m, semaine 16.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.9, pace: "5:15/km", duration: 47, description: "Récup, semaine 16.", intensity: "easy" },
      { day: "Vendredi", type: "Allure spécifique marathon", distance: 8.9, pace: "4:15/km", duration: 38, description: "2×20′ marathon, semaine 16.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 13.4, pace: "5:30/km", duration: 74, description: "Spécifique, semaine 16.", intensity: "moderate" }
      ],
      totalDistance: 49,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  }
];
