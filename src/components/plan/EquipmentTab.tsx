import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star, AlertTriangle, Footprints, Utensils, Droplets,
  ShoppingCart, ExternalLink,
} from "lucide-react";

const shoes = [
  { name: "Nike Vaporfly 3", category: "Compétition route", rating: 4.8, price: "259 €", mileage: 342, maxMileage: 600, status: "active" as const, tags: ["Carbone", "Légère", "Route"], recommendation: "Idéale pour vos courses et tempos rapides." },
  { name: "ASICS Gel Nimbus 26", category: "Entraînement quotidien", rating: 4.5, price: "189 €", mileage: 687, maxMileage: 800, status: "warning" as const, tags: ["Amorti", "Confort", "Route"], recommendation: "Bientôt en fin de vie (687/800 km). Pensez à la remplacer." },
  { name: "Salomon Speedcross 6", category: "Trail", rating: 4.6, price: "139 €", mileage: 0, maxMileage: 700, status: "recommended" as const, tags: ["Trail", "Accroche", "Boue"], recommendation: "Recommandée pour vos sorties trail mensuelles." },
];

const nutrition = [
  { name: "Maurten Gel 100", category: "Gel énergie", rating: 4.7, price: "3.50 € /unité", icon: Droplets, description: "Gel hydrogel, tolérance digestive supérieure.", tags: ["Hydrogel", "25g glucides"], partner: true },
  { name: "SIS GO Isotonic", category: "Boisson isotonique", rating: 4.3, price: "1.80 € /sachet", icon: Droplets, description: "Facile à digérer pour intervalles et tempos.", tags: ["Isotonique", "22g glucides"], partner: true },
  { name: "Näak Ultra Energy Bars", category: "Barre énergie", rating: 4.2, price: "2.90 € /barre", icon: Utensils, description: "Protéines de grillon, idéale pour l'ultra.", tags: ["Protéines", "Endurance"], partner: false },
];

const gear = [
  { name: "Leki Micro Trail Pro", category: "Bâtons de trail", rating: 4.7, price: "129 €", description: "Ultra-légers (196g), pliables.", tags: ["Carbone", "Pliable"] },
  { name: "Salomon ADV Skin 12", category: "Sac à dos trail", rating: 4.8, price: "155 €", description: "12L avec flasques avant.", tags: ["12L", "Flasques"] },
  { name: "Garmin Forerunner 265", category: "Montre GPS", rating: 4.6, price: "399 €", description: "AMOLED, HRV, puissance.", tags: ["AMOLED", "HRV"] },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}</span>
    </div>
  );
}

export default function EquipmentTab() {
  return (
    <Tabs defaultValue="shoes" className="space-y-4">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="shoes"><Footprints className="h-4 w-4 mr-1" /> Chaussures</TabsTrigger>
        <TabsTrigger value="nutrition"><Utensils className="h-4 w-4 mr-1" /> Nutrition</TabsTrigger>
        <TabsTrigger value="gear">Accessoires</TabsTrigger>
      </TabsList>

      <TabsContent value="shoes" className="space-y-3">
        {shoes.map((shoe, i) => {
          const mileagePct = Math.round((shoe.mileage / shoe.maxMileage) * 100);
          return (
            <ScrollReveal key={shoe.name} delay={i * 0.06}>
              <Card className={shoe.status === "warning" ? "border-destructive/40" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{shoe.name}</h3>
                        {shoe.status === "warning" && <Badge variant="destructive" className="text-[10px] px-1.5 py-0"><AlertTriangle className="h-3 w-3 mr-0.5" /> Usure</Badge>}
                        {shoe.status === "recommended" && <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground">Recommandé</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{shoe.category}</div>
                      <StarRating rating={shoe.rating} />
                    </div>
                    <span className="text-sm font-bold whitespace-nowrap">{shoe.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{shoe.recommendation}</p>
                  {shoe.mileage > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Kilométrage</span>
                        <span className={mileagePct > 80 ? "text-destructive font-medium" : ""}>{shoe.mileage} / {shoe.maxMileage} km</span>
                      </div>
                      <Progress value={mileagePct} className="h-1.5" />
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1 flex-wrap">
                      {shoe.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                    </div>
                    {(shoe.status === "recommended" || shoe.status === "warning") && (
                      <Button size="sm" variant="outline" className="text-xs"><ShoppingCart className="h-3 w-3 mr-1" /> Acheter</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          );
        })}
      </TabsContent>

      <TabsContent value="nutrition" className="space-y-3">
        {nutrition.map((item, i) => (
          <ScrollReveal key={item.name} delay={i * 0.06}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      {item.partner && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Partenaire</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                    <StarRating rating={item.rating} />
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">{item.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs"><ExternalLink className="h-3 w-3 mr-1" /> Voir</Button>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </TabsContent>

      <TabsContent value="gear" className="space-y-3">
        {gear.map((item, i) => (
          <ScrollReveal key={item.name} delay={i * 0.06}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                    <StarRating rating={item.rating} />
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">{item.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs"><ShoppingCart className="h-3 w-3 mr-1" /> Acheter</Button>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </TabsContent>
    </Tabs>
  );
}
