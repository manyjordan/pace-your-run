import { ScrollReveal } from "@/components/ScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Footprints,
  ShoppingCart,
  Star,
  Utensils,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

const shoes: {
  name: string;
  category: string;
  rating: number;
  price: string;
  tags: string[];
  recommendation: string;
  url: string;
  badge?: string;
}[] = [
  {
    name: "Kiprun KS900 2",
    category: "Entraînement quotidien",
    rating: 4.7,
    price: "130 €",
    tags: ["Amorti", "Confort", "Route"],
    recommendation: "Très bon choix pour les footings, les sorties longues et les semaines chargées.",
    url: "https://www.decathlon.fr/p/chaussure-de-running-homme-kiprun-ks900-2-bleu/_/R-p-341832",
  },
  {
    name: "Kiprun KD900X LD+",
    category: "Compétition route",
    rating: 4.8,
    price: "160 €",
    tags: ["Carbone", "Performance", "Route"],
    recommendation: "Référence Kiprun très bien notée pour viser la performance le jour de course.",
    url: "https://www.decathlon.fr/p/chaussures-running-avec-plaque-carbone-homme-kiprun-kd900x-ld/_/R-p-353062",
  },
  {
    name: "Kiprun KD900 2",
    category: "Tempo et séances soutenues",
    rating: 4.6,
    price: "80 €",
    tags: ["Dynamique", "Rapide", "Route"],
    recommendation: "Très bonne option pour les séances tempo et les entraînements plus rythmés.",
    url: "https://www.decathlon.fr/p/chaussures-running-homme-kiprun-kd900-2/_/R-p-347146",
  },
  {
    name: "Kiprun MT3",
    category: "Trail roulant",
    rating: 4.5,
    price: "90 €",
    tags: ["Trail", "Accroche", "Polyvalente"],
    recommendation: "Modèle Kiprun bien noté pour les chemins roulants et les sorties mixtes.",
    url: "https://www.decathlon.fr/p/mt3-homme-trail-noir-blanc/_/R-p-341192",
  },
];

const nutritionSections: {
  title: string;
  description: string;
  products: {
    name: string;
    category: string;
    rating: number;
    price: string;
    description: string;
    tags: string[];
    partner: boolean;
    url: string;
  }[];
}[] = [
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
        url: "https://www.decathlon.fr/p/gel-energetique-energy-gel-agrumes-4-x-32g/_/R-p-188472",
      },
      {
        name: "Maurten Drink Mix 160",
        category: "Boisson pré-course",
        rating: 4.7,
        price: "3.90 € /portion",
        description: "Apport en glucides facile à digérer avant la course.",
        tags: ["Carburant", "Glucides"],
        partner: true,
        url: "https://www.decathlon.fr/search?Ntt=boisson+energetique+running",
      },
      {
        name: "Powerbar Energize",
        category: "Barre énergie",
        rating: 4.3,
        price: "2.20 € /barre",
        description: "À prendre avant la course pour compléter les réserves.",
        tags: ["Énergie", "Pré-effort"],
        partner: false,
        url: "https://www.decathlon.fr/search?Ntt=barre+energetique+running",
      },
      {
        name: "Compote Andros Sport",
        category: "Purée de fruits",
        rating: 4.1,
        price: "1.60 € /unité",
        description: "Option légère si vous préférez du solide avec des glucides rapides.",
        tags: ["Digestible", "Rapide"],
        partner: false,
        url: "https://www.decathlon.fr/search?Ntt=compote+sport+running",
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
        url: "https://www.decathlon.fr/p/gel-energetique-energy-gel-pomme-4-x-32g/_/R-p-172937",
      },
      {
        name: "SIS GO Isotonic",
        category: "Boisson isotonique",
        rating: 4.3,
        price: "1.80 € /sachet",
        description: "Boisson pratique pour maintenir l'apport en glucides.",
        tags: ["Isotonique", "Hydratation"],
        partner: true,
        url: "https://www.decathlon.fr/p/gel-energetique-energy-gel-pomme-4-x-32g/_/R-p-172937",
      },
      {
        name: "SaltStick Caps",
        category: "Électrolytes",
        rating: 4.4,
        price: "0.60 € /capsule",
        description: "Aide à compenser les pertes en sodium sur les efforts longs.",
        tags: ["Sodium", "Endurance"],
        partner: false,
        url: "https://www.decathlon.fr/search?Ntt=electrolytes+course+sel",
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
        url: "https://www.decathlon.fr/search?Ntt=recuperation+running+proteine",
      },
      {
        name: "Yopro Drink",
        category: "Boisson protéinée",
        rating: 4.2,
        price: "2.10 € /bouteille",
        description: "Solution simple après la course, riche en protéines.",
        tags: ["Protéines", "Pratique"],
        partner: false,
        url: "https://www.decathlon.fr/search?Ntt=recuperation+running+proteine",
      },
      {
        name: "Tart Cherry Juice",
        category: "Jus récupération",
        rating: 4.1,
        price: "1.90 € /portion",
        description: "Peut aider à réduire les courbatures après l'effort.",
        tags: ["Antioxydants", "Récup"],
        partner: false,
        url: "https://www.decathlon.fr/search?Ntt=recuperation+running+proteine",
      },
    ],
  },
];

