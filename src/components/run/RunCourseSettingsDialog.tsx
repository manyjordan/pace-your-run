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
import { RunProgrammedSessionCard } from "@/components/run/RunProgrammedSessionCard";
import type { SessionSegment } from "@/hooks/useSessionProgram";
import { cn } from "@/lib/utils";
import { Gauge, MapPin, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";
import type { RunPreferences } from "@/lib/runPreferences";

type ProgramSource = "custom" | "template";

type ProgrammedProps = {
  programSource: ProgramSource;
  setProgramSource: (v: ProgramSource) => void;
  selectedTemplateId: string;
  loadTemplate: (id: string) => void;
  segments: SessionSegment[];
  addSegment: () => void;
  removeSegment: (id: string) => void;
  updateSegment: (id: string, patch: Partial<SessionSegment>) => void;
};

type Props = {
  runPreferences: RunPreferences;
  setRunPreferences: Dispatch<SetStateAction<RunPreferences>>;
  runMode: "free" | "programmed";
  setRunMode: (mode: "free" | "programmed") => void;
  isProgrammedMode: boolean;
  isTreadmill: boolean;
  setIsTreadmill: (value: boolean) => void;
  programmed: ProgrammedProps;
};

export function RunCourseSettingsDialog({
  runPreferences,
  setRunPreferences,
  runMode,
  setRunMode,
  isProgrammedMode,
  isTreadmill,
  setIsTreadmill,
  programmed,
}: Props) {
  return (
    <ScrollReveal>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-12 w-full justify-center gap-2 border-accent/30 bg-card/95 text-sm font-semibold">
            <Settings2 className="h-4 w-4" />
            Réglages
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[85vh] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4 text-left">
            <DialogTitle>Réglages de course</DialogTitle>
            <DialogDescription>
              Type de session, lieu et préférences avant de partir.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Type de session</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRunMode("free")}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                    runMode === "free"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/50",
                  )}
                >
                  Course libre
                </button>
                <button
                  type="button"
                  onClick={() => setRunMode("programmed")}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                    runMode === "programmed"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/50",
                  )}
                >
                  Session programmée
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Format</Label>
              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => setIsTreadmill(false)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all",
                    !isTreadmill
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/50",
                  )}
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  Extérieur
                </button>
                <button
                  type="button"
                  onClick={() => setIsTreadmill(true)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all",
                    isTreadmill
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/50",
                  )}
                >
                  <Gauge className="h-4 w-4 shrink-0" />
                  Tapis roulant
                </button>
              </div>
            </div>

            {isProgrammedMode ? (
              <RunProgrammedSessionCard
                programSource={programmed.programSource}
                setProgramSource={programmed.setProgramSource}
                selectedTemplateId={programmed.selectedTemplateId}
                loadTemplate={programmed.loadTemplate}
                segments={programmed.segments}
                addSegment={programmed.addSegment}
                removeSegment={programmed.removeSegment}
                updateSegment={programmed.updateSegment}
              />
            ) : null}

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

            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
              <Link to="/settings">Paramètres du compte</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollReveal>
  );
}
