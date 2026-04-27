export type SessionTemplate = {
  id: string;
  name: string;
  description: string;
  segments: Array<{
    duration_minutes: number;
    target_pace: string;
    label?: string;
  }>;
};

const fartlekBase: SessionTemplate["segments"] = [
  { duration_minutes: 0.5, target_pace: "3:30", label: "Rapide" },
  { duration_minutes: 0.5, target_pace: "6:00", label: "Récup" },
];

const fartlekRepeated = Array.from({ length: 10 }, (_, i) =>
  fartlekBase.map((segment) => ({
    ...segment,
    label: `${segment.label} ${i + 1}`,
  })),
).flat();

export const INTERVAL_TEMPLATES: SessionTemplate[] = [
  {
    id: "fartlek_30_30",
    name: "Fartlek 30/30",
    description: "30s rapide / 30s récup × 10",
    segments: fartlekRepeated,
  },
  {
    id: "intervals_1km",
    name: "Intervalles 1km",
    description: "1km rapide / 2min récup × 5",
    segments: [
      { duration_minutes: 4, target_pace: "4:00", label: "1km effort" },
      { duration_minutes: 2, target_pace: "6:30", label: "Récup" },
      { duration_minutes: 4, target_pace: "4:00", label: "1km effort" },
      { duration_minutes: 2, target_pace: "6:30", label: "Récup" },
      { duration_minutes: 4, target_pace: "4:00", label: "1km effort" },
      { duration_minutes: 2, target_pace: "6:30", label: "Récup" },
      { duration_minutes: 4, target_pace: "4:00", label: "1km effort" },
      { duration_minutes: 2, target_pace: "6:30", label: "Récup" },
      { duration_minutes: 4, target_pace: "4:00", label: "1km effort" },
      { duration_minutes: 2, target_pace: "6:30", label: "Récup" },
    ],
  },
  {
    id: "tempo_20min",
    name: "Tempo 20 min",
    description: "10min échauffement + 20min tempo + 10min retour au calme",
    segments: [
      { duration_minutes: 10, target_pace: "6:00", label: "Échauffement" },
      { duration_minutes: 20, target_pace: "4:30", label: "Tempo" },
      { duration_minutes: 10, target_pace: "6:00", label: "Retour au calme" },
    ],
  },
  {
    id: "pyramide",
    name: "Pyramide",
    description: "1min / 2min / 3min / 2min / 1min effort avec récup égale",
    segments: [
      { duration_minutes: 1, target_pace: "3:45", label: "1min effort" },
      { duration_minutes: 1, target_pace: "6:00", label: "Récup" },
      { duration_minutes: 2, target_pace: "3:45", label: "2min effort" },
      { duration_minutes: 2, target_pace: "6:00", label: "Récup" },
      { duration_minutes: 3, target_pace: "3:45", label: "3min effort" },
      { duration_minutes: 3, target_pace: "6:00", label: "Récup" },
      { duration_minutes: 2, target_pace: "3:45", label: "2min effort" },
      { duration_minutes: 2, target_pace: "6:00", label: "Récup" },
      { duration_minutes: 1, target_pace: "3:45", label: "1min effort" },
      { duration_minutes: 1, target_pace: "6:00", label: "Récup" },
    ],
  },
];
