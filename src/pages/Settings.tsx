import { ScrollReveal } from "@/components/ScrollReveal";
import { Watch, Bell, Shield, ChevronRight } from "lucide-react";

const settingsGroups = [
  {
    title: "Appareils connectés",
    icon: Watch,
    items: [
      { label: "Garmin Connect", status: "Connecté", connected: true },
      { label: "Apple Watch", status: "Non connecté", connected: false },
      { label: "Synchronisation Strava", status: "Connecté", connected: true },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    items: [
      { label: "Rappels d'entraînement", status: "Activé", connected: true },
      { label: "Alertes de course", status: "Activé", connected: true },
      { label: "Activité sociale", status: "Désactivé", connected: false },
    ],
  },
  {
    title: "Confidentialité",
    icon: Shield,
    items: [
      { label: "Visibilité du profil", status: "Amis uniquement", connected: true },
      { label: "Partage d'activité", status: "Public", connected: true },
      { label: "Export des données", status: "", connected: true },
    ],
  },
];

const SettingsPage = () => (
  <div className="space-y-6">
    <ScrollReveal>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Réglages</h1>
    </ScrollReveal>

    {settingsGroups.map((group, gi) => (
      <ScrollReveal key={group.title} delay={gi * 0.08}>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <group.icon className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold">{group.title}</h2>
          </div>
          <div className="space-y-1">
            {group.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.status && (
                    <span className={`text-xs ${item.connected ? "text-lime" : "text-muted-foreground"}`}>
                      {item.status}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    ))}
  </div>
);

export default SettingsPage;
