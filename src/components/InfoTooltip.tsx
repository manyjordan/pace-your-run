import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  title?: string;
}

export function InfoTooltip({ content, title }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl bg-foreground p-3 text-background shadow-xl">
          {title && <p className="mb-1 text-sm font-semibold">{title}</p>}
          <p className="text-xs leading-relaxed">{content}</p>
          <button type="button" onClick={() => setOpen(false)} className="absolute right-2 top-2">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
