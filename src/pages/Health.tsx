import { ScrollReveal } from "@/components/ScrollReveal";
import { CollapsibleDisclaimer } from "@/components/CollapsibleDisclaimer";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Issue = {
  name: string;
  symptomesRessentis: string[];
  causesProbables: string[];
  meilleurMoyenSoulager: string[];
  risques: string[];
  conseils: string[];
};

const issuesData: Record<string, Issue> = {
  "Syndrome rotulien": {
    name: "Syndrome rotulien",
    symptomesRessentis: [
      "Douleur en avant du genou, sous ou autour de la rotule",
      "La douleur s'aggrave en montant les escaliers ou en descendant",
      "Sensation de douleur après une course, surtout en côte",
      "Léger gonflement autour du genou",
      "La douleur peut être unilatérale (un seul genou) ou bilatérale",
    ],
    causesProbables: [
      "Muscles de la cuisse faibles, surtout à l'intérieur (déséquilibre)",
      "Vous avez augmenté votre volume de course trop vite",
      "Votre technique de course n'est pas optimale",
      "Fessiers faibles qui ne stabilisent pas votre bassin",
      "Chaussures inadaptées à votre morphologie",
    ],
    meilleurMoyenSoulager: [
      "Repos et réduction progressive (pas d'arrêt complet)",
      "Glaçage 15-20 min 3-4 fois par jour",
      "Renforcement des muscles autour du genou (squats, fentes)",
      "Massages réguliers des cuisses et du genou",
      "Utiliser du taping pour soutenir la rotule",
    ],
    risques: [
      "Douleur chronique qui revient encore et encore",
      "Changement de votre foulée qui crée des problèmes au genou opposé",
      "Douleur à la hanche ou à la cheville à cause de la compensation",
    ],
    conseils: [
      "Renforcez régulièrement (3-4x/semaine) pour prévenir le retour",
      "Augmentez votre volume de course de 10% maximum par semaine",
      "Reprenez progressivement la course plutôt que l'arrêter complètement",
      "Vérifiez vos chaussures : elles doivent être adaptées à votre morphologie",
    ],
  },
  "Syndrome de l'essuie-glace": {
    name: "Syndrome de l'essuie-glace",
    symptomesRessentis: [
      "Douleur sur le côté externe du genou, surtout en cours de route",
      "La douleur s'améliore avec le repos mais revient rapidement",
      "Sensation de friction ou de pincement sur le côté du genou",
      "La douleur s'aggrave particulièrement en descente",
      "Peut être unilatéral (un seul côté)",
    ],
    causesProbables: [
      "Une bande musculaire sur le côté de la cuisse (fascia iliotibial) est trop tendue",
      "Votre genou n'est pas bien aligné pendant la course",
      "Augmentation trop rapide du kilométrage",
      "Fessiers faibles qui ne stabilisent pas votre hanche",
    ],
    meilleurMoyenSoulager: [
      "Repos partiel et réduction du kilométrage",
      "Glaçage après chaque séance",
      "Étirement intensif avec un rouleau (foam rolling) quotidiennement",
      "Renforcement des muscles de la hanche (fessiers, abducteurs)",
      "Améliorer votre posture en course",
    ],
    risques: [
      "Peut devenir chronique pendant plusieurs mois",
      "Limitation de votre capacité à courir normalement",
      "Compensation sur l'autre jambe qui peut créer une douleur similaire",
    ],
    conseils: [
      "Le foam rolling quotidien est très efficace (30 sec par jambe)",
      "Réduisez votre kilométrage de 20-30% pendant 2-4 semaines",
      "Consultez un kiné pour un travail spécifique de la hanche",
      "Étirez-vous avant et après chaque séance",
    ],
  },
  "Menisque": {
    name: "Lésion méniscale",
    symptomesRessentis: [
      "Douleur localisée à l'intérieur ou l'extérieur du genou",
      "Sensation de blocage ou de « claquement » du genou",
      "Impression que le genou va vous lâcher",
      "Gonflement du genou (peut être immédiat ou progressif)",
      "Difficulté à plier ou étendre le genou complètement",
    ],
    causesProbables: [
      "Un coup ou mouvement brusque a endommagé le cartilage du genou",
      "Faiblesse des muscles autour du genou",
      "Mauvais alignement du genou pendant la course",
      "Usure naturelle du cartilage avec l'âge",
    ],
    meilleurMoyenSoulager: [
      "Repos complet au départ",
      "Glaçage répété 3-4 fois par jour les premiers jours",
      "Renforcement du quadriceps (la partie avant de la cuisse)",
      "Anti-inflammatoires si douleur intense (consulter médecin)",
      "Physiothérapie progressive avec un kiné",
    ],
    risques: [
      "Le genou peut se bloquer complètement (impossible de bouger)",
      "Accumulation de liquide dans le genou (épanchement)",
      "Évolution vers l'arthrose du genou à long terme",
      "Limitation permanente de l'activité physique si non traité",
    ],
    conseils: [
      "Vous devez faire une IRM pour confirmer le diagnostic",
      "Consultez un médecin ou orthopédiste rapidement",
      "Le repos seul ne suffit pas : la rééducation est essentielle",
      "Pendant la récupération, préférez le vélo ou la natation (sans impact)",
    ],
  },
  "Periostite tibiale": {
    name: "Périostite tibiale",
    symptomesRessentis: [
      "Douleur sur le tibia (os de la jambe inférieure)",
      "Douleur qui s'aggrave progressivement en courant",
      "Sensibilité au toucher le long du tibia",
      "Douleur généralement présente au début et à la fin de la course",
      "Peut apparaître soudainement après augmentation de kilométrage",
    ],
    causesProbables: [
      "Vous avez augmenté votre volume ou intensité de course trop vite",
      "Muscles faibles qui ne supportent pas les chocs",
      "Vous courez sur une surface trop dure (béton plutôt que bitume)",
      "Chaussures usées ou inadaptées",
      "Manque d'étirement des mollets",
    ],
    meilleurMoyenSoulager: [
      "Réduction immédiate du kilométrage (pas zéro, mais moins)",
      "Glaçage 15-20 min après chaque entraînement",
      "Renforcement des muscles du tibia (tibiales antérieures)",
      "Changement de surface de course (préférer le bitume)",
      "Vérification et remplacement des chaussures si usées",
    ],
    risques: [
      "Peut évoluer vers une fracture de fatigue du tibia",
      "Compensation sur l'autre jambe",
      "Arrêt prolongé de la course si progression vers fracture",
    ],
    conseils: [
      "Respectez la règle du 10% : augmentez seulement de 10% par semaine",
      "Échauffement obligatoire : 10 min minimum avant de courir",
      "Renforcez les tibiales 3-4 fois par semaine",
      "Préférez le bitume au béton ou asphalte",
    ],
  },
  "Fracture de fatigue": {
    name: "Fracture de fatigue",
    symptomesRessentis: [
      "Douleur localisée qui s'aggrave progressivement",
      "Douleur qui persiste même au repos",
      "Gonflement ou rougeur autour de la zone",
      "Sensation de douleur sourde et persistante",
      "Impossible de continuer à courir sans aggraver la douleur",
    ],
    causesProbables: [
      "Augmentation trop rapide du volume d'entraînement",
      "Chocs répétés sans récupération suffisante",
      "Manque de calcium ou vitamine D dans votre alimentation",
      "Syndrome RED-S : apport énergétique insuffisant pour l'effort",
    ],
    meilleurMoyenSoulager: [
      "Repos complet de la zone (4-8 semaines minimum)",
      "Maintien de la condition physique par vélo ou natation",
      "Supplémentation en calcium et vitamine D",
      "Rééducation progressive avec un kiné",
    ],
    risques: [
      "Aggravation et déplacement de la fracture en cas de charge",
      "Non-consolidation de l'os (pseudarthrose)",
      "Arrêt prolongé et perte de capacités physiques",
    ],
    conseils: [
      "IRM ou radio indispensable pour confirmer",
      "Consultez un médecin du sport immédiatement",
      "Cessez la course : maintenez votre forme par natation/vélo",
      "Riche en protéines, calcium, vitamine D pour la cicatrisation",
    ],
  },
  "Entorse de cheville": {
    name: "Entorse de cheville",
    symptomesRessentis: [
      "Douleur soudaine à la cheville après un faux pas",
      "Gonflement rapide autour de la cheville",
      "Bleu/ecchymose autour de la cheville",
      "Difficultés à marcher ou à prendre appui",
      "Sensation d'instabilité de la cheville",
    ],
    causesProbables: [
      "Vous avez tourné votre pied d'un côté pendant la course",
      "Faiblesse des muscles qui stabilisent la cheville",
      "Terrain accidenté ou perte d'équilibre",
      "Antécédents d'entorses répétées",
    ],
    meilleurMoyenSoulager: [
      "RICE : Repos, Glaçage, Compression, Surélevation (48-72h)",
      "Travail d'équilibre et proprioception progressif",
      "Physiothérapie pour renforcer les stabilisateurs",
      "Taping de stabilisation avant de reprendre la course",
      "Anti-inflammatoires si douleur",
    ],
    risques: [
      "Instabilité chronique de la cheville si rééducation incomplète",
      "Entorses répétées",
      "Douleurs secondaires au genou ou à la hanche",
    ],
    conseils: [
      "La rééducation proprioceptive est TRÈS importante",
      "Progression : marche → trot → course (graduelle)",
      "Équilibre quotidien : plateau proprioceptif ou yoga",
      "Renforcez les stabilisateurs externes de la cheville",
    ],
  },
  "Tendinite des peroniers": {
    name: "Tendinite des péroniers",
    symptomesRessentis: [
      "Douleur sur le côté externe de la cheville",
      "Douleur qui s'aggrave progressivement en courant",
      "Sensibilité au toucher sur le côté de la cheville/pied",
      "Gonflement léger sur le côté de la cheville",
      "La douleur peut irradier vers le haut et le bas du pied",
    ],
    causesProbables: [
      "Surcharge progressive d'entraînement",
      "Manque d'étirement et de renforcement de la cheville",
      "Terrain trop changeant ou avec trop de pentes",
      "Chaussures trop serrées au niveau latéral (côté)",
    ],
    meilleurMoyenSoulager: [
      "Repos partiel et réduction du kilométrage",
      "Glaçage post-entraînement",
      "Massages réguliers du tendon",
      "Étirements doux du mollet et du jambier",
      "Renforcement des péroniers avec élastique",
    ],
    risques: [
      "Peut devenir chronique (plusieurs mois)",
      "Évolution vers une tendinopathie chronique",
      "Compensation et douleur sur l'autre jambe",
    ],
    conseils: [
      "Massez régulièrement (auto-massage ou kiné)",
      "Étirement quotidien : 3-4 fois 1-2 min chacun",
      "Renforcement : résistance bande élastique 3x/semaine",
      "Portez des chaussures larges au niveau du pied",
    ],
  },
  "Fasciite plantaire": {
    name: "Fasciite plantaire",
    symptomesRessentis: [
      "Douleur sous le pied, particulièrement au talon",
      "La douleur est pire le matin au lever",
      "Amélioration progressive en marchant",
      "Douleur qui revient après repos prolongé",
      "Sensation de tension sous la voûte plantaire",
    ],
    causesProbables: [
      "Tension excessive de la bande musculaire sous le pied",
      "Pied plat ou creux mal corrigé",
      "Augmentation de kilométrage ou changement de surface",
      "Manque d'étirement des mollets",
      "Surpoids ou changement d'activité",
    ],
    meilleurMoyenSoulager: [
      "Massages de la voûte plantaire (balle, rouleau)",
      "Étirement du mollet et de la plante du pied",
      "Semelles orthopédiques ou coussinets si besoin",
      "Glaçage et anti-inflammatoires",
      "Repos matinal avant mise en charge",
    ],
    risques: [
      "Douleur chronique limitant marche et course",
      "Développement d'épine calcanéenne",
      "Compensation et douleurs au genou/hanche",
    ],
    conseils: [
      "Massez avec une balle la plante du pied quotidiennement",
      "Étirez le mollet chaque matin et soir",
      "Portez des chaussures bien soutenues",
      "Augmentation progressive du kilométrage",
    ],
  },
  "Fracture de fatigue metatarsienne": {
    name: "Fracture de fatigue du métatarse",
    symptomesRessentis: [
      "Douleur sur le dessus ou la plante du pied",
      "Gonflement localisé sur l'avant du pied",
      "Douleur qui s'aggrave avec la marche/course",
      "Bleu/ecchymose possible",
      "Impossible de supporter le poids sur cette zone",
    ],
    causesProbables: [
      "Augmentation trop rapide du volume d'entraînement",
      "Surface de course trop dure sans amorti",
      "Manque de calcium ou vitamine D",
      "Technique de foulée orientée trop sur l'avant du pied",
    ],
    meilleurMoyenSoulager: [
      "Repos complet (6-8 semaines minimum)",
      "Immobilisation temporaire si douleur sévère",
      "Marche progressive, pas de course",
      "Physiothérapie après cicatrisation",
    ],
    risques: [
      "Non-consolidation de la fracture (pseudarthrose)",
      "Douleur chronique au pied",
      "Arrêt prolongé et perte de forme",
    ],
    conseils: [
      "Radio ou IRM nécessaire pour confirmer",
      "Cessez IMMÉDIATEMENT la course",
      "Calcium, vitamine D, protéines pour cicatrisation",
      "Retour à la course graduel sur 3-4 mois",
    ],
  },
  "Elongation du flechisseur de hanche": {
    name: "Élongation du fléchisseur de hanche",
    symptomesRessentis: [
      "Douleur à l'avant de la hanche ou de l'aine",
      "Douleur qui s'aggrave en levant la jambe",
      "Sensation de raideur en montant les escaliers",
      "Douleur pire après une course ou au repos",
      "Peut limiter votre amplitude de mouvement",
    ],
    causesProbables: [
      "Manque d'étirement chronique de la hanche",
      "Technique de course avec cadence trop basse",
      "Travail assis longtemps pendant la journée",
      "Sautés ou efforts explosifs mal préparés",
    ],
    meilleurMoyenSoulager: [
      "Repos partiel et ajustement de la cadence",
      "Étirements intensifs du psoas (muscle profond)",
      "Glaçage après effort",
      "Renforcement des extenseurs de hanche",
      "Yoga ou Pilates pour la mobilité",
    ],
    risques: [
      "Douleur chronique à la flexion de hanche",
      "Limitation de votre amplitude de foulée",
      "Compensation et douleur au genou/bas du dos",
    ],
    conseils: [
      "Étirez quotidiennement en fente avant (1-2 min chaque côté)",
      "Adoptez une cadence plus élevée (plus court, plus rapide)",
      "Levez-vous régulièrement si travail assis",
      "Yoga 2-3x/semaine pour la mobilité",
    ],
  },
  "Bursite": {
    name: "Bursite de la hanche",
    symptomesRessentis: [
      "Douleur sur le côté de la hanche, surtout en position couchée",
      "Douleur qui s'aggrave après la course",
      "Sensation d'inflammation sur le côté de la hanche",
      "Difficultés à dormir du côté douloureux",
      "Douleur en s'allongeant sur le côté",
    ],
    causesProbables: [
      "Inflammation d'une petite poche liquide (bourse séreuse) à la hanche",
      "Fessiers faibles qui ne stabilisent pas la hanche",
      "Compensation de douleur d'un côté",
      "Augmentation trop rapide du volume d'entraînement",
    ],
    meilleurMoyenSoulager: [
      "Repos partiel et réduction d'intensité",
      "Glaçage régulier",
      "Renforcement spécifique des fessiers",
      "Étirements du piriforme et fessiers",
      "Anti-inflammatoires si douleur persistante",
    ],
    risques: [
      "Chronicité de la douleur",
      "Limitation persistante de la hanche",
      "Compensation et douleur au genou",
    ],
    conseils: [
      "Travail spécifique des fessiers : 4-5x/semaine minimum",
      "Réduction kilométrique 2-3 semaines",
      "Évitez de croiser les jambes en position debout",
      "Dormez sur le dos ou bien soutenu",
    ],
  },
  "Elongation du mollet": {
    name: "Élongation du mollet",
    symptomesRessentis: [
      "Douleur soudaine à l'arrière de la jambe",
      "Sensation de tension ou de crampe du mollet",
      "Douleur qui s'aggrave en pointe de pied",
      "Légère raideur du mollet",
      "Peut limiter votre capacité à courir",
    ],
    causesProbables: [
      "Manque d'échauffement avant effort",
      "Faiblesse ou déséquilibre du mollet",
      "Augmentation trop rapide du volume/intensité",
      "Mauvaise longueur de foulée",
    ],
    meilleurMoyenSoulager: [
      "Repos immédiat et glaçage",
      "Étirement doux puis progressif du mollet",
      "Renforcement excentrique (travail en descente)",
      "Massages réguliers du mollet",
      "Retour progressif à la course",
    ],
    risques: [
      "Rupture complète du mollet si charge maintenue",
      "Douleur chronique",
      "Compensation sur l'autre jambe",
    ],
    conseils: [
      "Échauffement 10 min obligatoire avant chaque séance",
      "Étirement quotidien : 3-4 fois 1-2 min",
      "Rentrée progressive : marche → trot → course",
      "Renforcement excentrique 3x/semaine",
    ],
  },
  "Tendinite d'Achille": {
    name: "Tendinite d'Achille",
    symptomesRessentis: [
      "Douleur à l'arrière du talon",
      "Douleur qui s'aggrave le matin ou après repos",
      "Raideur du talon en début de course",
      "Gonflement possible à l'arrière du talon",
      "Craquement possible en bougeant",
    ],
    causesProbables: [
      "Surcharge progressive du tendon (talon d'Achille)",
      "Manque d'étirement et échauffement",
      "Augmentation trop rapide du volume ou de la pente",
      "Faiblesse des muscles du mollet",
    ],
    meilleurMoyenSoulager: [
      "Repos complet au départ",
      "Glaçage régulier",
      "Étirement très progressif du mollet",
      "Renforcement excentrique du mollet",
      "Physiothérapie professionnelle",
    ],
    risques: [
      "Rupture complète du tendon (intervention chirurgicale)",
      "Chronicité sur plusieurs mois/années",
      "Réduction permanente de capacité physique",
    ],
    conseils: [
      "Peut devenir chronique : consultez tôt",
      "Repos et reprise très progressive (6-12 semaines)",
      "Renforcement excentrique obligatoire",
      "Évitez les pentes en début de récupération",
    ],
  },
  "Elongation des ischio-jambiers": {
    name: "Élongation des ischio-jambiers",
    symptomesRessentis: [
      "Douleur soudaine à l'arrière de la cuisse",
      "Sensation de « claquement » ou de déchirement",
      "Douleur qui s'aggrave en flexion (pencher en avant)",
      "Difficulté à courir ou sprinter après",
      "Possible bleu sur l'arrière de la cuisse",
    ],
    causesProbables: [
      "Manque d'étirement avant/après course",
      "Déséquilibre entre quadriceps et ischios",
      "Manque d'échauffement",
      "Accélération ou sprint trop rapide",
    ],
    meilleurMoyenSoulager: [
      "Repos initial et glaçage",
      "Étirement doux et progressif",
      "Renforcement excentrique",
      "Massages réguliers",
      "Retour progressif à l'effort",
    ],
    risques: [
      "Rechute fréquente si rééducation incomplète",
      "Douleur chronique",
      "Limitation de performance durable",
    ],
    conseils: [
      "Étirez après chaque séance (1-2 min)",
      "Échauffement 10 min obligatoire",
      "Rentrée progressive : 2-3 semaines minimum",
      "Renforcement : curls nordiques 2x/semaine",
    ],
  },
  "Tendinopathie proximale": {
    name: "Tendinopathie proximale des ischios-jambiers",
    symptomesRessentis: [
      "Douleur en bas des fessiers, à la base",
      "Douleur qui s'aggrave en position assise prolongée",
      "Sensation de douleur sourde et persistante",
      "Aggravation en levant la jambe",
      "Peut irradier vers le bas de la cuisse",
    ],
    causesProbables: [
      "Syndrome assis-actif (bureau longtemps)",
      "Manque d'étirement et renforcement",
      "Technique de course avec cadence trop basse",
      "Augmentation progressive trop rapide",
    ],
    meilleurMoyenSoulager: [
      "Repos partiel et réduction volume",
      "Renforcement excentrique prioritaire",
      "Physiothérapie progressive",
      "Levez-vous régulièrement si assis longtemps",
      "Étirement régulier et doux",
    ],
    risques: [
      "Chronicité sur plusieurs mois/années",
      "Limitation persistante de performance",
      "Compensation et douleur au genou/hanche",
    ],
    conseils: [
      "Renforcement excentrique prioritaire",
      "Augmentez cadence (plus court, plus rapide)",
      "Pauses régulières si travail assis",
      "Reprise progressive sans forcer",
    ],
  },
  "Cervicalgie": {
    name: "Cervicalgie (douleur au cou)",
    symptomesRessentis: [
      "Douleur au cou, surtout à l'arrière",
      "Raideur du cou le matin",
      "Douleur qui s'aggrave en tournant la tête",
      "Tension dans les épaules et le haut du dos",
      "Possible mal de tête associé",
    ],
    causesProbables: [
      "Posture incorrecte pendant la course (tête en avant)",
      "Tension musculaire accumulée",
      "Bureau longtemps en position assise",
      "Stress et crispation",
      "Technique de course non optimale",
    ],
    meilleurMoyenSoulager: [
      "Étirements doux du cou (rotation, flexion latérale)",
      "Massages des trapèzes et du cou",
      "Renforcement des stabilisateurs du cou",
      "Glaçage si inflammation",
      "Correction de la posture en course",
    ],
    risques: [
      "Douleur chronique du cou",
      "Limitation de la mobilité",
      "Irradiation vers les bras",
    ],
    conseils: [
      "Étirement quotidien du cou : 3-4 fois par jour",
      "Vérifiez votre posture en course (tête neutre, épaules détendues)",
      "Massage régulier des épaules",
      "Yoga ou pilates pour la mobilité",
    ],
  },
  "Lombalgie": {
    name: "Lombalgie (douleur au bas du dos)",
    symptomesRessentis: [
      "Douleur en bas du dos, surtout au centre",
      "Douleur qui s'aggrave après la course",
      "Raideur en se levant le matin",
      "Douleur en se penchant en avant",
      "Possible irradiation vers les jambes",
    ],
    causesProbables: [
      "Manque de gainage et de stabilité du core",
      "Posture de course incorrecte",
      "Déséquilibre musculaire (fessiers faibles)",
      "Augmentation trop rapide du volume",
      "Flexibilité insuffisante du dos",
    ],
    meilleurMoyenSoulager: [
      "Renforcement du core (gainage, abdominaux)",
      "Étirements doux du dos et des ischio-jambiers",
      "Glaçage en cas d'inflammation",
      "Massage du bas du dos",
      "Repos relatif et réduction du kilométrage",
    ],
    risques: [
      "Douleur chronique du dos",
      "Limitation de la mobilité",
      "Impact sur d'autres zones (genou, hanche)",
    ],
    conseils: [
      "Gainage quotidien : 3-4 x 1 min",
      "Étirements : spécial ischio-jambiers et dos",
      "Vérifiez votre posture (dos droit, core actif)",
      "Augmentation kilométrique progressive (10%/semaine)",
    ],
  },
  "Dorsalgie": {
    name: "Dorsalgie (douleur au milieu du dos)",
    symptomesRessentis: [
      "Douleur entre les omoplates",
      "Sensation de rigidité du haut du dos",
      "Douleur qui s'aggrave en course",
      "Possible tension dans les épaules",
      "Douleur lors de mouvements de rotation",
    ],
    causesProbables: [
      "Posture avachie (arrondi du dos)",
      "Technique de course incorrecte",
      "Faiblesse des muscles du dos",
      "Tension accumulée au travail",
      "Manque de mobilité thoracique",
    ],
    meilleurMoyenSoulager: [
      "Étirements du dos et des épaules",
      "Renforcement des muscles du dos",
      "Correction de la posture en course",
      "Yoga ou pilates pour la mobilité",
      "Massage des omoplates",
    ],
    risques: [
      "Douleur chronique persistante",
      "Limitation de la performance",
      "Compensation et douleurs secondaires",
    ],
    conseils: [
      "Posture droite en course : épaules basses, dos droit",
      "Renforcement du dos 3-4x/semaine",
      "Étirements quotidiens (5-10 min)",
      "Yoga ou pilates 1-2x/semaine",
    ],
  },
};

