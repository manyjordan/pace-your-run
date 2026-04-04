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
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Give Supabase a moment to process the auth state change from the URL hash
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check the current session
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError("Une erreur s'est produite lors de la confirmation du compte.");
          setIsProcessing(false);
          setHasChecked(true);
          return;
        }

        if (data.session) {
          // Email confirmed successfully
          setConfirmationSuccess(true);
          setIsProcessing(false);
          setHasChecked(true);
          
          // Redirect after showing the success message
          setTimeout(() => {
            navigate("/");
          }, 2500);
        } else {
          setError("Impossible de confirmer l'email. Veuillez réessayer.");
          setIsProcessing(false);
          setHasChecked(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur s'est produite.");
        setIsProcessing(false);
        setHasChecked(true);
      }
    };

    // Check if auth is still loading
    if (!authLoading && !hasChecked) {
      if (session) {
        // User already has a session (email already confirmed or auto-logged in)
        setConfirmationSuccess(true);
        setIsProcessing(false);
        setHasChecked(true);
        
        setTimeout(() => {
          navigate("/");
        }, 2500);
      } else {
        // No session yet, try to handle confirmation
        handleEmailConfirmation();
      }
    }
  }, [authLoading, session, navigate, hasChecked]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Confirmation d'email</CardTitle>
          <CardDescription>Finalisation de votre compte</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {(isProcessing || authLoading) && !error && !confirmationSuccess && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="text-sm text-muted-foreground">Confirmation de votre email en cours...</p>
            </div>
          )}

          {confirmationSuccess && !error && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <div className="font-semibold">✓ Email confirmé !</div>
                <div className="mt-2 text-sm">Votre compte est maintenant activé.</div>
                <div className="mt-2 text-sm">Redirection en cours...</div>
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
