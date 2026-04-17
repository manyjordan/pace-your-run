import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonHeroBanner() {
  return (
    <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/20 via-background to-background px-5 py-5 shadow-[0_12px_30px_hsl(var(--foreground)/0.06)]">
      <Skeleton className="h-8 w-48 max-w-[70%] bg-muted" />
      <Skeleton className="mt-3 h-4 w-full max-w-md bg-muted/80" />
    </div>
  );
}
