import { useEffect, useMemo, useRef, useState } from "react";

export type SessionSegment = {
  id: string;
  duration_minutes: number;
  target_pace: string;
  label?: string;
};

export type SessionTemplate = {
  id: string;
  name: string;
  description: string;
  segments: Array<Omit<SessionSegment, "id">>;
};

function newSegmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `seg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function makeSegment(partial?: Partial<SessionSegment>): SessionSegment {
  return {
    id: newSegmentId(),
    duration_minutes: partial?.duration_minutes ?? 5,
    target_pace: partial?.target_pace ?? "6:00",
    label: partial?.label ?? "",
  };
}

const fartlekBase: Array<Omit<SessionSegment, "id">> = [
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

type RunStatus = "idle" | "running" | "paused";

export function useSessionProgram({ elapsed, status }: { elapsed: number; status: RunStatus }) {
  const [runMode, setRunMode] = useState<"free" | "programmed">("free");
  const [programSource, setProgramSource] = useState<"custom" | "template">("custom");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [segments, setSegments] = useState<SessionSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const thirtySecondAnnouncedRef = useRef<Set<number>>(new Set());
  const segmentTransitionAnnouncedRef = useRef<Set<number>>(new Set());

  const isProgrammedMode = runMode === "programmed";
  const isProgramActive = isProgrammedMode && segments.length > 0;

  const segmentDurationsSeconds = useMemo(
    () => segments.map((segment) => Math.max(1, Math.round(segment.duration_minutes * 60))),
    [segments],
  );

  const totalProgramDurationSeconds = useMemo(
    () => segmentDurationsSeconds.reduce((sum, sec) => sum + sec, 0),
    [segmentDurationsSeconds],
  );

  const currentSegment = segments[currentSegmentIndex] ?? null;
  const nextSegment = segments[currentSegmentIndex + 1] ?? null;

  const elapsedUntilCurrentSegmentStart = useMemo(() => {
    if (!segmentDurationsSeconds.length || currentSegmentIndex <= 0) return 0;
    return segmentDurationsSeconds.slice(0, currentSegmentIndex).reduce((sum, sec) => sum + sec, 0);
  }, [currentSegmentIndex, segmentDurationsSeconds]);

  const elapsedInCurrentSegment = Math.max(0, elapsed - elapsedUntilCurrentSegmentStart);
  const currentSegmentDurationSeconds = segmentDurationsSeconds[currentSegmentIndex] ?? 0;
  const secondsRemainingInCurrentSegment = Math.max(0, currentSegmentDurationSeconds - elapsedInCurrentSegment);

  useEffect(() => {
    if (!isProgramActive || status === "idle") {
      setCurrentSegmentIndex(0);
      return;
    }

    let cumulative = 0;
    let index = 0;
    for (let i = 0; i < segmentDurationsSeconds.length; i++) {
      cumulative += segmentDurationsSeconds[i];
      if (elapsed < cumulative) {
        index = i;
        break;
      }
      index = i;
    }
    setCurrentSegmentIndex(Math.min(index, Math.max(0, segments.length - 1)));
  }, [elapsed, isProgramActive, segmentDurationsSeconds, segments.length, status]);

  const addSegment = () => {
    setSegments((prev) => [...prev, makeSegment()]);
  };

  const removeSegment = (id: string) => {
    setSegments((prev) => prev.filter((segment) => segment.id !== id));
  };

  const updateSegment = (id: string, patch: Partial<SessionSegment>) => {
    setSegments((prev) =>
      prev.map((segment) => (segment.id === id ? { ...segment, ...patch } : segment)),
    );
  };

  const loadTemplate = (templateId: string) => {
    const template = INTERVAL_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedTemplateId(template.id);
    setProgramSource("template");
    setSegments(template.segments.map((segment) => makeSegment(segment)));
  };

  const resetProgramProgress = () => {
    setCurrentSegmentIndex(0);
    thirtySecondAnnouncedRef.current.clear();
    segmentTransitionAnnouncedRef.current.clear();
  };

  return {
    runMode,
    setRunMode,
    programSource,
    setProgramSource,
    selectedTemplateId,
    loadTemplate,
    segments,
    addSegment,
    removeSegment,
    updateSegment,
    isProgrammedMode,
    isProgramActive,
    currentSegmentIndex,
    currentSegment,
    nextSegment,
    elapsedInCurrentSegment,
    secondsRemainingInCurrentSegment,
    currentSegmentDurationSeconds,
    totalProgramDurationSeconds,
    resetProgramProgress,
    thirtySecondAnnouncedRef,
    segmentTransitionAnnouncedRef,
  };
}
