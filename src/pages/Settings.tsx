import { ScrollReveal } from "@/components/ScrollReveal";
import { Watch, Bell, Shield, Palette, ChevronRight } from "lucide-react";

const settingsGroups = [
  {
    title: "Connected Devices",
    icon: Watch,
    items: [
      { label: "Garmin Connect", status: "Connected", connected: true },
      { label: "Apple Watch", status: "Not connected", connected: false },
      { label: "Strava Sync", status: "Connected", connected: true },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    items: [
      { label: "Training Reminders", status: "Enabled", connected: true },
      { label: "Race Alerts", status: "Enabled", connected: true },
      { label: "Social Activity", status: "Disabled", connected: false },
    ],
  },
  {
    title: "Privacy",
    icon: Shield,
    items: [
      { label: "Profile Visibility", status: "Friends Only", connected: true },
      { label: "Activity Sharing", status: "Public", connected: true },
      { label: "Data Export", status: "", connected: true },
    ],
  },
];

const SettingsPage = () => (
  <div className="space-y-6">
    <ScrollReveal>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
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
