import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ExternalLink,
  Footprints,
  ShoppingCart,
  Star,
  Utensils,
} from "lucide-react";

const shoes: {
  name: string;
  category: string;
  rating: number;
  price: string;
  mileage: number;
  maxMileage: number;
  status: "recommended" | "warning" | "good";
  usageLabel?: string;
  tags: string[];
  recommendation: string;
}[] = [
  {
    name: "ASICS Gel Nimbus 26",
    category: "Entraînement quotidien",
    rating: 4.6,
    price: "189 €",
    mileage: 420,
    maxMileage: 800,
    status: "recommended",
    usageLabel: "Pour s'entraîner",
    tags: ["Amorti", "Confort", "Route"],
    recommendation: "Chaussure recommandée pour les footings et les séances d'entraînement.",
  },
  {
    name: "Nike Vaporfly 3",
    category: "Compétition route",
    rating: 4.8,
    price: "259 €",
    mileage: 120,
    maxMileage: 600,
    status: "recommended",
    usageLabel: "Pour la compétition ou le jour de course",
    tags: ["Carbone", "Légère", "Route"],
    recommendation: "Paire carbone recommandée pour la compétition et les jours de course.",
  },
  {
    name: "Hoka Clifton 9",
    category: "Entraînement",
    rating: 4.3,
    price: "140 €",
    mileage: 750,
    maxMileage: 800,
    status: "warning",
    usageLabel: "À remplacer bientôt",
    tags: ["Amorti", "Route"],
    recommendation: "Usure avancée, pensez à les remplacer.",
  },
];

const nutritionSections = [
  {
    title: "Avant la course",
    description: "Nutrition avant la course",
    products: [
      {
        name: "Aptonia Maltodextrine",
        category: "Boisson glucidique",
        rating: 4.4,
        price: "14.99 € /800g",
        description: "Maltodextrine à consommer avant la course pour augmenter les réserves en glucides.",
        tags: ["Maltodextrine", "Chargement glucidique"],
        partner: false,
      },
      {
        name: "Maurten Drink Mix 160",
        category: "Boisson pré-course",
        rating: 4.7,
        price: "3.90 € /portion",
        description: "Apport en glucides facile à digérer avant la course.",
        tags: ["Carburant", "Glucides"],
        partner: true,
      },
      {
        name: "Powerbar Energize",
        category: "Barre énergie",
        rating: 4.3,
        price: "2.20 € /barre",
        description: "À prendre avant la course pour compléter les réserves.",
        tags: ["Énergie", "Pré-effort"],
        partner: false,
      },
      {
        name: "Compote Andros Sport",
        category: "Purée de fruits",
        rating: 4.1,
        price: "1.60 € /unité",
        description: "Option légère si vous préférez du solide avec des glucides rapides.",
        tags: ["Digestible", "Rapide"],
        partner: false,
      },
    ],
  },
  {
    title: "Pendant la course",
    description: "Hydratation et énergie pendant l'effort.",
    products: [
      {
        name: "Maurten Gel 100",
        category: "Gel énergie",
        rating: 4.7,
        price: "3.50 € /unité",
        description: "Gel hydrogel avec une très bonne tolérance digestive en course.",
        tags: ["Hydrogel", "25g glucides"],
        partner: true,
      },
      {
        name: "SIS GO Isotonic",
        category: "Boisson isotonique",
        rating: 4.3,
        price: "1.80 € /sachet",
        description: "Boisson pratique pour maintenir l'apport en glucides.",
        tags: ["Isotonique", "Hydratation"],
        partner: true,
      },
      {
        name: "SaltStick Caps",
        category: "Électrolytes",
        rating: 4.4,
        price: "0.60 € /capsule",
        description: "Aide à compenser les pertes en sodium sur les efforts longs.",
        tags: ["Sodium", "Endurance"],
        partner: false,
      },
    ],
  },
  {
    title: "Après la course",
    description: "Récupération musculaire et recharge du glycogène.",
    products: [
      {
        name: "Etixx Recovery Shake",
        category: "Boisson récupération",
        rating: 4.5,
        price: "2.90 € /portion",
        description: "Mix glucides et protéines pour relancer la récupération.",
        tags: ["Récupération", "Protéines"],
        partner: true,
      },
      {
        name: "Yopro Drink",
        category: "Boisson protéinée",
        rating: 4.2,
        price: "2.10 € /bouteille",
        description: "Solution simple après la course, riche en protéines.",
        tags: ["Protéines", "Pratique"],
        partner: false,
      },
      {
        name: "Tart Cherry Juice",
        category: "Jus récupération",
        rating: 4.1,
        price: "1.90 € /portion",
        description: "Peut aider à réduire les courbatures après l'effort.",
        tags: ["Antioxydants", "Récup"],
        partner: false,
      },
    ],
  },
];