const gear: {
  name: string;
  category: string;
  rating: number;
  price: string;
  description: string;
  tags: string[];
  url: string;
  badge?: string;
}[] = [
  {
    name: "Decathlon HRM Belt",
    category: "Ceinture cardiaque",
    rating: 4.5,
    price: "35 €",
    description:
      "Ceinture cardiofréquencemètre Bluetooth Smart 4.0 et ANT+. Compatible avec toutes les applications sportives dont Pace.",
    tags: ["Bluetooth", "ANT+", "Running", "Précision"],
    url: "https://www.decathlon.fr/p/hrm-belt-ceinture-cardiofrequencemetre-ant-bluetooth/_/R-p-346657",
    badge: "Recommandé pour Pace",
  },
  {
    name: "Salomon ADV Skin 12",
    category: "Sac d'hydratation",
    rating: 4.8,
    price: "155 €",
    description: "12L avec rangements accessibles et port stable pour les longues sorties.",
    tags: ["Hydratation", "12L", "Trail"],
    url: "https://www.decathlon.fr/search?Ntt=salomon+adv+skin+12",
  },
  {
    name: "Leki Micro Trail Pro",
    category: "Bâtons de trail",
    rating: 4.7,
    price: "129 €",
    description: "Ultra-légers, pliables et efficaces sur fort dénivelé.",
    tags: ["Carbone", "Pliable", "Montagne"],
    url: "https://www.decathlon.fr/search?Ntt=baton+trail+leki",
  },
  {
    name: "HydraPak Soft Flask 500ml",
    category: "Gourde souple",
    rating: 4.5,
    price: "24 €",
    description: "Gourde souple facile à transporter dans un gilet.",
    tags: ["500ml", "Souple", "BPA Free"],
    url: "https://www.decathlon.fr/search?Ntt=gourde+souple+trail",
  },
  {
    name: "CamelBak Crux 2L",
    category: "Poche à eau",
    rating: 4.6,
    price: "39 €",
    description: "Poche à eau 2L pour rester hydraté sur les sorties longues.",
    tags: ["2L", "Poche à eau", "Hydratation"],
    url: "https://www.decathlon.fr/search?Ntt=poche+hydratation+running",
  },
  {
    name: "Petzl Actik Core",
    category: "Lampe frontale",
    rating: 4.6,
    price: "69 €",
    description: "Indispensable pour courir tôt le matin ou tard le soir.",
    tags: ["600 lm", "Rechargeable", "Sécurité"],
    url: "https://www.decathlon.fr/search?Ntt=lampe+frontale+running+rechargeable",
  },
  {
    name: "Compressport Pro Racing Socks",
    category: "Chaussettes techniques",
    rating: 4.4,
    price: "19 €",
    description: "Bonne respirabilité et maintien pour limiter les frottements.",
    tags: ["Confort", "Respirant", "Anti-ampoules"],
    url: "https://www.decathlon.fr/search?Ntt=chaussettes+running+compression",
  },
  {
    name: "Garmin Forerunner 265",
    category: "Montre GPS",
    rating: 4.6,
    price: "399 €",
    description: "Suivi GPS, cardio, charge d'entraînement et navigation.",
    tags: ["GPS", "HRV", "Performance"],
    url: "https://www.decathlon.fr/search?Ntt=garmin+forerunner+265",
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
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const equipmentSubTab =
    sectionParam === "gear" || sectionParam === "nutrition" || sectionParam === "shoes" ? sectionParam : "shoes";

  return (
    <Tabs key={equipmentSubTab} defaultValue={equipmentSubTab} className="space-y-4">
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
        {shoes.map((shoe, index) => (
          <ScrollReveal key={shoe.name} delay={index === 0 ? 0 : index < 3 ? 0.05 : 0}>
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{shoe.name}</h3>
                      {shoe.badge ? (
                        <Badge className="bg-accent px-1.5 py-0 text-[10px] text-accent-foreground">{shoe.badge}</Badge>
                      ) : (
                        <Badge className="bg-accent px-1.5 py-0 text-[10px] text-accent-foreground">
                          Très bien notée
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{shoe.category}</div>
                    <StarRating rating={shoe.rating} />
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold">{shoe.price}</span>
                </div>

                <p className="text-xs text-muted-foreground">{shoe.recommendation}</p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {shoe.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => window.open(shoe.url, "_blank", "noopener,noreferrer")}
                  >
                    <ShoppingCart className="mr-1 h-3 w-3" /> Acheter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </TabsContent>

      <TabsContent value="nutrition" className="space-y-3">
        {nutritionSections.map((section, sectionIndex) => (
          <ScrollReveal key={section.title} delay={sectionIndex === 0 ? 0 : sectionIndex < 3 ? 0.05 : 0}>
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                        >
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
          <ScrollReveal key={item.name} delay={index === 0 ? 0 : index < 3 ? 0.05 : 0}>
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{item.name}</h3>
                      {item.badge ? (
                        <Badge className="bg-accent px-1.5 py-0 text-[10px] text-accent-foreground">{item.badge}</Badge>
                      ) : null}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                  >
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
