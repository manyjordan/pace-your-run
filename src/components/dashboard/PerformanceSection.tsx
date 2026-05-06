import { ScrollReveal } from "@/components/ScrollReveal";
import type { RunRow } from "@/lib/database";
import { RacePredictionsCard } from "@/components/dashboard/RacePredictionsCard";
import { VO2maxCard } from "@/components/dashboard/VO2maxCard";

export const PerformanceSection = ({
  runs,
}: {
  runs: RunRow[];
  runsForStats: RunRow[];
}) => {
  void runsForStats;

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <VO2maxCard runs={runs} />
      </ScrollReveal>

      <ScrollReveal>
        <RacePredictionsCard runs={runs} />
      </ScrollReveal>
    </div>
  );
};