const gear = [
  {
    name: "Salomon ADV Skin 12",
    category: "Sac d'hydratation",
    rating: 4.8,
    price: "155 €",
    description: "12L avec rangements accessibles et port stable pour les longues sorties.",
    tags: ["Hydratation", "12L", "Trail"],
  },
  {
    name: "Leki Micro Trail Pro",
    category: "Bâtons de trail",
    rating: 4.7,
    price: "129 €",
    description: "Ultra-légers, pliables et efficaces sur fort dénivelé.",
    tags: ["Carbone", "Pliable", "Montagne"],
  },
  {
    name: "HydraPak Soft Flask 500ml",
    category: "Gourdes en plastique",
    rating: 4.5,
    price: "24 €",
    description: "Gourde souple facile à transporter dans un gilet.",
    tags: ["500ml", "Souple", "BPA Free"],
  },
  {
    name: "CamelBak Crux 2L",
    category: "Camel bag",
    rating: 4.6,
    price: "39 €",
    description: "Poche à eau 2L pour rester hydraté sur les sorties longues.",
    tags: ["2L", "Poche à eau", "Hydratation"],
  },
  {
    name: "Petzl Actik Core",
    category: "Lampe frontale",
    rating: 4.6,
    price: "69 €",
    description: "Indispensable pour courir tôt le matin ou tard le soir.",
    tags: ["600 lm", "Rechargeable", "Sécurité"],
  },
  {
    name: "Compressport Pro Racing Socks",
    category: "Chaussettes techniques",
    rating: 4.4,
    price: "19 €",
    description: "Bonne respirabilité et maintien pour limiter les frottements.",
    tags: ["Confort", "Respirant", "Anti-ampoules"],
  },
  {
    name: "Garmin Forerunner 265",
    category: "Montre GPS",
    rating: 4.6,
    price: "399 €",
    description: "Suivi GPS, cardio, charge d'entraînement et navigation.",
    tags: ["GPS", "HRV", "Performance"],
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          className={`h-3 w-3 ${
            step <= Math.round(rating) ? "fill-accent text-accent" : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}</span>
    </div>
  );
}

export default function EquipmentTab() {
  return (
    <Tabs defaultValue="shoes" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="shoes">
          <Footprints className="mr-1 h-4 w-4" /> Chaussures
        </TabsTrigger>
        <TabsTrigger value="nutrition">
          <Utensils className="mr-1 h-4 w-4" /> Nutrition
        </TabsTrigger>
        <TabsTrigger value="gear">Accessoires</TabsTrigger>
      </TabsList>

      <TabsContent value="shoes" className="space-y-3">
        {shoes.map((shoe, index) => {
          const mileagePct = Math.min(100, Math.round((shoe.mileage / shoe.maxMileage) * 100));

          return (
            <ScrollReveal key={shoe.name} delay={index * 0.06}>
              <Card className={shoe.status === "warning" ? "border-destructive/40" : ""}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{shoe.name}</h3>
                        {shoe.status === "warning" && (
                          <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                            <AlertTriangle className="mr-0.5 h-3 w-3" /> Usure
                          </Badge>
                        )}
                        {shoe.status === "recommended" && (
                          <Badge className="bg-accent px-1.5 py-0 text-[10px] text-accent-foreground">
                            Recommandé
                          </Badge>
                        )}
                        {shoe.usageLabel && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                            {shoe.usageLabel}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{shoe.category}</div>
                      <StarRating rating={shoe.rating} />
                    </div>
                    <span className="whitespace-nowrap text-sm font-bold">{shoe.price}</span>
                  </div>

                  <p className="text-xs text-muted-foreground">{shoe.recommendation}</p>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Kilométrage</span>
                      <span className={mileagePct > 80 ? "font-medium text-destructive" : ""}>
                        {shoe.mileage} / {shoe.maxMileage} km
                      </span>
                    </div>
                    <Progress value={mileagePct} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-wrap gap-1">
                      {shoe.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      <ShoppingCart className="mr-1 h-3 w-3" /> Acheter
                    </Button>
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
              <CardContent className="space-y-4 p-4">
                <div>
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>

                <div className="space-y-3">
                  {section.products.map((item) => (
                    <div key={item.name} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold">{item.name}</h4>
                            {item.partner && (
                              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                Partenaire
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                          <StarRating rating={item.rating} />
                        </div>
                        <span className="whitespace-nowrap text-sm font-bold">{item.price}</span>
                      </div>

                      <p className="text-xs text-muted-foreground">{item.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          <ExternalLink className="mr-1 h-3 w-3" /> Voir
                        </Button>
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
        {gear.map((item, index) => (
          <ScrollReveal key={item.name} delay={index * 0.06}>
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{item.name}</h3>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                    <StarRating rating={item.rating} />
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold">{item.price}</span>
                </div>

                <p className="text-xs text-muted-foreground">{item.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">
                    <ShoppingCart className="mr-1 h-3 w-3" /> Acheter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </TabsContent>
    </Tabs>
  );
}
