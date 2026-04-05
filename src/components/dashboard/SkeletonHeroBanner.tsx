import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonHeroBanner() {
  return (
    <div className="rounded-2xl border border-accent/70 bg-accent px-5 py-5 text-accent-foreground shadow-[0_18px_44px_hsl(var(--accent)/0.2)]">
      <Skeleton className="h-8 w-48 max-w-[70%] bg-accent-foreground/20" />
      <Skeleton className="mt-3 h-4 w-full max-w-md bg-accent-foreground/15" />
    </div>
  );
}
