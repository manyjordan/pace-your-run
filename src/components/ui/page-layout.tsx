import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PageContainer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("space-y-3 px-4 pb-32", className)}>{children}</div>
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
      <h1 className="text-pace-xl font-bold text-foreground">{title}</h1>
      {subtitle ? <p className="mt-0.5 text-pace-base font-normal text-muted-foreground">{subtitle}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const AppCard = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={cn(
      "rounded-2xl border border-border bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
      className,
    )}
  >
    {children}
  </div>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{children}</p>
);
