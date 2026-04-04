import { ScrollReveal } from "@/components/ScrollReveal";
import { useEffect, useMemo, useState } from "react";
import { Watch, Bell, Shield, ChevronRight, LogOut, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { connectStrava } from "@/lib/strava";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const settingsGroups = [
  {
    title: "Données",
    icon: Upload,
    items: [
      { label: "Importer l'historique", status: "Strava, Nike, Garmin...", connected: true, isImport: true },
    ],
  },
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
  const [signingOut, setSigningOut] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkStravaConnection = async () => {
      if (!session?.user?.id) return;

      try {
        const { data } = await supabase
          .from("strava_tokens")
          .select("athlete")
          .eq("user_id", session.user.id)
          .single();

        if (data?.athlete) {
          setStravaConnected(true);
          const athlete = data.athlete as { firstname?: string; lastname?: string };
          const fullName = `${athlete.firstname ?? ""} ${athlete.lastname ?? ""}`.trim();
          setAthleteName(fullName);
        } else {
          setStravaConnected(false);
          setAthleteName(null);
        }
      } catch {
        setStravaConnected(false);
        setAthleteName(null);
      }
    };

    checkStravaConnection();
  }, [session?.user?.id]);

  const stravaAuthUrl = useMemo(() => {
    if (!session) return "";
    return connectStrava(session.access_token);
  }, [session]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      if (!session?.access_token) {
        throw new Error("No session found");
      }

      // Call the delete-account Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés.",
      });

      // Sign out and redirect to auth
      await signOut();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

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
              {group.items.map((item: any) => {
                if (item.isImport) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate("/import")}
                      className="w-full flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="text-sm">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.status}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                }

                if (item.label === "Synchronisation Strava") {
                  return (
                    <a
                      key={item.label}
                      href={stravaAuthUrl || "#"}
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

      <ScrollReveal delay={settingsGroups.length * 0.08}>
        <div className="rounded-xl border border-destructive/50 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Se déconnecter</h2>
              <p className="text-xs text-muted-foreground">Quitter votre compte</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Déconnexion..." : "Se déconnecter"}
            </Button>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={(settingsGroups.length + 1) * 0.08}>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold">Légal</h2>
          </div>
          <div className="space-y-1">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <span className="text-sm">Politique de confidentialité</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <span className="text-sm">Conditions d'utilisation</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={(settingsGroups.length + 2) * 0.08}>
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-destructive">Zone de danger</h2>
                <p className="text-xs text-muted-foreground mt-1">Supprimer définitivement votre compte et toutes vos données</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer mon compte"
              )}
            </Button>
          </div>
        </div>
      </ScrollReveal>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr ? Cette action est irréversible. Toutes vos données seront supprimées définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;
