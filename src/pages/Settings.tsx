import { ScrollReveal } from "@/components/ScrollReveal";
import { useEffect, useMemo, useState } from "react";
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

const SettingsPage = () => {
  const [stravaConnected, setStravaConnected] = useState(false);
  const [athleteName, setAthleteName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setStravaConnected(Boolean(data.connected));
        setAthleteName(data.athlete ? `${data.athlete.firstname ?? ""} ${data.athlete.lastname ?? ""}`.trim() : null);
      })
      .catch(() => {
        setStravaConnected(false);
        setAthleteName(null);
      });
  }, []);

  const stravaAuthUrl = useMemo(() => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback`;
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=activity:read_all`;
  }, []);

  return (
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
              {group.items.map((item) => {
                if (item.label === "Synchronisation Strava") {
                  return (
                    <a
                      key={item.label}
                      href={stravaAuthUrl}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="text-sm">Connecter mon compte Strava</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${stravaConnected ? "text-lime" : "text-muted-foreground"}`}>
                          {stravaConnected ? (athleteName || "Connecté") : "Non connecté"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </a>
                  );
                }

                return (
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
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
};

export default SettingsPage;
