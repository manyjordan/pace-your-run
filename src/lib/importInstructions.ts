import {
  Archive,
  ShieldCheck,
  FileArchive,
  Upload,
  Watch,
  FileText,
  Footprints,
  Smartphone,
  Apple,
  HeartPulse,
  MapPinned,
} from "lucide-react";

export type SourceInstruction = {
  title: string;
  description: string;
  icon: typeof Archive;
};

export type ImportSource = "strava" | "garmin" | "nike" | "apple" | "gpx";

export const sourceConfig: Record<
  ImportSource,
  {
    label: string;
    description: string;
    icon: typeof Archive;
    acceptedExtensions: string;
    expectedText: string;
    instructions: SourceInstruction[];
  }
> = {
  strava: {
    label: "Strava",
    description: "Depuis l'app Strava → Paramètres → Télécharger vos données",
    icon: Archive,
    acceptedExtensions: ".zip",
    expectedText: "Archive ZIP Strava contenant des fichiers .gpx ou .fit",
    instructions: [
      {
        title: "Ouvrez l'app Strava",
        description: "Sur votre téléphone, appuyez sur votre profil en bas à droite, puis allez dans Paramètres.",
        icon: ShieldCheck,
      },
      {
        title: "Trouvez « Télécharger vos données »",
        description: "Descendez jusqu'à trouver cette option. Appuyez dessus pour demander votre archive.",
        icon: FileArchive,
      },
      {
        title: "Recevez et importez le ZIP",
        description: "Strava vous envoie un email avec votre archive. Ouvrez-le et importez le fichier ZIP ici.",
        icon: Upload,
      },
    ],
  },
  garmin: {
    label: "Garmin",
    description: "Depuis l'app Garmin Connect → Menu → Exporter une activité",
    icon: Watch,
    acceptedExtensions: ".fit,.gpx,.zip",
    expectedText: "Fichier .fit, .gpx ou archive ZIP Garmin",
    instructions: [
      {
        title: "Ouvrez Garmin Connect sur votre téléphone",
        description: "Lancez l'app Garmin Connect et sélectionnez une activité de course que vous voulez exporter.",
        icon: Watch,
      },
      {
        title: "Tapez sur « Exporter »",
        description: "Cherchez le menu ou les trois points, puis sélectionnez Exporter en GPX ou en FIT.",
        icon: FileText,
      },
      {
        title: "Importez le fichier ici",
        description: "Le fichier est prêt. Déposez-le ou ouvrez-le avec ce navigateur pour l'importer.",
        icon: Upload,
      },
    ],
  },
  nike: {
    label: "Nike Run Club",
    description: "Depuis l'app Nike → Profil → Paramètres → Exporter les données",
    icon: Footprints,
    acceptedExtensions: ".gpx",
    expectedText: "Fichier GPX exporté depuis Nike Run Club",
    instructions: [
      {
        title: "Ouvrez Nike Run Club",
        description: "Dans l'app, allez sur votre Profil (icône en bas à droite), puis Paramètres.",
        icon: Smartphone,
      },
      {
        title: "Sélectionnez « Exporter vos données »",
        description: "Trouvez cette option et appuyez dessus. L'app prépare un fichier avec vos courses.",
        icon: FileText,
      },
      {
        title: "Importez le GPX",
        description: "Le fichier GPX est prêt. Vous pouvez directement l'importer ici depuis votre téléphone.",
        icon: Upload,
      },
    ],
  },
  apple: {
    label: "Apple Santé",
    description: "iPhone → Santé → Votre profil → Exporter les données",
    icon: Apple,
    acceptedExtensions: ".xml",
    expectedText: "Le fichier export.xml contenu dans l'export Apple Health",
    instructions: [
      {
        title: "Ouvrez l'app Santé sur votre iPhone",
        description: "Touchez votre photo de profil en haut à droite.",
        icon: HeartPulse,
      },
      {
        title: "Appuyez sur « Exporter toutes les données »",
        description: "Apple prépare un fichier ZIP avec toutes vos données de santé et de course.",
        icon: FileArchive,
      },
      {
        title: "Ouvrez le ZIP et importez export.xml",
        description: "Décompressez le fichier, trouvez export.xml et importez-le directement ici avec votre téléphone.",
        icon: Upload,
      },
    ],
  },
  gpx: {
    label: "Fichier GPX",
    description: "📁 Importez directement un fichier GPX depuis n'importe quelle app",
    icon: MapPinned,
    acceptedExtensions: ".gpx",
    expectedText: "Fichier .gpx standard exporté depuis une app de running",
    instructions: [
      {
        title: "Exportez une activité en GPX",
        description: "Depuis votre app ou montre, cherchez l'option « Exporter en GPX » ou « Télécharger ».",
        icon: MapPinned,
      },
      {
        title: "Gardez le fichier original",
        description: "Ne modifiez pas le fichier. Les points GPS et timestamps doivent rester intacts.",
        icon: FileText,
      },
      {
        title: "Importez-le ici directement",
        description: "Déposez le fichier .gpx ici ou ouvrez-le avec ce navigateur. Tout se fait sur votre téléphone !",
        icon: Upload,
      },
    ],
  },
};
