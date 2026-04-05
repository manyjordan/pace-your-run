import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonMetricCard() {
  return (
    <div className="rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}
