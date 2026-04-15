import { ScrollReveal } from "@/components/ScrollReveal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Watch,
  ChevronRight,
  LogOut,
  Upload,
  AlertTriangle,
  Loader2,
  FileText,
  HeartPulse,
  Apple,
  Database,
  Palette,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { ProfileContent } from "@/components/profile/ProfileContent";
import { useToast } from "@/hooks/use-toast";
import { getDefaultRunPreferences, loadRunPreferences, saveRunPreferences, type RunPreferences } from "@/lib/runPreferences";

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
  const { resolvedTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [runPreferences, setRunPreferences] = useState<RunPreferences>(() => getDefaultRunPreferences());
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setRunPreferences(loadRunPreferences(session?.user?.id ?? null));
  }, [session?.user?.id]);

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        throw new Error("Session expirée. Reconnectez-vous puis réessayez.");
      }
      const { error: fnError } = await supabase.functions.invoke("delete-account", {
        body: { userId: refreshData.session.user.id },
      });
      if (fnError) throw fnError;

      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés.",
      });

      await supabase.auth.signOut({ scope: "local" });
      navigate("/auth", { replace: true });
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer le compte.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Réglages</h1>
      </ScrollReveal>

      <ScrollReveal>
        <ProfileContent compact showDetails={false} />
      </ScrollReveal>

      <ScrollReveal>
        <SettingsSection title="Apparence" icon={Palette}>
          <div className="flex items-center justify-between rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">Thème</p>
              <p className="text-xs text-muted-foreground">
                {resolvedTheme === "dark"
                  ? "Mode sombre activé"
                  : resolvedTheme === "light"
                    ? "Mode clair activé"
                    : "Selon l’appareil"}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </SettingsSection>
      </ScrollReveal>

      <ScrollReveal>
        <SettingsSection title="Données" icon={Database}>
          <NavigationRow
            icon={Upload}
            label="Importer l'historique"
            description="Strava, Nike, Garmin, Apple Health, GPX..."
            onClick={() => navigate("/import")}
          />
        </SettingsSection>
      </ScrollReveal>

      <ScrollReveal>
        <SettingsSection title="Appareils connectés" icon={Watch}>
          <NavigationRow
            icon={Apple}
            label="Importer depuis Apple Santé"
            description="Import par fichier (export.xml) ou import ponctuel depuis l'app Santé sur iPhone"
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

      <ScrollReveal>
        <SettingsSection title="Réglages de course" icon={Watch}>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Alertes d&apos;allure</p>
              <p className="text-xs text-muted-foreground">
                Vous prévient vocalement si votre allure s&apos;écarte de l&apos;objectif lors d&apos;une séance planifiée. Maximum toutes les 15 secondes.
              </p>
            </div>
            <Switch
              checked={runPreferences.paceAlerts}
              onCheckedChange={(checked) => {
                const updated = { ...runPreferences, paceAlerts: checked };
                setRunPreferences(updated);
                saveRunPreferences(updated, session?.user?.id ?? null);
              }}
            />
          </div>
        </SettingsSection>
      </ScrollReveal>

      <ScrollReveal>
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
          <a
            href="/legal"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Mentions légales
          </a>
        </SettingsSection>
      </ScrollReveal>

      <ScrollReveal>
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
