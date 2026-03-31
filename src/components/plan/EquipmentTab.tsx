import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star, AlertTriangle, Footprints, Utensils,
  ShoppingCart, ExternalLink,
} from "lucide-react";

const shoes = [
  {
    name: "ASICS Gel Nimbus 26",
    category: "Entraînement quotidien",
    rating: 4.6,
    price: "189 €",
    mileage: 420,
    maxMileage: 800,
    status: "recommended" as const,
    usageLabel: "Pour s'entrainer",
    tags: ["Amorti", "Confort", "Route"],
    recommendation: "Chaussure recommandee pour les footings et les seances d'entrainement.",
  },
  {
    name: "Nike Vaporfly 3",
    category: "Competition route",
    rating: 4.8,
    price: "259 €",
    mileage: 120,
    maxMileage: 600,
    status: "recommended" as const,
    usageLabel: "Pour la competition ou le jour de course",
    tags: ["Carbone", "Legere", "Route"],
    recommendation: "Paire carbone recommandee pour la competition et les jours de course.",
  },
];

const nutritionSections = [
  {
    title: "Avant la course",
    description: "Produits utiles 2h a 30 min avant le depart.",
    products: [
      { name: "Aptonia Maltodextrine", category: "Boisson glucidique", rating: 4.4, price: "14.99 € /800g", description: "Maltodextrine a consommer avant la course pour augmenter les reserves en glucides.", tags: ["Maltodextrine", "Chargement glucidique"], partner: false },
      { name: "Maurten Drink Mix 160", category: "Boisson pre-course", rating: 4.7, price: "3.90 € /portion", description: "Apport en glucides facile a digerer avant la course.", tags: ["Carburant", "Glucides"], partner: true },
      { name: "Powerbar Energize", category: "Barre energie", rating: 4.3, price: "2.20 € /barre", description: "A prendre avant la course pour completer les reserves.", tags: ["Energie", "Pre-effort"], partner: false },
      { name: "Compote Andros Sport", category: "Puree de fruits", rating: 4.1, price: "1.60 € /unite", description: "Option legere si vous preferez solide + glucides rapides.", tags: ["Digestible", "Rapide"], partner: false },
    ],
  },
  {
    title: "Pendant la course",
    description: "Hydratation et energie pendant l'effort.",
    products: [
      { name: "Maurten Gel 100", category: "Gel energie", rating: 4.7, price: "3.50 € /unite", description: "Gel hydrogel, tres bonne tolerance digestive en course.", tags: ["Hydrogel", "25g glucides"], partner: true },
      { name: "SIS GO Isotonic", category: "Boisson isotonique", rating: 4.3, price: "1.80 € /sachet", description: "Boisson pratique pour maintenir l'apport en glucides.", tags: ["Isotonique", "Hydratation"], partner: true },
      { name: "SaltStick Caps", category: "Electrolytes", rating: 4.4, price: "0.60 € /capsule", description: "Aide a compenser les pertes en sodium sur efforts longs.", tags: ["Sodium", "Endurance"], partner: false },
    ],
  },
  {
    title: "Apres la course",
    description: "Recuperation musculaire et recharge glycogene.",
    products: [
      { name: "Etixx Recovery Shake", category: "Boisson recuperation", rating: 4.5, price: "2.90 € /portion", description: "Mix glucides + proteines pour relancer la recuperation.", tags: ["Recuperation", "Proteines"], partner: true },
      { name: "Yopro Drink", category: "Boisson proteinee", rating: 4.2, price: "2.10 € /bouteille", description: "Solution simple apres la course, riche en proteines.", tags: ["Proteines", "Pratique"], partner: false },
      { name: "Tart Cherry Juice", category: "Jus recuperation", rating: 4.1, price: "1.90 € /portion", description: "Peut aider a reduire les courbatures post-effort.", tags: ["Antioxydants", "Recup"], partner: false },
    ],
  },
];

const gear = [
  { name: "Salomon ADV Skin 12", category: "Sac d'hydratation", rating: 4.8, price: "155 €", description: "12L avec rangements accessibles et port stable pour longues sorties.", tags: ["Hydratation", "12L", "Trail"] },
  { name: "Leki Micro Trail Pro", category: "Bâtons de trail", rating: 4.7, price: "129 €", description: "Ultra-legers, pliables et efficaces sur gros denivele.", tags: ["Carbone", "Pliable", "Montagne"] },
  { name: "HydraPak Soft Flask 500ml", category: "Gourdes en plastique", rating: 4.5, price: "24 €", description: "Gourde souple plastique, facile a transporter dans un gilet.", tags: ["500ml", "Souple", "BPA Free"] },
  { name: "CamelBak Crux 2L", category: "Camel bag", rating: 4.6, price: "39 €", description: "Poche a eau 2L pour rester hydrate sur les sorties longues.", tags: ["2L", "Poche a eau", "Hydratation"] },
  { name: "Petzl Actik Core", category: "Lampe frontale", rating: 4.6, price: "69 €", description: "Indispensable pour courir tot le matin ou tard le soir.", tags: ["600 lm", "Rechargeable", "Securite"] },
  { name: "Compressport Pro Racing Socks", category: "Chaussettes techniques", rating: 4.4, price: "19 €", description: "Bonne respirabilite et maintien pour limiter les frottements.", tags: ["Confort", "Respirant", "Anti-ampoules"] },
  { name: "Garmin Forerunner 265", category: "Montre GPS", rating: 4.6, price: "399 €", description: "Suivi GPS, cardio, charge d'entrainement et navigation.", tags: ["GPS", "HRV", "Performance"] },
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
                        {"usageLabel" in shoe && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {shoe.usageLabel}
                          </Badge>
                        )}
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
        {nutritionSections.map((section, sectionIndex) => (
          <ScrollReveal key={section.title} delay={sectionIndex * 0.06}>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-bold">{section.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>

                <div className="space-y-3">
                  {section.products.map((item) => (
                    <div key={item.name} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">{item.name}</h4>
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
                    </div>
                  ))}
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
