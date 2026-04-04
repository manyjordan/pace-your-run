import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const EmailConfirmation = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Supabase automatically handles the hash on the URL (#access_token=...)
        // when onAuthStateChange is called
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setError("Une erreur s'est produite lors de la confirmation du compte.");
          setIsProcessing(false);
          return;
        }

        if (data.session) {
          // Email confirmed successfully, redirect after a brief delay
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          setError("Impossible de confirmer l'email. Veuillez réessayer.");
          setIsProcessing(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur s'est produite.");
        setIsProcessing(false);
      }
    };

    if (!authLoading) {
      if (session) {
        // User already has a session, redirect to home
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        handleEmailConfirmation();
      }
    }
  }, [authLoading, session, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Confirmation d'email</CardTitle>
          <CardDescription>Finalisation de votre compte</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isProcessing && !error && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="text-sm text-muted-foreground">Confirmation de votre email en cours...</p>
            </div>
          )}

          {!isProcessing && !error && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <div className="font-semibold">Email confirmé !</div>
                <div>Votre compte est maintenant activé. Redirection en cours...</div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;
