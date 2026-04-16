import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { RunPreferences } from "@/lib/runPreferences";

type Props = {
  runPreferences: RunPreferences;
  setRunPreferences: Dispatch<SetStateAction<RunPreferences>>;
};

export function RunCourseSettingsDialog({ runPreferences, setRunPreferences }: Props) {
  return (
    <ScrollReveal>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-between border-accent/30 bg-card/95 px-4 py-6">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Réglages de la course
            </span>
            <span className="text-xs text-muted-foreground">Ouvrir</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réglages de la course</DialogTitle>
            <DialogDescription>
              Choisissez vos unités et les annonces vocales avant de démarrer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Unité de distance</Label>
              <Select
                value={runPreferences.distanceUnit}
                onValueChange={(value) =>
                  setRunPreferences((current) => ({ ...current, distanceUnit: value as "km" | "mi" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une unité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilomètres</SelectItem>
                  <SelectItem value="mi">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Annonce vocale de vitesse</p>
                <p className="text-xs text-muted-foreground">
                  Si activée, vous entendrez{" "}
                  {runPreferences.distanceUnit === "mi"
                    ? "\"mile X, vitesse X mph\" à chaque mile."
                    : "\"km X, vitesse X km/h\" à chaque kilomètre."}
                </p>
              </div>
              <Switch
                checked={runPreferences.announceSplitSpeed}
                onCheckedChange={(checked) =>
                  setRunPreferences((current) => ({ ...current, announceSplitSpeed: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Annonce du temps cumulé</Label>
              <Select
                value={runPreferences.cumulativeTimeAnnouncement}
                onValueChange={(value) =>
                  setRunPreferences((current) => ({
                    ...current,
                    cumulativeTimeAnnouncement: value as RunPreferences["cumulativeTimeAnnouncement"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Aucune annonce</SelectItem>
                  <SelectItem value="1">Chaque {runPreferences.distanceUnit === "mi" ? "mile" : "km"}</SelectItem>
                  <SelectItem value="5">Tous les 5 {runPreferences.distanceUnit === "mi" ? "miles" : "km"}</SelectItem>
                  <SelectItem value="10">Tous les 10 {runPreferences.distanceUnit === "mi" ? "miles" : "km"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollReveal>
  );
}
