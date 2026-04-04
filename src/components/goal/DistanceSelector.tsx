import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DistanceSelectorProps = {
  label: string;
  options: readonly string[];
  selectedValue: string;
  customValue: string;
  showCustom: boolean;
  onSelectPreset: (value: string) => void;
  onToggleCustom: () => void;
  onCustomChange: (value: string) => void;
};

export function DistanceSelector({
  label,
  options,
  selectedValue,
  customValue,
  showCustom,
  onSelectPreset,
  onToggleCustom,
  onCustomChange,
}: DistanceSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelectPreset(option)}
            className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all ${
              selectedValue === option && !showCustom
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:border-accent/50"
            }`}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={onToggleCustom}
        >
          Ou choisir une distance personnalisée
        </Button>
        {showCustom ? (
          <Input
            type="number"
            placeholder="ex: 30 km"
            value={customValue}
            onChange={(event) => onCustomChange(event.target.value)}
            className="border-border"
          />
        ) : null}
      </div>
    </div>
  );
}
