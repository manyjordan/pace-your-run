import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type CollapsibleDisclaimerProps = {
  summary: string;
  fullText: string;
  variant?: "warning" | "info";
};

const variantClassNames: Record<NonNullable<CollapsibleDisclaimerProps["variant"]>, {
  box: string;
  icon: string;
  body: string;
  toggle: string;
}> = {
  warning: {
    box: "rounded-xl border border-amber-300/50 bg-amber-50/50",
    icon: "text-amber-600",
    body: "text-amber-900",
    toggle: "text-amber-800",
  },
  info: {
    box: "rounded-xl border border-accent/50 bg-accent/10",
    icon: "text-accent",
    body: "text-foreground",
    toggle: "text-accent",
  },
};

export function CollapsibleDisclaimer({ summary, fullText, variant = "warning" }: CollapsibleDisclaimerProps) {
  const [expanded, setExpanded] = useState(false);
  const v = variantClassNames[variant];

  return (
    <div className={cn("flex gap-3 p-4", v.box)}>
      <AlertCircle className={cn("mt-0.5 h-5 w-5 shrink-0", v.icon)} aria-hidden />
      <div className={cn("min-w-0 flex-1 text-sm", v.body)}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span>{summary}</span>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className={cn("cursor-pointer text-xs underline underline-offset-2", v.toggle)}
          >
            {expanded ? "Réduire ↑" : "En savoir plus →"}
          </button>
        </div>
        {expanded ? (
          <div className="overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="mt-2 leading-relaxed">{fullText}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
