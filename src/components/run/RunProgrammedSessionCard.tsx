import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { INTERVAL_TEMPLATES, type SessionSegment } from "@/hooks/useSessionProgram";
import { cn } from "@/lib/utils";

type ProgramSource = "custom" | "template";

type Props = {
  programSource: ProgramSource;
  setProgramSource: (v: ProgramSource) => void;
  selectedTemplateId: string;
  loadTemplate: (id: string) => void;
  segments: SessionSegment[];
  addSegment: () => void;
  removeSegment: (id: string) => void;
  updateSegment: (id: string, patch: Partial<SessionSegment>) => void;
};

export function RunProgrammedSessionCard({
  programSource,
  setProgramSource,
  selectedTemplateId,
  loadTemplate,
  segments,
  addSegment,
  removeSegment,
  updateSegment,
}: Props) {
  return (
    <Card className="border-accent/30 bg-card/95">
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setProgramSource("custom")}
            className={cn(
              "rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all",
              programSource === "custom"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:border-accent/50",
            )}
          >
            Session personnalisée
          </button>
          <button
            type="button"
            onClick={() => setProgramSource("template")}
            className={cn(
              "rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all",
              programSource === "template"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:border-accent/50",
            )}
          >
            Session type fractionné
          </button>
        </div>

        {programSource === "template" ? (
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={selectedTemplateId} onValueChange={loadTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une session type" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} — {template.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-3">
          {segments.map((segment, index) => (
            <div key={segment.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Segment {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeSegment(segment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Durée (min)</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={segment.duration_minutes}
                    onChange={(event) =>
                      updateSegment(segment.id, {
                        duration_minutes: Math.max(0.1, Number(event.target.value) || 0.1),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Allure cible</Label>
                  <Input
                    value={segment.target_pace}
                    onChange={(event) => updateSegment(segment.id, { target_pace: event.target.value })}
                    placeholder="4:30"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label (optionnel)</Label>
                <Input
                  value={segment.label ?? ""}
                  onChange={(event) => updateSegment(segment.id, { label: event.target.value })}
                  placeholder="Échauffement"
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={addSegment}>
            + Ajouter un segment
          </Button>
          {segments.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {segments.map((segment) => `${segment.duration_minutes} min à ${segment.target_pace}`).join(" → ")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Ajoutez au moins un segment pour démarrer la session programmée.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
