import { Label } from "@/components/ui/label";
import { formatTimeFromParts } from "@/lib/goalHelpers";

type GoalTimePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function GoalTimePicker({ label, value, onChange }: GoalTimePickerProps) {
  const [hours = "00", minutes = "00", seconds = "00"] = value.split(":");

  const updatePart = (part: "hours" | "minutes" | "seconds", nextValue: string) => {
    const next = {
      hours,
      minutes,
      seconds,
      [part]: nextValue,
    };

    onChange(formatTimeFromParts(next.hours, next.minutes, next.seconds));
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-3">
        <select
          value={hours}
          onChange={(event) => updatePart("hours", event.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
        >
          {Array.from({ length: 6 }, (_, index) => String(index).padStart(2, "0")).map((hour) => (
            <option key={hour} value={hour}>
              {hour} h
            </option>
          ))}
        </select>
        <select
          value={minutes}
          onChange={(event) => updatePart("minutes", event.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
        >
          {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map((minute) => (
            <option key={minute} value={minute}>
              {minute} min
            </option>
          ))}
        </select>
        <select
          value={seconds}
          onChange={(event) => updatePart("seconds", event.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
        >
          {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map((second) => (
            <option key={second} value={second}>
              {second} s
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
