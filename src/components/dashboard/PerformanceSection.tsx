import { ScrollReveal } from "@/components/ScrollReveal";
import type { RunRow } from "@/lib/database";
import { RacePredictionsCard } from "@/components/dashboard/RacePredictionsCard";
import { VO2maxCard } from "@/components/dashboard/VO2maxCard";
import { FEATURES } from "@/lib/featureFlags";

export const PerformanceSection = ({
  runs,
}: {
  runs: RunRow[];
}) => {
  return (
    <div className="space-y-6">
      {FEATURES.VO2MAX && (
        <ScrollReveal>
          <VO2maxCard runs={runs} />
        </ScrollReveal>
      )}

      <ScrollReveal>
        <RacePredictionsCard runs={runs} />
      </ScrollReveal>
    </div>
  );
};
