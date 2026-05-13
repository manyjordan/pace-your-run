import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonMetricCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}
