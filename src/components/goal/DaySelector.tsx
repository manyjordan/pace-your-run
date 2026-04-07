import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const FRENCH_DAY_ORDER = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

const SHORT_LABELS: Record<(typeof FRENCH_DAY_ORDER)[number], string> = {
  Lundi: "Lun",
  Mardi: "Mar",
  Mercredi: "Mer",
  Jeudi: "Jeu",
  Vendredi: "Ven",
  Samedi: "Sam",
  Dimanche: "Dim",
};

/** Default weekdays when migrating from legacy `daysPerWeek` only. */
export function defaultDaysForWeekCount(n: number): string[] {
  const c = Math.min(5, Math.max(2, Math.round(n)));
  return FRENCH_DAY_ORDER.slice(0, c) as string[];
}

export type DaySelectorProps = {
  selectedDays: string[];
  onChange: (days: string[]) => void;
  minDays?: number;
  maxDays?: number;
};

export function DaySelector({
  selectedDays,
  onChange,
  minDays = 2,
  maxDays = 5,
}: DaySelectorProps) {
  const toggle = (day: (typeof FRENCH_DAY_ORDER)[number]) => {
    const set = new Set(selectedDays);
    const isOn = set.has(day);

    if (isOn) {
      if (set.size <= minDays) {
        toast.error(`Minimum ${minDays} jours requis`);
        return;
      }
      set.delete(day);
      onChange([...set].sort((a, b) => FRENCH_DAY_ORDER.indexOf(a as typeof day) - FRENCH_DAY_ORDER.indexOf(b as typeof day)));
      return;
    }

    if (set.size >= maxDays) {
      toast.error(`Maximum ${maxDays} jours sélectionnés`);
      return;
    }

    set.add(day);
    onChange(
      [...set].sort((a, b) => FRENCH_DAY_ORDER.indexOf(a as typeof day) - FRENCH_DAY_ORDER.indexOf(b as typeof day)),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {FRENCH_DAY_ORDER.map((day) => {
          const selected = selectedDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={cn(
                "min-h-[40px] flex-1 rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-colors sm:min-w-0 sm:flex-1",
                selected
                  ? "border-accent bg-accent/15 text-accent-foreground shadow-[0_0_0_1px_hsl(var(--accent)/0.35)]"
                  : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:bg-accent/5",
              )}
            >
              {SHORT_LABELS[day]}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{selectedDays.length} jours sélectionnés</p>
    </div>
  );
}