type SymptomZone = {
  description: string;
  id: string;
  issues: string[];
  title: string;
};

const symptomZones: SymptomZone[] = [
  {
    id: "upper-body",
    title: "Cou et dos",
    description: "Raideurs, douleurs posturales et tensions du haut au bas du dos.",
    issues: ["Cervicalgie", "Dorsalgie", "Lombalgie"],
  },
  {
    id: "hip-pelvis",
    title: "Hanche et bassin",
    description: "Douleurs de hanche, de l'aine ou instabilités liées à la foulée.",
    issues: ["Elongation du flechisseur de hanche", "Bursite"],
  },
  {
    id: "thigh",
    title: "Cuisse et ischio-jambiers",
    description: "Tensions à l'arrière de cuisse, douleurs à la base de la fesse ou gênes musculaires.",
    issues: ["Elongation des ischio-jambiers", "Tendinopathie proximale"],
  },
  {
    id: "knee",
    title: "Genou",
    description: "Douleurs autour de la rotule, côté externe du genou ou gêne articulaire.",
    issues: ["Syndrome rotulien", "Syndrome de l'essuie-glace", "Menisque"],
  },
  {
    id: "lower-leg",
    title: "Tibia et mollet",
    description: "Douleurs osseuses, musculaires ou tendineuses de la jambe inférieure.",
    issues: ["Periostite tibiale", "Fracture de fatigue", "Elongation du mollet", "Tendinite d'Achille"],
  },
  {
    id: "ankle-foot",
    title: "Cheville et pied",
    description: "Instabilité, douleurs tendineuses ou plantaires du pied et de la cheville.",
    issues: ["Entorse de cheville", "Tendinite des peroniers", "Fasciite plantaire", "Fracture de fatigue metatarsienne"],
  },
];

