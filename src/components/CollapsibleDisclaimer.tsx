import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    box: "rounded-xl border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/50",
    icon: "text-amber-600 dark:text-amber-400",
    body: "text-amber-900 dark:text-amber-100",
    toggle: "text-amber-800 dark:text-amber-200",
  },
  info: {
    box: "rounded-xl border border-accent/50 bg-accent/10 dark:border-accent/40 dark:bg-accent/15",
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
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="full-text"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-2 leading-relaxed">{fullText}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
