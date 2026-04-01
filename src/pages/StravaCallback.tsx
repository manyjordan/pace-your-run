import { ScrollReveal } from "@/components/ScrollReveal";
import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const STRAVA_CODE_KEY = "pace-strava-code";

export default function StravaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = useMemo(() => searchParams.get("code"), [searchParams]);

  useEffect(() => {
    if (!code) return;
    window.localStorage.setItem(STRAVA_CODE_KEY, code);
  }, [code]);

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">Connexion Strava</h1>
          {code ? (
            <>
              <p className="text-sm text-muted-foreground">
                Code d'autorisation Strava reçu. La partie front est prête.
              </p>
              <p className="text-xs text-muted-foreground">
                Prochaine étape : brancher un endpoint serveur pour échanger ce code contre un `access_token` sans exposer le secret.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun code Strava reçu.
            </p>
          )}
          <button
            onClick={() => navigate("/settings")}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Retour aux réglages
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
}
