import { Card, CardContent } from "@/components/ui/card";
import type { TreadmillRunControls } from "@/hooks/useTreadmill";

type Props = {
  treadmill: TreadmillRunControls;
};

export function RunTreadmillSpeedPanel({ treadmill }: Props) {
  return (
    <Card className="border-accent/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Vitesse tapis</p>
          <p className="text-xs text-muted-foreground">{treadmill.treadmillPaceLabelPerKm} /km</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => treadmill.setTreadmillSpeedKmh((s) => Math.max(3, Number((s - 0.5).toFixed(1))))}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg font-bold hover:border-accent hover:text-accent transition-colors"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-4xl font-black tabular-nums">{treadmill.treadmillSpeedKmh.toFixed(1)}</span>
            <span className="ml-1 text-sm text-muted-foreground">km/h</span>
          </div>
          <button
            type="button"
            onClick={() => treadmill.setTreadmillSpeedKmh((s) => Math.min(30, Number((s + 0.5).toFixed(1))))}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg font-bold hover:border-accent hover:text-accent transition-colors"
          >
            +
          </button>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Distance calculée automatiquement depuis la vitesse
        </p>
      </CardContent>
    </Card>
  );
}
