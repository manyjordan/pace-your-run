import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Download, Footprints, Settings, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppCard } from "@/components/ui/page-layout";
import { getAllRunsForStats, getProfile, type ProfileRow, type RunRow, upsertProfile } from "@/lib/database";

function formatPacePerKmFromSeconds(secondsPerKm: number): string {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return "--:--";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function Profile() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    void Promise.all([getProfile(userId), getAllRunsForStats(userId)]).then(([p, r]) => {
      setProfile(p);
      setRuns(r ?? []);
      setFirstName(p?.first_name ?? "");
      setUsername((p?.username ?? "").replace(/^@+/, ""));
      setBio(p?.bio ?? "");
    });
  }, [session?.user?.id]);

  const stats = useMemo(() => {
    if (!runs.length) return null;
    const totalKm = runs.reduce((sum, run) => sum + (run.distance_km ?? 0), 0);
    const totalRuns = runs.length;
    const pacedRuns = runs
      .filter((run) => (run.distance_km ?? 0) >= 3 && (run.duration_seconds ?? 0) > 0)
      .map((run) => (run.duration_seconds ?? 0) / Math.max(run.distance_km ?? 0, 0.001));
    const bestPace = pacedRuns.length > 0 ? Math.min(...pacedRuns) : 0;
    return { totalKm, totalRuns, bestPace };
  }, [runs]);

  const handleSave = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    setIsSaving(true);
    try {
      const updated = await upsertProfile(userId, {
        first_name: firstName.trim() || null,
        username: username.trim().replace(/^@+/, "") || null,
        bio: bio.trim() || null,
      });
      setProfile(updated);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 hover:bg-muted" aria-label="Retour">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 font-semibold text-foreground">Mon profil</h1>
        <button
          onClick={() => (isEditing ? void handleSave() : setIsEditing(true))}
          className="text-sm font-semibold text-accent"
          disabled={isSaving}
        >
          {isEditing ? (isSaving ? "Enregistrement..." : "Enregistrer") : "Modifier"}
        </button>
      </div>

      <div className="space-y-5 px-4 pb-24 pt-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-3xl font-black text-accent">
            {(firstName.charAt(0) || profile?.first_name?.charAt(0) || "?").toUpperCase()}
          </div>
          {isEditing ? (
            <div className="w-full space-y-2">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
                className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm"
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@pseudo"
                className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio (ex: Marathon 3h30 | Paris)"
                rows={2}
                className="w-full resize-none rounded-xl bg-muted px-4 py-2.5 text-sm"
              />
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{firstName || profile?.first_name || "Mon profil"}</p>
              {(username || profile?.username) && <p className="text-sm text-muted-foreground">@{username || profile?.username}</p>}
              {(bio || profile?.bio) && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{bio || profile?.bio}</p>}
            </div>
          )}
        </div>

        {stats ? (
          <div className="grid grid-cols-3 gap-3">
            <AppCard className="py-4 text-center">
              <p className="font-metric text-xl font-black text-foreground">{Math.round(stats.totalKm)}</p>
              <p className="mt-1 text-xs text-muted-foreground">km total</p>
            </AppCard>
            <AppCard className="py-4 text-center">
              <p className="font-metric text-xl font-black text-foreground">{stats.totalRuns}</p>
              <p className="mt-1 text-xs text-muted-foreground">courses</p>
            </AppCard>
            <AppCard className="py-4 text-center">
              <p className="font-metric text-xl font-black text-accent">{formatPacePerKmFromSeconds(stats.bestPace)}</p>
              <p className="mt-1 text-xs text-muted-foreground">meilleure allure</p>
            </AppCard>
          </div>
        ) : null}

        {profile?.goal_type && profile.goal_type !== "none" ? (
          <AppCard className="border-accent/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Objectif actuel</p>
                <p className="font-semibold text-foreground">{profile.goal_type}</p>
              </div>
            </div>
          </AppCard>
        ) : null}

        <AppCard className="divide-y divide-border overflow-hidden p-0">
          {[
            { icon: Footprints, label: "Mes chaussures", path: "/shoes" },
            { icon: Settings, label: "Paramètres", path: "/settings" },
            { icon: Download, label: "Importer des courses", path: "/import" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </AppCard>

        <button onClick={() => void signOut()} className="w-full py-3 text-center text-sm font-medium text-destructive">
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
