import { ScrollReveal } from "@/components/ScrollReveal";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      "⚠️ Vous devez faire une IRM pour confirmer le diagnostic",
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
      "⚠️ IRM ou radio indispensable pour confirmer",
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
      "⚠️ Radio ou IRM nécessaire pour confirmer",
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
      "⚠️ Peut devenir chronique : consultez tôt",
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
};

const bodyParts = [
  { id: "knee", label: "Genou", x: 48, y: 62, issues: ["Syndrome rotulien", "Syndrome de l'essuie-glace", "Menisque"] },
  { id: "shin", label: "Tibia", x: 45, y: 72, issues: ["Periostite tibiale", "Fracture de fatigue"] },
  { id: "ankle", label: "Cheville", x: 42, y: 82, issues: ["Entorse de cheville", "Tendinite des peroniers"] },
  { id: "foot", label: "Pied", x: 42, y: 90, issues: ["Fasciite plantaire", "Fracture de fatigue metatarsienne"] },
  { id: "hip", label: "Hanche", x: 42, y: 48, issues: ["Elongation du flechisseur de hanche", "Bursite"] },
  { id: "calf", label: "Mollet", x: 55, y: 72, issues: ["Elongation du mollet", "Tendinite d'Achille"] },
  { id: "hamstring", label: "Ischio-jambiers", x: 55, y: 55, issues: ["Elongation des ischio-jambiers", "Tendinopathie proximale"] },
];

const Health = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const selectedPart = bodyParts.find((p) => p.id === selected);
  const issueDetails = selectedIssue ? issuesData[selectedIssue] : null;

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Santé et blessures</h1>
        <p className="text-sm text-muted-foreground">Suivez votre récupération et gérez les blessures</p>
      </ScrollReveal>

      {/* Medical disclaimer */}
      <ScrollReveal>
        <div className="rounded-xl border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 dark:text-amber-100">
            <p className="font-semibold mb-1">⚠️ Avertissement important</p>
            <p>Nous ne remplacerons jamais un bon rendez-vous chez le médecin. Les informations ici sont à titre informatif. <strong>La consultation reste la meilleure option en cas de doute ou douleur persistante.</strong> Si la douleur s'aggrave, consultez immédiatement un professionnel de santé.</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Body map */}
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold">Vérification des symptômes</h2>
          <p className="mb-4 text-xs text-muted-foreground">Cliquez sur une zone du corps pour explorer les problèmes fréquents et leur traitement</p>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Body diagram - Enhanced styling */}
            <div className="relative mx-auto h-80 w-48 bg-gradient-to-b from-muted/30 to-muted/50 rounded-lg p-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-full w-full">
                  {/* Head */}
                  <div className="absolute left-1/2 top-[4%] h-8 w-8 -translate-x-1/2 rounded-full border-2 border-muted-foreground/50 bg-muted/50" />
                  {/* Torso */}
                  <div className="absolute left-1/2 top-[16%] h-24 w-16 -translate-x-1/2 rounded-lg border-2 border-muted-foreground/50 bg-muted/30" />
                  {/* Legs */}
                  <div className="absolute left-[32%] top-[48%] h-40 w-6 rounded-lg border-2 border-muted-foreground/50 bg-muted/30" />
                  <div className="absolute right-[32%] top-[48%] h-40 w-6 rounded-lg border-2 border-muted-foreground/50 bg-muted/30" />

                  {/* Tap points */}
                  {bodyParts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => {
                        setSelected(selected === part.id ? null : part.id);
                        setSelectedIssue(null);
                      }}
                      className={`absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all cursor-pointer ${
                        selected === part.id
                          ? "border-accent bg-accent/40 scale-125 shadow-lg shadow-accent/50"
                          : "border-muted-foreground/40 bg-muted-foreground/20 hover:bg-accent/30 hover:border-accent hover:scale-110"
                      }`}
                      style={{ left: `${part.x}%`, top: `${part.y}%` }}
                      title={part.label}
                    >
                      <span className="sr-only">{part.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Details panel - Enhanced styling */}
            <div className="flex flex-col">
              {selectedPart && !selectedIssue ? (
                <div className="animate-count-up space-y-2">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <div className="h-3 w-3 rounded-full bg-accent" />
                    <h3 className="text-sm font-bold">Problèmes courants : {selectedPart.label}</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedPart.issues.map((issue) => (
                      <button
                        key={issue}
                        onClick={() => setSelectedIssue(issue)}
                        className="w-full rounded-lg border border-border p-3 text-sm transition-all hover:bg-accent/10 hover:border-accent hover:shadow-md text-left"
                      >
                        <p className="font-medium">{issue}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cliquez pour découvrir la structure et le traitement
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : selectedIssue && issueDetails ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b">
                    <h3 className="font-semibold text-sm">{issueDetails.name}</h3>
                    <button
                      onClick={() => setSelectedIssue(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-lg p-3">
                      <p className="font-semibold text-xs text-blue-700 dark:text-blue-300 mb-2">❓ Symptômes que vous pourriez ressentir</p>
                      <ul className="text-xs text-blue-600 dark:text-blue-200 space-y-1">
                        {issueDetails.symptomesRessentis.map((symptom) => (
                          <li key={symptom} className="ml-3">• {symptom}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-orange-50/50 dark:bg-orange-950/30 rounded-lg p-3">
                      <p className="font-semibold text-xs text-orange-700 dark:text-orange-300 mb-2">🔍 Causes probables</p>
                      <ul className="text-xs text-orange-600 dark:text-orange-200 space-y-1">
                        {issueDetails.causesProbables.map((cause) => (
                          <li key={cause} className="ml-3">• {cause}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50/50 dark:bg-green-950/30 rounded-lg p-3">
                      <p className="font-semibold text-xs text-green-700 dark:text-green-300 mb-2">💊 Traitement recommandé</p>
                      <ul className="text-xs text-green-600 dark:text-green-200 space-y-1">
                        {issueDetails.meilleurMoyenSoulager.map((moyen) => (
                          <li key={moyen} className="ml-3">• {moyen}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50/50 dark:bg-red-950/30 rounded-lg p-3">
                      <p className="font-semibold text-xs text-red-700 dark:text-red-300 mb-2">⚠️ Risques si vous continuez</p>
                      <ul className="text-xs text-red-600 dark:text-red-200 space-y-1">
                        {issueDetails.risques.map((risque) => (
                          <li key={risque} className="ml-3">• {risque}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-purple-50/50 dark:bg-purple-950/30 rounded-lg p-3">
                      <p className="font-semibold text-xs text-purple-700 dark:text-purple-300 mb-2">✅ Conseils pratiques</p>
                      <ul className="text-xs text-purple-600 dark:text-purple-200 space-y-1">
                        {issueDetails.conseils.map((conseil) => (
                          <li key={conseil} className="ml-3">• {conseil}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
                  <p className="text-sm">👈 Sélectionnez une zone du corps</p>
                  <p className="text-xs mt-1">pour explorer les blessures fréquentes</p>
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