const Health = () => {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const issueDetails = selectedIssue ? issuesData[selectedIssue] : null;
  const cleanMedicalText = (text: string) => text.replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s+/g, " ").trim();
  const punctuateMedicalText = (text: string) => {
    const cleaned = cleanMedicalText(text);
    if (!cleaned) return "";

    const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return /[.!?…]$/.test(normalized) ? normalized : `${normalized}.`;
  };
  const toSentence = (items: string[], maxItems = 2) =>
    items
      .slice(0, maxItems)
      .map(punctuateMedicalText)
      .filter(Boolean)
      .join(" ");

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredZones = useMemo(() => {
    if (!normalizedSearch) return symptomZones;

    return symptomZones
      .map((zone) => ({
        ...zone,
        issues: zone.issues.filter((issue) => {
          const details = issuesData[issue];
          const haystack = [
            issue,
            zone.title,
            zone.description,
            ...(details?.symptomesRessentis ?? []),
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedSearch);
        }),
      }))
      .filter((zone) => zone.issues.length > 0);
  }, [normalizedSearch]);

  const visibleIssuesCount = filteredZones.reduce((count, zone) => count + zone.issues.length, 0);

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Santé et blessures</h1>
        <p className="text-sm text-muted-foreground">Suivez votre récupération et gérez les blessures</p>
      </ScrollReveal>

      {/* Medical disclaimer */}
      <ScrollReveal>
        <CollapsibleDisclaimer
          variant="warning"
          summary="Ces informations ne remplacent pas un avis médical professionnel."
          fullText="Nous ne remplacerons jamais un bon rendez-vous chez le médecin. Les informations ici sont à titre informatif. La consultation reste la meilleure option en cas de doute ou douleur persistante. Si la douleur s'aggrave, consultez immédiatement un professionnel de santé."
        />
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-2 text-sm font-semibold">Explorer les symptômes</h2>
              <p className="text-xs text-muted-foreground">
                Parcourez les douleurs possibles par zone du corps ou recherchez directement un symptôme.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{symptomZones.length} zones</Badge>
              <Badge variant="secondary">{visibleIssuesCount} problèmes visibles</Badge>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-accent/20 bg-gradient-to-r from-card via-card to-accent/5 p-4 shadow-[0_18px_40px_hsl(var(--accent)/0.08)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ex. douleur au genou, fasciite, ischio, cheville..."
                className="pl-9"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Astuce : tapez une zone, un symptôme ou le nom d&apos;une blessure pour filtrer rapidement la liste.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col">
              <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
                <CardContent className="p-4">
                  {filteredZones.length > 0 ? (
                    <Accordion type="multiple" className="space-y-2">
                      {filteredZones.map((zone) => (
                        <AccordionItem
                          key={zone.id}
                          value={zone.id}
                          className="rounded-xl border border-border bg-muted/10 px-4"
                        >
                          <AccordionTrigger className="py-4 text-left hover:no-underline">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{zone.title}</span>
                                <Badge variant="outline">{zone.issues.length}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{zone.description}</p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2">
                            {zone.issues.map((issue) => {
                              const details = issuesData[issue];
                              const isActive = selectedIssue === issue;

                              return (
                                <button
                                  key={issue}
                                  type="button"
                                  onClick={() => setSelectedIssue(issue)}
                                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                    isActive
                                      ? "border-accent bg-accent/10"
                                      : "border-border bg-card hover:bg-muted/30"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium">{issue}</p>
                                    <span className="text-xs font-medium text-muted-foreground">Voir le détail</span>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {toSentence(details?.symptomesRessentis ?? [], 1)}
                                  </p>
                                </button>
                              );
                            })}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-accent/30 bg-accent/5 py-8 text-center text-muted-foreground">
                      <p className="text-sm font-medium">Aucun résultat pour cette recherche</p>
                      <p className="mt-1 text-xs">Essayez un autre mot-clé, par exemple genou, pied, cheville ou ischio.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col">
              {selectedIssue && issueDetails ? (
                <div className="space-y-3 max-h-[700px] overflow-y-auto">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b">
                    <h3 className="font-semibold text-sm">{issueDetails.name}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIssue(null)}>
                      Fermer
                    </Button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-foreground">Symptômes ressentis</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {toSentence(issueDetails.symptomesRessentis)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-foreground">Causes probables</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {toSentence(issueDetails.causesProbables)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-foreground">Soulager en priorité</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {toSentence(issueDetails.meilleurMoyenSoulager)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-foreground">Risques si vous continuez</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {toSentence(issueDetails.risques)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-foreground">Conseils pratiques</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {toSentence(issueDetails.conseils)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-accent/30 bg-accent/5 py-8 text-center text-muted-foreground">
                  <p className="text-sm font-medium">Choisissez un symptôme ou une blessure</p>
                  <p className="mt-1 text-xs">
                    Explorez les zones à gauche puis touchez un problème pour afficher sa fiche pratique ici.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default Health;
