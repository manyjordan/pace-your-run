import { ScrollReveal } from "@/components/ScrollReveal";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Watch,
  ChevronRight,
  LogOut,
  Upload,
  AlertTriangle,
  Loader2,
  FileText,
  User,
  HeartPulse,
  Apple,
  Database,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { connectStrava } from "@/lib/strava";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { getProfile, type ProfileRow } from "@/lib/database";
import { getInitials } from "@/lib/strava";

function formatMemberSince(date?: string | null) {
  if (!date) return "Date d'inscription indisponible";

  return `Membre depuis ${new Date(date).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })}`;
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        connected ? "bg-emerald-500" : "bg-muted-foreground/40"
      }`}
      aria-hidden="true"
    />
  );
}

type NavigationRowProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick: () => void;
};

function NavigationRow({ icon: Icon, label, description, onClick }: NavigationRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="rounded-lg bg-secondary p-2">
          <Icon className="h-4 w-4 text-[hsl(var(--accent))]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

type SectionProps = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  destructive?: boolean;
};

function SettingsSection({ title, icon: Icon, children, destructive = false }: SectionProps) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${destructive ? "border-destructive/40" : "border-border"}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${destructive ? "text-destructive" : "text-[hsl(var(--accent))]"}`} />
        <h2 className={`text-sm font-semibold ${destructive ? "text-destructive" : ""}`}>{title}</h2>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

