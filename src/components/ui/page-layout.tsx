import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PageContainer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("space-y-6 px-4 pb-24", className)}>{children}</div>
);

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-3 pt-2">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const AppCard = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={cn(
      "rounded-xl border border-accent/20 bg-card/95 p-5 shadow-[0_8px_24px_hsl(var(--accent)/0.06)]",
      className,
    )}
  >
    {children}
  </div>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>
);
