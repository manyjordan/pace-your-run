import { ScrollReveal } from "@/components/ScrollReveal";
import { Check, X, Zap, Crown, Star } from "lucide-react";

const tiers = [
  {
    name: "Runner",
    price: "Free",
    period: "",
    description: "Get started with the basics",
    icon: Star,
    features: [
      { text: "Basic dashboard & manual logging", included: true },
      { text: "Last 90 days performance data", included: true },
      { text: "3 saved routes", included: true },
      { text: "Community feed (read-only)", included: true },
      { text: "Race finder (browsing)", included: true },
      { text: "AI training plans", included: false },
      { text: "Injury checker", included: false },
      { text: "Wearable sync", included: false },
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pace Pro",
    price: "€9.99",
    period: "/month",
    yearlyPrice: "€79/year",
    description: "For dedicated runners chasing PRs",
    icon: Zap,
    features: [
      { text: "Full Performance Hub", included: true },
      { text: "AI Training Plan generator", included: true },
      { text: "Dynamic plan adjustment", included: true },
      { text: "Injury checker & recovery", included: true },
      { text: "Race readiness AI", included: true },
      { text: "Unlimited routes & builder", included: true },
      { text: "Wearable sync (Garmin, Apple…)", included: true },
      { text: "Full social & challenges", included: true },
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Pace Elite",
    price: "€24.99",
    period: "/month",
    yearlyPrice: "€199/year",
    description: "Maximum performance, personal coaching",
    icon: Crown,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Weekly AI coaching debrief", included: true },
      { text: "Biomechanics gait analysis", included: true },
      { text: "Nutrition planner", included: true },
      { text: "1-on-1 monthly coach call", included: true },
      { text: "Early access to features", included: true },
      { text: "Elite athlete content", included: true },
      { text: "Race concierge service", included: true },
    ],
    cta: "Go Elite",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="space-y-8">
      <ScrollReveal>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Choose Your <span className="text-lime">Pace</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every run. Every goal. Every detail.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier, i) => (
          <ScrollReveal key={tier.name} delay={i * 0.1}>
            <div
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-xl ${
                tier.highlighted
                  ? "border-accent bg-card glow-lime"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-foreground">
                  Most Popular
                </div>
              )}
              <tier.icon className={`h-6 w-6 ${tier.highlighted ? "text-lime" : "text-muted-foreground"}`} />
              <h2 className="mt-3 text-lg font-bold">{tier.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{tier.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-black tabular-nums">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.period}</span>
                {tier.yearlyPrice && (
                  <p className="mt-0.5 text-xs text-muted-foreground">or {tier.yearlyPrice}</p>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={f.included ? "" : "text-muted-foreground/60"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition-transform active:scale-[0.97] ${
                  tier.highlighted
                    ? "bg-accent text-accent-foreground"
                    : "border border-border bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {tier.cta}
              </button>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
