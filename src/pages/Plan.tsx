import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Calendar, Footprints } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import GoalTab from "@/components/plan/GoalTab";
import TrainingTab from "@/components/plan/TrainingTab";
import EquipmentTab from "@/components/plan/EquipmentTab";

export default function PlanPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const mainTab =
    tabParam === "goal" || tabParam === "training" || tabParam === "equipment" ? tabParam : "goal";

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
          <p className="text-sm text-muted-foreground">Objectif, entraînement et équipement</p>
        </div>
      </ScrollReveal>

      <Tabs key={mainTab} defaultValue={mainTab} className="space-y-4">
        <ScrollReveal>
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
