import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Calendar, Footprints } from "lucide-react";
import GoalTab from "@/components/plan/GoalTab";
import TrainingTab from "@/components/plan/TrainingTab";
import EquipmentTab from "@/components/plan/EquipmentTab";

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
          <p className="text-sm text-muted-foreground">Objectif, entraînement et équipement</p>
        </div>
      </ScrollReveal>

      <Tabs defaultValue="goal" className="space-y-4">
        <ScrollReveal delay={0.05}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="goal"><Target className="h-4 w-4 mr-1" /> Objectif</TabsTrigger>
            <TabsTrigger value="training"><Calendar className="h-4 w-4 mr-1" /> Plan</TabsTrigger>
            <TabsTrigger value="equipment"><Footprints className="h-4 w-4 mr-1" /> Équip.</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="goal"><GoalTab /></TabsContent>
        <TabsContent value="training"><TrainingTab /></TabsContent>
        <TabsContent value="equipment"><EquipmentTab /></TabsContent>
      </Tabs>
    </div>
  );
}