const SettingsPage = () => {
  const [stravaConnected, setStravaConnected] = useState(false);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [disconnectingStrava, setDisconnectingStrava] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { signOut, session, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
      const data = await getProfile(session.user.id);
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [session?.user?.id]);

  const checkStravaConnection = useCallback(async () => {
    if (!session?.user?.id) {
      setStravaConnected(false);
      setAthleteName(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("strava_tokens")
        .select("athlete")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.athlete) {
        setStravaConnected(true);
        const athlete = data.athlete as { firstname?: string; lastname?: string };
        const fullName = `${athlete.firstname ?? ""} ${athlete.lastname ?? ""}`.trim();
        setAthleteName(fullName || "Compte Strava connecté");
      } else {
        setStravaConnected(false);
        setAthleteName(null);
      }
    } catch (error) {
      console.error("Error checking Strava connection:", error);
      setStravaConnected(false);
      setAthleteName(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void loadProfile();
    void checkStravaConnection();
  }, [loadProfile, checkStravaConnection]);

  const stravaAuthUrl = useMemo(() => {
    if (!session) return "";
    return connectStrava(session.access_token);
  }, [session]);

  const displayName = profile?.first_name?.trim() || user?.email || "Utilisateur";
  const initialsSource = profile?.first_name?.trim() || user?.email?.[0]?.toUpperCase() || "P";
  const avatarInitials =
    profile?.first_name?.trim()
      ? getInitials(profile.first_name)
      : initialsSource.slice(0, 1).toUpperCase();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vous déconnecter pour le moment.",
        variant: "destructive",
      });
    } finally {
      setSigningOut(false);
      setSignOutDialogOpen(false);
    }
  };

  const handleDisconnectStrava = async () => {
    if (!session?.user?.id) return;

    try {
      setDisconnectingStrava(true);
      const { error } = await supabase
        .from("strava_tokens")
        .delete()
        .eq("user_id", session.user.id);

      if (error) throw error;

      setStravaConnected(false);
      setAthleteName(null);
      toast({
        title: "Strava déconnecté",
        description: "Votre synchronisation Strava a bien été supprimée.",
      });
    } catch (error) {
      console.error("Error disconnecting Strava:", error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter Strava pour le moment.",
        variant: "destructive",
      });
    } finally {
      setDisconnectingStrava(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      if (!session) {
        throw new Error("Session introuvable");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(async () => {
          const fallbackText = await response.text().catch(() => "");
          return fallbackText ? { details: fallbackText } : null;
        });
        throw new Error(
          errorPayload?.details ||
            errorPayload?.error ||
            "Failed to delete account",
        );
      }

      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés.",
      });

      setDeleteDialogOpen(false);

      // Clear the local session after the server-side account deletion.
      await supabase.auth.signOut({ scope: "local" }).catch((error) => {
        console.warn("Local sign out after account deletion failed:", error);
      });

      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer le compte. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Réglages</h1>
      </ScrollReveal>

      <ScrollReveal delay={0.04}>
        <div className="rounded-2xl border border-[hsl(var(--accent))]/30 bg-card p-5 shadow-[0_0_0_1px_hsl(var(--accent))/0.08]">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-[hsl(var(--accent))]/30">
              <AvatarFallback className="bg-[hsl(var(--accent))]/15 font-semibold text-[hsl(var(--accent))]">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{displayName}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email ?? "Email indisponible"}</p>
              <p className="text-xs text-muted-foreground">
                {loadingProfile ? "Chargement du profil..." : formatMemberSince(user?.created_at)}
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.08}>
        <SettingsSection title="Données" icon={Database}>
          <NavigationRow
            icon={Upload}
            label="Importer l'historique"
            description="Strava, Nike, Garmin, Apple Health, GPX..."
            onClick={() => navigate("/import")}
          />
        </SettingsSection>
      </ScrollReveal>

      <ScrollReveal delay={0.16}>
        <SettingsSection title="Appareils connectés" icon={Watch}>
          <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50">
            <div className="flex min-w-0 items-start gap-3">
              <div className="rounded-lg bg-secondary p-2">
                <Watch className="h-4 w-4 text-[hsl(var(--accent))]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Synchronisation Strava</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusDot connected={stravaConnected} />
                  <span>{stravaConnected ? athleteName || "Connecté" : "Non connecté"}</span>
                </div>
              </div>
            </div>
            {stravaConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleDisconnectStrava()}
                disabled={disconnectingStrava}
              >
                {disconnectingStrava ? "Déconnexion..." : "Déconnecter"}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-[hsl(var(--accent))] text-accent-foreground hover:bg-[hsl(var(--accent))]/90"
                onClick={() => {
                  if (stravaAuthUrl) {
                    window.location.href = stravaAuthUrl;
                  }
                }}
                disabled={!stravaAuthUrl}
              >
                Connecter
              </Button>
            )}
          </div>

          <NavigationRow
            icon={Apple}
            label="Apple Santé & Apple Watch"
            description="Synchronisez vos données santé et vos courses iPhone"
            onClick={() => navigate("/healthkit")}
          />

          <NavigationRow
            icon={HeartPulse}
            label="Capteur cardiaque Bluetooth"
            description="Connectez votre capteur depuis l'écran de course"
            onClick={() => navigate("/run")}
          />
        </SettingsSection>
      </ScrollReveal>

      <ScrollReveal delay={0.24}>
        <SettingsSection title="Mon compte" icon={User}>
          <div className="flex items-center justify-between rounded-lg p-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="rounded-lg bg-secondary p-2">
                <User className="h-4 w-4 text-[hsl(var(--accent))]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Adresse email</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? "Email indisponible"}</p>
              </div>
            </div>
          </div>

          <NavigationRow
            icon={User}
            label="Modifier mon profil"
            description="Mettre à jour vos informations personnelles"
            onClick={() => navigate("/profile")}
          />
        </SettingsSection>
      </ScrollReveal>

      <ScrollReveal delay={0.32}>
        <SettingsSection title="Légal" icon={FileText}>
          <NavigationRow
            icon={FileText}
            label="Politique de confidentialité"
            onClick={() => navigate("/privacy")}
          />

          <NavigationRow
            icon={FileText}
            label="Conditions d'utilisation"
            onClick={() => navigate("/terms")}
          />
        </SettingsSection>
      </ScrollReveal>

      <ScrollReveal delay={0.4}>
        <SettingsSection title="Zone de danger" icon={AlertTriangle} destructive>
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div>
              <h3 className="text-sm font-medium">Se déconnecter</h3>
              <p className="text-xs text-muted-foreground">Quitter votre compte en toute sécurité</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setSignOutDialogOpen(true)}
              disabled={signingOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Déconnexion..." : "Se déconnecter"}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <h3 className="text-sm font-medium text-destructive">Supprimer mon compte</h3>
                <p className="text-xs text-muted-foreground">
                  Supprimer définitivement votre compte et toutes vos données
                </p>
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
        </SettingsSection>
      </ScrollReveal>

      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous devrez vous reconnecter pour accéder à votre compte et à vos données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={signingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {signingOut ? "Déconnexion..." : "Se déconnecter"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
