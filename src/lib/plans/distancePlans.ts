import type { TrainingPlan } from "./types";

export const distancePlans: TrainingPlan[] = [
  {
    id: "distance_5k_beginner_3days_8weeks",
    name: "5 km — Débutant (3 j, 8 sem.)",
    goal: "distance",
    targetDistance: "5k",
    level: "beginner",
    daysPerWeek: 3,
    durationWeeks: 8,
    summary: "Les intervalles courts restent courts et la longue du dimanche reste très confortable pour apprendre à tenir un rythme. Le volume monte par paliers puis se déleste pour arriver frais sur un 5 km test.",
    equipmentTips: ["Piste d’athlétisme ou segment plat mesuré pour les 400 m du jeudi.","Chronomètre ou appli avec répétition d’intervalles.","Vêtement visible pour les sorties en soirée."],
    nutritionTips: ["Dîner digeste la veille du jeudi (pâtes + légumes, peu de graisse).","Eau pendant la journée, pas seulement au moment de courir.","Petit-déjeuner léger 2 h avant le test final si matinal."],
    shoeTips: ["Chaussure souple pour les répétitions, amortie pour le dimanche.","Évitez une paire toute neuve la semaine du test."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.2, pace: "7:00/km", duration: 36, description: "Base aérobie, semaine 1.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 5.2, pace: "6:15/km", duration: 33, description: "8×400 m récup active, semaine 1.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.9, pace: "7:30/km", duration: 52, description: "Allure très confortable, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 17.3,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.7, pace: "7:00/km", duration: 40, description: "Base aérobie, semaine 2.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 5.7, pace: "6:15/km", duration: 36, description: "8×400 m récup active, semaine 2.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.6, pace: "7:30/km", duration: 57, description: "Allure très confortable, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 19,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "7:00/km", duration: 44, description: "Base aérobie, semaine 3.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 6.3, pace: "6:15/km", duration: 39, description: "8×400 m récup active, semaine 3.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "7:30/km", duration: 63, description: "Allure très confortable, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 21,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5, pace: "7:00/km", duration: 35, description: "Base aérobie, semaine 4.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 5, pace: "6:15/km", duration: 31, description: "8×400 m récup active, semaine 4.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.7, pace: "7:30/km", duration: 50, description: "Allure très confortable, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 16.7,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.6, pace: "7:00/km", duration: 46, description: "Base aérobie, semaine 5.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 6.6, pace: "6:15/km", duration: 41, description: "8×400 m récup active, semaine 5.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.8, pace: "7:30/km", duration: 66, description: "Allure très confortable, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 22,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.1, pace: "7:00/km", duration: 50, description: "Base aérobie, semaine 6.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 7.1, pace: "6:15/km", duration: 44, description: "8×400 m récup active, semaine 6.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.5, pace: "7:30/km", duration: 71, description: "Allure très confortable, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 23.7,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5, pace: "7:00/km", duration: 35, description: "Base aérobie, semaine 7.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 5, pace: "6:15/km", duration: 31, description: "8×400 m récup active, semaine 7.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.7, pace: "7:30/km", duration: 50, description: "Allure très confortable, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 16.7,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 4.3, pace: "7:00/km", duration: 30, description: "Base aérobie, semaine 8.", intensity: "easy" },
      { day: "Jeudi", type: "Intervalles courts", distance: 4.3, pace: "6:15/km", duration: 27, description: "8×400 m récup active, semaine 8.", intensity: "interval" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.8, pace: "7:30/km", duration: 44, description: "Allure très confortable, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 14.4,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_5k_intermediate_4days_8weeks",
    name: "5 km — Intermédiaire (4 j, 8 sem.)",
    goal: "distance",
    targetDistance: "5k",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 8,
    summary: "La semaine type place les répétitions au milieu, encadrées par du facile et une longue stable. L’objectif est de rendre le rythme spécifique 5 km familier sans empiler deux séances dures à la suite.",
    equipmentTips: ["GPS fiable pour vérifier la régularité des 400 m.","Rouleaux ou balle pour les mollets après les séances rapides.","Couche technique par temps humide pour le jeudi."],
    nutritionTips: ["Gel ou jus de fruit seulement si la séance du mercredi dépasse 55′.","Repas riche en fer (lentilles, viande maigre) deux fois par semaine.","Café 60′ avant le tempo si habitué, sinon abstenez-vous."],
    shoeTips: ["Modèle réactif bas drop pour les 400 m, autre paire pour l’endurance.","Surveillez l’usure du talon : asymétrie = risque de blessure."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.9, pace: "5:45/km", duration: 40, description: "Technique et foulée, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 4.6, pace: "4:30/km", duration: 21, description: "10×400 m, récup 200 m, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 4.6, pace: "6:00/km", duration: 28, description: "Détente active, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.9, pace: "6:15/km", duration: 43, description: "Inclure 3×3′ modérés au milieu, semaine 1.", intensity: "moderate" }
      ],
      totalDistance: 23,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "5:45/km", duration: 44, description: "Technique et foulée, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 5.1, pace: "4:30/km", duration: 23, description: "10×400 m, récup 200 m, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.1, pace: "6:00/km", duration: 31, description: "Détente active, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.6, pace: "6:15/km", duration: 48, description: "Inclure 3×3′ modérés au milieu, semaine 2.", intensity: "moderate" }
      ],
      totalDistance: 25.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.4, pace: "5:45/km", duration: 48, description: "Technique et foulée, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 5.6, pace: "4:30/km", duration: 25, description: "10×400 m, récup 200 m, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.6, pace: "6:00/km", duration: 34, description: "Détente active, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "6:15/km", duration: 53, description: "Inclure 3×3′ modérés au milieu, semaine 3.", intensity: "moderate" }
      ],
      totalDistance: 28,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.7, pace: "5:45/km", duration: 39, description: "Technique et foulée, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 4.5, pace: "4:30/km", duration: 20, description: "10×400 m, récup 200 m, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 4.5, pace: "6:00/km", duration: 27, description: "Détente active, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.7, pace: "6:15/km", duration: 42, description: "Inclure 3×3′ modérés au milieu, semaine 4.", intensity: "moderate" }
      ],
      totalDistance: 22.4,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.8, pace: "5:45/km", duration: 51, description: "Technique et foulée, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 5.9, pace: "4:30/km", duration: 27, description: "10×400 m, récup 200 m, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.9, pace: "6:00/km", duration: 35, description: "Détente active, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.8, pace: "6:15/km", duration: 55, description: "Inclure 3×3′ modérés au milieu, semaine 5.", intensity: "moderate" }
      ],
      totalDistance: 29.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:45/km", duration: 55, description: "Technique et foulée, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 6.3, pace: "4:30/km", duration: 28, description: "10×400 m, récup 200 m, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.3, pace: "6:00/km", duration: 38, description: "Détente active, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.5, pace: "6:15/km", duration: 59, description: "Inclure 3×3′ modérés au milieu, semaine 6.", intensity: "moderate" }
      ],
      totalDistance: 31.6,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.7, pace: "5:45/km", duration: 39, description: "Technique et foulée, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 4.5, pace: "4:30/km", duration: 20, description: "10×400 m, récup 200 m, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 4.5, pace: "6:00/km", duration: 27, description: "Détente active, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 6.7, pace: "6:15/km", duration: 42, description: "Inclure 3×3′ modérés au milieu, semaine 7.", intensity: "moderate" }
      ],
      totalDistance: 22.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.8, pace: "5:45/km", duration: 33, description: "Technique et foulée, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles courts", distance: 3.8, pace: "4:30/km", duration: 17, description: "10×400 m, récup 200 m, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 3.8, pace: "6:00/km", duration: 23, description: "Détente active, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 5.8, pace: "6:15/km", duration: 36, description: "Inclure 3×3′ modérés au milieu, semaine 8.", intensity: "moderate" }
      ],
      totalDistance: 19.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_10k_beginner_3days_12weeks",
    name: "10 km — Débutant (3 j, 12 sem.)",
    goal: "distance",
    targetDistance: "10k",
    level: "beginner",
    daysPerWeek: 3,
    durationWeeks: 12,
    summary: "Trois sorties suffisent si elles sont bien typées : facile, tempo court, longue du week-end. Sur trois mois vous consoliderez l’endurance de fond avant de réduire le volume pour viser un 10 km solide.",
    equipmentTips: ["Sac banane pour emporter une petite bouteille sur la longue > 75′.","Crème anti-frottements pour les sorties humides.","Journal d’entraînement papier ou appli pour noter les sensations."],
    nutritionTips: ["Testez votre petit-déjeuner type compétition une fois sur la longue du dimanche.","Hydratez-vous toutes les 25′ quand la séance dépasse 70′.","Dîner glucides modérés la veille du jeudi tempo."],
    shoeTips: ["Chaussure avec bon déroulé pour les temps au seuil bas.","Remplacez avant 800 km si la semelle est lisse sur le bitume."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.8, pace: "7:00/km", duration: 55, description: "Jambes légères, semaine 1.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 7.8, pace: "6:15/km", duration: 49, description: "20–25′ au seuil bas, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "7:30/km", duration: 78, description: "Progression douce sur la 2e moitié si bon feeling, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 26,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.4, pace: "7:00/km", duration: 59, description: "Jambes légères, semaine 2.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 8.4, pace: "6:15/km", duration: 53, description: "20–25′ au seuil bas, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.2, pace: "7:30/km", duration: 84, description: "Progression douce sur la 2e moitié si bon feeling, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 28,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9, pace: "7:00/km", duration: 63, description: "Jambes légères, semaine 3.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 9, pace: "6:15/km", duration: 56, description: "20–25′ au seuil bas, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12, pace: "7:30/km", duration: 90, description: "Progression douce sur la 2e moitié si bon feeling, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 30,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.4, pace: "7:00/km", duration: 52, description: "Jambes légères, semaine 4.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 7.4, pace: "6:15/km", duration: 46, description: "20–25′ au seuil bas, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.8, pace: "7:30/km", duration: 74, description: "Progression douce sur la 2e moitié si bon feeling, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 24.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.1, pace: "7:00/km", duration: 50, description: "Jambes légères, semaine 5.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 7.1, pace: "6:15/km", duration: 44, description: "20–25′ au seuil bas, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.4, pace: "7:30/km", duration: 71, description: "Progression douce sur la 2e moitié si bon feeling, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 23.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "7:00/km", duration: 53, description: "Jambes légères, semaine 6.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 7.6, pace: "6:15/km", duration: 48, description: "20–25′ au seuil bas, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.1, pace: "7:30/km", duration: 76, description: "Progression douce sur la 2e moitié si bon feeling, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 25.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.1, pace: "7:00/km", duration: 57, description: "Jambes légères, semaine 7.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 8.1, pace: "6:15/km", duration: 51, description: "20–25′ au seuil bas, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.8, pace: "7:30/km", duration: 81, description: "Progression douce sur la 2e moitié si bon feeling, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 27,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.6, pace: "7:00/km", duration: 46, description: "Jambes légères, semaine 8.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 6.6, pace: "6:15/km", duration: 41, description: "20–25′ au seuil bas, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.8, pace: "7:30/km", duration: 66, description: "Progression douce sur la 2e moitié si bon feeling, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 22,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "7:00/km", duration: 44, description: "Jambes légères, semaine 9.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 6.3, pace: "6:15/km", duration: 39, description: "20–25′ au seuil bas, semaine 9.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "7:30/km", duration: 63, description: "Progression douce sur la 2e moitié si bon feeling, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 21,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.8, pace: "7:00/km", duration: 48, description: "Jambes légères, semaine 10.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 6.8, pace: "6:15/km", duration: 43, description: "20–25′ au seuil bas, semaine 10.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.1, pace: "7:30/km", duration: 68, description: "Progression douce sur la 2e moitié si bon feeling, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 22.7,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "7:00/km", duration: 44, description: "Jambes légères, semaine 11.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 6.3, pace: "6:15/km", duration: 39, description: "20–25′ au seuil bas, semaine 11.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.4, pace: "7:30/km", duration: 63, description: "Progression douce sur la 2e moitié si bon feeling, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 21,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.4, pace: "7:00/km", duration: 38, description: "Jambes légères, semaine 12.", intensity: "easy" },
      { day: "Jeudi", type: "Sortie tempo", distance: 5.4, pace: "6:15/km", duration: 34, description: "20–25′ au seuil bas, semaine 12.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.2, pace: "7:30/km", duration: 54, description: "Progression douce sur la 2e moitié si bon feeling, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 18,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_10k_intermediate_4days_12weeks",
    name: "10 km — Intermédiaire (4 j, 12 sem.)",
    goal: "distance",
    targetDistance: "10k",
    level: "intermediate",
    daysPerWeek: 4,
    durationWeeks: 12,
    summary: "Les 1000 m au milieu de semaine renforcent l’économie de course pendant que la longue du dimanche reste le pilier aérobie. Les semaines 4 et 8 coupent le volume pour absorber la charge.",
    equipmentTips: ["Montre avec alertes pour les récupérations 2′ entre 1000 m.","Lunettes si vent fort sur la piste ou le plat.","Étirements dynamiques 8′ avant les intervalles."],
    nutritionTips: ["Boisson isotonique maison (eau + jus + pincée de sel) au-delà de 75′.","Dormir 7 h minimum la nuit suivant les mercredis qualité.","Collation yaourt + flocons d’avoine après la longue."],
    shoeTips: ["Paire légère pour mercredis, chaussure plus protectrice pour dimanche.","Contrôle de foulée utile si douleurs récurrentes aux 1000 m."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.9, pace: "5:45/km", duration: 63, description: "Base, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 7.3, pace: "4:30/km", duration: 33, description: "4×1000 m récup 2′, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.3, pace: "6:00/km", duration: 44, description: "Récup post-intervalles, semaine 1.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.9, pace: "6:15/km", duration: 68, description: "Allure marathon imaginaire sur 20′, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 36.4,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.8, pace: "5:45/km", duration: 68, description: "Base, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 7.9, pace: "4:30/km", duration: 36, description: "4×1000 m récup 2′, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.9, pace: "6:00/km", duration: 47, description: "Récup post-intervalles, semaine 2.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.8, pace: "6:15/km", duration: 74, description: "Allure marathon imaginaire sur 20′, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 39.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 12.6, pace: "5:45/km", duration: 72, description: "Base, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 8.4, pace: "4:30/km", duration: 38, description: "4×1000 m récup 2′, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.4, pace: "6:00/km", duration: 50, description: "Récup post-intervalles, semaine 3.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.6, pace: "6:15/km", duration: 79, description: "Allure marathon imaginaire sur 20′, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 42,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.4, pace: "5:45/km", duration: 60, description: "Base, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 6.9, pace: "4:30/km", duration: 31, description: "4×1000 m récup 2′, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.9, pace: "6:00/km", duration: 41, description: "Récup post-intervalles, semaine 4.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "6:15/km", duration: 65, description: "Allure marathon imaginaire sur 20′, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 34.6,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.8, pace: "5:45/km", duration: 56, description: "Base, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 6.6, pace: "4:30/km", duration: 30, description: "4×1000 m récup 2′, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.6, pace: "6:00/km", duration: 40, description: "Récup post-intervalles, semaine 5.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.8, pace: "6:15/km", duration: 61, description: "Allure marathon imaginaire sur 20′, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 32.8,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 10.6, pace: "5:45/km", duration: 61, description: "Base, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 7.1, pace: "4:30/km", duration: 32, description: "4×1000 m récup 2′, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.1, pace: "6:00/km", duration: 43, description: "Récup post-intervalles, semaine 6.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.6, pace: "6:15/km", duration: 66, description: "Allure marathon imaginaire sur 20′, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 35.4,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 11.4, pace: "5:45/km", duration: 66, description: "Base, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 7.6, pace: "4:30/km", duration: 34, description: "4×1000 m récup 2′, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.6, pace: "6:00/km", duration: 46, description: "Récup post-intervalles, semaine 7.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.4, pace: "6:15/km", duration: 71, description: "Allure marathon imaginaire sur 20′, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 38,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.3, pace: "5:45/km", duration: 53, description: "Base, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 6.2, pace: "4:30/km", duration: 28, description: "4×1000 m récup 2′, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.2, pace: "6:00/km", duration: 37, description: "Récup post-intervalles, semaine 8.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.3, pace: "6:15/km", duration: 58, description: "Allure marathon imaginaire sur 20′, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 31,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 9,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.9, pace: "5:45/km", duration: 51, description: "Base, semaine 9.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 5.9, pace: "4:30/km", duration: 27, description: "4×1000 m récup 2′, semaine 9.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.9, pace: "6:00/km", duration: 35, description: "Récup post-intervalles, semaine 9.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.9, pace: "6:15/km", duration: 56, description: "Allure marathon imaginaire sur 20′, semaine 9.", intensity: "easy" }
      ],
      totalDistance: 29.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 10,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 9.5, pace: "5:45/km", duration: 55, description: "Base, semaine 10.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 6.4, pace: "4:30/km", duration: 29, description: "4×1000 m récup 2′, semaine 10.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.4, pace: "6:00/km", duration: 38, description: "Récup post-intervalles, semaine 10.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.5, pace: "6:15/km", duration: 59, description: "Allure marathon imaginaire sur 20′, semaine 10.", intensity: "easy" }
      ],
      totalDistance: 31.8,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 11,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.8, pace: "5:45/km", duration: 51, description: "Base, semaine 11.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 5.9, pace: "4:30/km", duration: 27, description: "4×1000 m récup 2′, semaine 11.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.9, pace: "6:00/km", duration: 35, description: "Récup post-intervalles, semaine 11.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 8.8, pace: "6:15/km", duration: 55, description: "Allure marathon imaginaire sur 20′, semaine 11.", intensity: "easy" }
      ],
      totalDistance: 29.4,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 12,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "5:45/km", duration: 44, description: "Base, semaine 12.", intensity: "easy" },
      { day: "Mercredi", type: "Intervalles longs", distance: 5, pace: "4:30/km", duration: 23, description: "4×1000 m récup 2′, semaine 12.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5, pace: "6:00/km", duration: 30, description: "Récup post-intervalles, semaine 12.", intensity: "easy" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.6, pace: "6:15/km", duration: 48, description: "Allure marathon imaginaire sur 20′, semaine 12.", intensity: "easy" }
      ],
      totalDistance: 25.2,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
  {
    id: "distance_10k_advanced_5days_8weeks",
    name: "10 km — Avancé (5 j, 8 sem.)",
    goal: "distance",
    targetDistance: "10k",
    level: "advanced",
    daysPerWeek: 5,
    durationWeeks: 8,
    summary: "Cinq séances injectent du neuromusculaire (côtes), du tempo et une longue sans juxtaposer deux jours exigeants. L’affûtage final préserve la fraîcheur pour convertir le travail en chrono sur 10 km.",
    equipmentTips: ["Terrain de côtes court et raide plutôt que une montée interminable.","Corde à sauter 5′ en échauffement avant les côtes.","Veste coupe-vent pour les récupérations très lentes."],
    nutritionTips: ["Repas riche en glucides complexes la veille du vendredi tempo.","Magnésium alimentaire (oléagineux) si crampes sur les côtes.","Évitez les nouveaux produits la semaine du test 10 km."],
    shoeTips: ["Chaussures avec bon grip pour les montées courtes.","Compétition réservée à une paire testée sur au moins trois tempo."],
    weeklySchedule: [
    {
      week: 1,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.3, pace: "5:00/km", duration: 32, description: "Réveil musculaire, semaine 1.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 6.3, pace: "3:45/km", duration: 24, description: "8×60 m montée, récup descente, semaine 1.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.3, pace: "5:15/km", duration: 33, description: "Flux libre, semaine 1.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 6.3, pace: "4:15/km", duration: 27, description: "25′ un peu sous seuil, semaine 1.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.4, pace: "5:30/km", duration: 52, description: "Moteur aérobie, semaine 1.", intensity: "easy" }
      ],
      totalDistance: 34.6,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 2,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.9, pace: "5:00/km", duration: 35, description: "Réveil musculaire, semaine 2.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 6.9, pace: "3:45/km", duration: 26, description: "8×60 m montée, récup descente, semaine 2.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.9, pace: "5:15/km", duration: 36, description: "Flux libre, semaine 2.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 6.9, pace: "4:15/km", duration: 29, description: "25′ un peu sous seuil, semaine 2.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 10.4, pace: "5:30/km", duration: 57, description: "Moteur aérobie, semaine 2.", intensity: "easy" }
      ],
      totalDistance: 38,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 3,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 7.6, pace: "5:00/km", duration: 38, description: "Réveil musculaire, semaine 3.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 7.6, pace: "3:45/km", duration: 29, description: "8×60 m montée, récup descente, semaine 3.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 7.6, pace: "5:15/km", duration: 40, description: "Flux libre, semaine 3.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 7.6, pace: "4:15/km", duration: 32, description: "25′ un peu sous seuil, semaine 3.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 11.4, pace: "5:30/km", duration: 63, description: "Moteur aérobie, semaine 3.", intensity: "easy" }
      ],
      totalDistance: 41.8,
      focus: "Consolidation : tenir le rythme hebdo avec qualité modérée."
    },
    {
      week: 4,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.1, pace: "5:00/km", duration: 31, description: "Réveil musculaire, semaine 4.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 6.1, pace: "3:45/km", duration: 23, description: "8×60 m montée, récup descente, semaine 4.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.1, pace: "5:15/km", duration: 32, description: "Flux libre, semaine 4.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 6.1, pace: "4:15/km", duration: 26, description: "25′ un peu sous seuil, semaine 4.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.1, pace: "5:30/km", duration: 50, description: "Moteur aérobie, semaine 4.", intensity: "easy" }
      ],
      totalDistance: 33.5,
      focus: "Semaine de récupération : volume réduit, sensations avant tout."
    },
    {
      week: 5,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8, pace: "5:00/km", duration: 40, description: "Réveil musculaire, semaine 5.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 8, pace: "3:45/km", duration: 30, description: "8×60 m montée, récup descente, semaine 5.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8, pace: "5:15/km", duration: 42, description: "Flux libre, semaine 5.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 8, pace: "4:15/km", duration: 34, description: "25′ un peu sous seuil, semaine 5.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12, pace: "5:30/km", duration: 66, description: "Moteur aérobie, semaine 5.", intensity: "easy" }
      ],
      totalDistance: 44,
      focus: "Entrée de cycle : poser des bases propres et régulières."
    },
    {
      week: 6,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 8.6, pace: "5:00/km", duration: 43, description: "Réveil musculaire, semaine 6.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 8.6, pace: "3:45/km", duration: 32, description: "8×60 m montée, récup descente, semaine 6.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 8.6, pace: "5:15/km", duration: 45, description: "Flux libre, semaine 6.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 8.6, pace: "4:15/km", duration: 37, description: "25′ un peu sous seuil, semaine 6.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 12.9, pace: "5:30/km", duration: 71, description: "Moteur aérobie, semaine 6.", intensity: "easy" }
      ],
      totalDistance: 47.3,
      focus: "Progression mesurée : + charge sans forcer la vitesse."
    },
    {
      week: 7,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 6.1, pace: "5:00/km", duration: 31, description: "Réveil musculaire, semaine 7.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 6.1, pace: "3:45/km", duration: 23, description: "8×60 m montée, récup descente, semaine 7.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 6.1, pace: "5:15/km", duration: 32, description: "Flux libre, semaine 7.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 6.1, pace: "4:15/km", duration: 26, description: "25′ un peu sous seuil, semaine 7.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 9.2, pace: "5:30/km", duration: 51, description: "Moteur aérobie, semaine 7.", intensity: "easy" }
      ],
      totalDistance: 33.6,
      focus: "Affûtage : volume −30 %, garder une touche de qualité."
    },
    {
      week: 8,
      sessions: [
      { day: "Mardi", type: "Sortie facile", distance: 5.2, pace: "5:00/km", duration: 26, description: "Réveil musculaire, semaine 8.", intensity: "easy" },
      { day: "Mercredi", type: "Côtes", distance: 5.2, pace: "3:45/km", duration: 20, description: "8×60 m montée, récup descente, semaine 8.", intensity: "interval" },
      { day: "Jeudi", type: "Récupération active", distance: 5.2, pace: "5:15/km", duration: 27, description: "Flux libre, semaine 8.", intensity: "easy" },
      { day: "Vendredi", type: "Sortie tempo", distance: 5.2, pace: "4:15/km", duration: 22, description: "25′ un peu sous seuil, semaine 8.", intensity: "tempo" },
      { day: "Dimanche", type: "Sortie longue", distance: 7.9, pace: "5:30/km", duration: 43, description: "Moteur aérobie, semaine 8.", intensity: "easy" }
      ],
      totalDistance: 28.7,
      focus: "Dernière ligne : volume −40 %, fraîcheur avant l’objectif."
    }
    ]
  },
];
